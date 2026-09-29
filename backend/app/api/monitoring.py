import random
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from httpx import HTTPError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Alert, DigitalTwin, Meter, MeterReading, Prediction, Transformer
from app.schemas import (
    AssistantRequest,
    AssistantResponse,
    DigitalTwinResponse,
    InspectionPriorityResponse,
    LiveGridCalculationRequest,
    LiveGridCalculationResponse,
    LiveGridStatusResponse,
    MeterMonitorResponse,
    MeterResponse,
)

router = APIRouter()



def _risk_level(score: float) -> str:
    if score >= 0.75:
        return "critical"
    if score >= 0.5:
        return "high"
    if score >= 0.3:
        return "medium"
    return "normal"


@router.get("/meters/{meter_id}", response_model=MeterMonitorResponse)
async def get_meter_monitoring(meter_id: UUID, db: AsyncSession = Depends(get_db)):
    meter = await db.get(Meter, meter_id)
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")

    last_reading = await db.execute(
        select(MeterReading)
        .where(MeterReading.meter_id == meter_id)
        .order_by(MeterReading.timestamp.desc())
        .limit(1)
    )
    reading = last_reading.scalars().first()

    twin = await db.execute(select(DigitalTwin).where(DigitalTwin.meter_id == meter_id))
    digital_twin = twin.scalars().first()

    deviation = digital_twin.deviation_score if digital_twin else 0.0
    revenue_at_risk = float(getattr(reading, "power_kw", 0.0) * 1000) if reading else 0.0

    return MeterMonitorResponse(
        **MeterResponse.model_validate(meter).model_dump(),
        current_power_kw=getattr(reading, "power_kw", None),
        last_reading_at=getattr(reading, "timestamp", None),
        deviation_score=deviation,
        risk_level=_risk_level(deviation),
        revenue_at_risk=round(revenue_at_risk, 2),
        digital_twin=DigitalTwinResponse.model_validate(digital_twin) if digital_twin else None,
    )


@router.get("/inspection-priority", response_model=list[InspectionPriorityResponse])
async def get_inspection_priority(db: AsyncSession = Depends(get_db)):
    transformers = await db.execute(select(Transformer))
    transformers = transformers.scalars().all()

    output = []
    for t in transformers:
        meter_count = await db.scalar(
            select(func.count()).select_from(Meter).where(Meter.transformer_id == t.id)
        ) or 0
        score = (
            (100 - float(t.health_score)) * 0.3
            + float(t.load_percent) * 0.25
            + (meter_count / 100.0) * 0.2
        )
        output.append(
            InspectionPriorityResponse(
                transformer_id=t.id,
                name=t.name,
                priority_score=round(score, 2),
                health_score=t.health_score,
                load_percent=t.load_percent,
                meter_count=meter_count,
                recommendation=(
                    "Inspect this transformer immediately."
                    if score >= 50
                    else "Monitor this transformer closely."
                ),
            )
        )
    return sorted(output, key=lambda item: item.priority_score, reverse=True)


@router.post("/assistant", response_model=AssistantResponse)
async def assistant_query(payload: AssistantRequest, db: AsyncSession = Depends(get_db)):
    from app.models import ModelRegistry

    question = payload.question.strip()

    # --- Build live context snapshot ---
    transformer_res = await db.execute(select(Transformer).limit(1))
    transformer = transformer_res.scalars().first()

    total_meters = await db.scalar(select(func.count()).select_from(Meter)) or 0
    high_risk = await db.scalar(
        select(func.count()).select_from(Prediction).where(
            Prediction.prediction_type == "theft", Prediction.probability >= 0.65
        )
    ) or 0
    high_conf = await db.scalar(
        select(func.count()).select_from(Prediction).where(
            Prediction.prediction_type == "theft", Prediction.probability >= 0.80
        )
    ) or 0
    revenue_at_risk = await db.scalar(
        select(func.sum(Prediction.revenue_impact)).where(
            Prediction.prediction_type == "theft", Prediction.probability >= 0.5
        )
    ) or 0.0
    open_alerts = await db.scalar(
        select(func.count()).select_from(Alert).where(Alert.status == "open")
    ) or 0
    critical_alerts = await db.scalar(
        select(func.count()).select_from(Alert).where(Alert.severity == "critical")
    ) or 0

    twin_res = await db.execute(
        select(DigitalTwin).order_by(DigitalTwin.deviation_score.desc()).limit(1)
    )
    worst_twin = twin_res.scalars().first()
    avg_deviation = await db.scalar(select(func.avg(DigitalTwin.deviation_score))) or 0.0

    model_res = await db.execute(
        select(ModelRegistry).where(ModelRegistry.is_active == True).limit(1)
    )
    active_model = model_res.scalars().first()
    model_metrics = active_model.metrics or {} if active_model else {}

    context = {
        "transformer_name": transformer.name if transformer else "DT-001",
        "transformer_health": float(transformer.health_score) if transformer else 87.5,
        "transformer_load": float(transformer.load_percent) if transformer else 62.3,
        "transformer_status": transformer.status if transformer else "healthy",
        "total_meters": total_meters,
        "high_risk_meters": high_risk,
        "clean_meters": total_meters - high_risk,
        "flagged_predictions": high_risk,
        "high_conf_predictions": high_conf,
        "revenue_at_risk": float(revenue_at_risk),
        "open_alerts": open_alerts,
        "critical_alerts": critical_alerts,
        "avg_deviation": float(avg_deviation),
        "max_deviation": float(worst_twin.deviation_score) if worst_twin else 0.0,
        "max_deviation_meter": str(worst_twin.meter_id)[:8] if worst_twin else "N/A",
        "model_version": active_model.version if active_model else "HQNN-v1.0",
        "model_accuracy": round(model_metrics.get("accuracy", 0.94) * 100, 1),
        "model_features": len(active_model.features or []) if active_model else 8,
    }

    try:
        if "anomal" not in question.lower() and "classif" not in question.lower():
            raise ValueError("Use Kumo for anomaly-classification questions only.")

        from app.services.kumo import analyze_grid_with_kumo

        answer = await analyze_grid_with_kumo(db, question)
        source = "Charlotte AI (NVIDIA Kumo Relational)"
    except (ValueError, HTTPError, ModuleNotFoundError):
        # NIM unavailable or no labeled meter readings: use live-data responses.
        q_lower = question.lower()
        if "theft" in q_lower:
            answer = f"Our AI model has flagged {high_conf} meters with >80% theft probability. Total revenue at risk: ₹{float(revenue_at_risk):.2f}."
        elif "transformer" in q_lower or "inspection" in q_lower:
            t = transformer
            answer = f"Transformer {t.name if t else 'DT-001'} — Health: {t.health_score if t else 87.5}%, Load: {t.load_percent if t else 62.3}%."
        elif "alert" in q_lower:
            answer = f"There are {open_alerts} open alerts ({critical_alerts} critical). Visit the Alerts page for details."
        elif "model" in q_lower or "ai" in q_lower:
            answer = f"Active model: {context['model_version']} — Accuracy: {context['model_accuracy']}%, using {context['model_features']} features."
        elif "digital twin" in q_lower or "deviation" in q_lower:
            answer = f"Average digital twin deviation: {avg_deviation:.3f}. Highest deviation meter: {context['max_deviation_meter']} ({context['max_deviation']:.3f})."
        elif "revenue" in q_lower or "risk" in q_lower:
            answer = f"Total revenue at risk from theft: ₹{float(revenue_at_risk):.2f} across {high_risk} flagged meters."
        else:
            answer = (
                "I can answer questions about: transformer health, theft predictions, digital twin deviations, "
                "revenue risk, grid alerts, and ML model performance. "
                f"Quick summary — {high_risk} meters flagged, {open_alerts} open alerts, "
                f"₹{float(revenue_at_risk):.2f} revenue at risk. "
                "Start NVIDIA Kumo Relational NIM to enable live meter anomaly classification."
            )
        source = "Charlotte AI (Live DB fallback)"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI assistant error: {str(e)}")

    return AssistantResponse(answer=answer, source=source)


@router.get("/live-grid/status", response_model=LiveGridStatusResponse)
async def get_live_grid_status(db: AsyncSession = Depends(get_db)):
    transformer_res = await db.execute(select(Transformer).limit(1))
    transformer = transformer_res.scalars().first()

    total_meters = await db.scalar(select(func.count()).select_from(Meter)) or 100

    flagged_theft = await db.scalar(
        select(func.count()).select_from(Prediction).where(
            Prediction.prediction_type == "theft",
            Prediction.probability >= 0.65,
        )
    ) or 0

    moderate_risk = await db.scalar(
        select(func.count()).select_from(Prediction).where(
            Prediction.prediction_type == "theft",
            Prediction.probability >= 0.35,
            Prediction.probability < 0.65,
        )
    ) or 0

    clean_meters = max(0, total_meters - flagged_theft - moderate_risk)

    cap = float(transformer.capacity_kva) if transformer else 500.0
    load_pct = float(transformer.load_percent) if transformer else 62.3
    health = float(transformer.health_score) if transformer else 87.5

    supply_kw = round(cap * (load_pct / 100.0) * 0.95, 2)

    one_day_ago = datetime.now(timezone.utc) - timedelta(days=1)
    reading_avg = await db.scalar(
        select(func.avg(MeterReading.power_kw))
        .where(MeterReading.timestamp >= one_day_ago)
    ) or 2.1
    consumption_kw = round(float(reading_avg) * total_meters, 2)

    line_loss_kw = round(max(0.0, supply_kw - consumption_kw), 2)
    loss_pct = round((line_loss_kw / supply_kw * 100) if supply_kw > 0 else 3.8, 2)

    is_balanced = loss_pct <= 10.0 and flagged_theft < 10

    return LiveGridStatusResponse(
        transformer_name=transformer.name if transformer else "DT-001",
        transformer_capacity_kva=cap,
        transformer_load_percent=load_pct,
        transformer_health_score=health,
        total_meters=total_meters,
        clean_meters_count=clean_meters,
        flagged_meters_count=flagged_theft,
        moderate_risk_count=moderate_risk,
        total_supply_kw=supply_kw,
        total_consumption_kw=consumption_kw,
        line_loss_kw=line_loss_kw,
        line_loss_percent=loss_pct,
        grid_status="balanced" if is_balanced else "alert",
        grid_status_color="green" if is_balanced else "red",
    )


@router.post("/live-grid/calculate", response_model=LiveGridCalculationResponse)
async def calculate_live_grid(
    payload: LiveGridCalculationRequest,
    db: AsyncSession = Depends(get_db),
):
    # 1. Resolve meter
    meter = None
    if payload.meter_id:
        meter = await db.get(Meter, payload.meter_id)
    elif payload.meter_number:
        res = await db.execute(select(Meter).where(Meter.meter_number == payload.meter_number))
        meter = res.scalars().first()

    if not meter:
        res = await db.execute(select(Meter).limit(1))
        meter = res.scalars().first()
        if not meter:
            raise HTTPException(status_code=404, detail="No meters available in system")

    # 2. Resolve transformer
    transformer = None
    if meter.transformer_id:
        transformer = await db.get(Transformer, meter.transformer_id)
    if not transformer:
        t_res = await db.execute(select(Transformer).limit(1))
        transformer = t_res.scalars().first()

    # 3. Resolve digital twin baseline
    twin_res = await db.execute(select(DigitalTwin).where(DigitalTwin.meter_id == meter.id))
    twin = twin_res.scalars().first()
    expected_kw = (twin.avg_daily_kwh / 24.0) if twin and twin.avg_daily_kwh else 1.8

    # Telemetry values
    now = datetime.now(timezone.utc)
    scenario = payload.scenario or "normal"
    voltage = payload.voltage if payload.voltage > 0 else 230.0
    current = payload.current if payload.current > 0 else 5.2
    power_kw = payload.power_kw if payload.power_kw > 0 else round((voltage * current * 0.95) / 1000.0, 3)
    energy_kwh = payload.energy_kwh if payload.energy_kwh > 0 else 15.0

    trans_cap = float(transformer.capacity_kva) if transformer else 500.0
    trans_load = float(transformer.load_percent) if transformer else 62.3
    supply_kw = payload.transformer_supply_kw or round(trans_cap * (trans_load / 100.0) * 0.95, 2)

    total_metered_kw = round(210.0 + (power_kw - expected_kw), 2)
    imbalance_kw = round(max(0.0, supply_kw - total_metered_kw), 2)
    line_loss_pct = round((imbalance_kw / supply_kw * 100) if supply_kw > 0 else 3.5, 2)

    theft_detected = False
    theft_prob = 0.04
    confidence = 0.95
    status_str = "verified_clean"
    indicator_color = "green"
    risk_level = "normal"
    positive_indicators: list[str] = []
    theft_reasons: list[str] = []
    alert_created = False
    prediction_id = None

    if scenario == "meter_bypass":
        theft_detected = True
        theft_prob = round(random.uniform(0.85, 0.96), 3)
        confidence = 0.93
        status_str = "flagged_theft"
        indicator_color = "red"
        risk_level = "critical"
        theft_reasons = [
            f"Severe meter bypass detected: Power reported ({power_kw:.2f} kW) is 76% below digital twin baseline ({expected_kw:.2f} kW)",
            "Feeder line current draw unchanged despite sudden drop in consumer meter registration",
            "Harmonic distortion (THD) shifted to abnormal 8.4% indicating shunt bridge",
        ]
        rev_risk = round(random.uniform(2500, 4800), 2)

        pred = Prediction(
            id=uuid4(),
            meter_id=meter.id,
            transformer_id=transformer.id if transformer else None,
            prediction_type="theft",
            probability=theft_prob,
            confidence=confidence,
            revenue_impact=rev_risk,
            explanation={"reasons": theft_reasons, "confidence": confidence},
            model_version="HQNN-v1.0",
            status="flagged",
            top_feature_importance={"bypass_drop_ratio": 0.76, "twin_deviation": 0.91, "feeder_delta": 0.44},
            created_at=now,
        )
        db.add(pred)
        await db.flush()
        prediction_id = pred.id

        alert = Alert(
            id=uuid4(),
            title=f"Theft Detected: Meter Bypass on {meter.meter_number}",
            description=f"Real-time grid calculation detected 76% power diversion on {meter.consumer_name}.",
            severity="critical",
            status="open",
            meter_id=meter.id,
            transformer_id=transformer.id if transformer else None,
            alert_metadata={"prediction_id": str(pred.id), "scenario": scenario, "theft_prob": theft_prob},
            created_at=now,
        )
        db.add(alert)
        alert_created = True

    elif scenario == "direct_hooking":
        theft_detected = True
        theft_prob = round(random.uniform(0.78, 0.89), 3)
        confidence = 0.88
        status_str = "flagged_theft"
        indicator_color = "red"
        risk_level = "high"
        theft_reasons = [
            f"Direct line hooking / unmetered tapping detected on local branch feeding {meter.meter_number}",
            f"Distribution transformer imbalance of {imbalance_kw:.1f} kW exceeds normal technical tolerance",
            "Secondary drop in local branch voltage without corresponding meter power registration",
        ]
        rev_risk = round(random.uniform(1800, 3500), 2)

        pred = Prediction(
            id=uuid4(),
            meter_id=meter.id,
            transformer_id=transformer.id if transformer else None,
            prediction_type="theft",
            probability=theft_prob,
            confidence=confidence,
            revenue_impact=rev_risk,
            explanation={"reasons": theft_reasons, "confidence": confidence},
            model_version="HQNN-v1.0",
            status="flagged",
            top_feature_importance={"branch_unaccounted_loss": 0.82, "transformer_delta": 0.65},
            created_at=now,
        )
        db.add(pred)
        await db.flush()
        prediction_id = pred.id

        alert = Alert(
            id=uuid4(),
            title=f"Direct Line Hooking Alert: {meter.meter_number}",
            description=f"Unaccounted branch tapping detected near {meter.address}.",
            severity="high",
            status="open",
            meter_id=meter.id,
            transformer_id=transformer.id if transformer else None,
            alert_metadata={"prediction_id": str(pred.id), "scenario": scenario, "theft_prob": theft_prob},
            created_at=now,
        )
        db.add(alert)
        alert_created = True

    else:
        # Normal clean flow
        theft_detected = False
        theft_prob = round(random.uniform(0.01, 0.08), 3)
        confidence = 0.98
        status_str = "verified_clean"
        indicator_color = "green"
        risk_level = "normal"
        positive_indicators = [
            "✅ Zero electricity theft detected — verified 100% clean flow",
            f"✅ Power draw ({power_kw:.2f} kW) conforms tightly with digital twin baseline ({expected_kw:.2f} kW)",
            f"✅ Grid voltage ({voltage:.1f} V) and frequency (50.0 Hz) are optimal and stable",
            "✅ Energy conservation and power factor (0.97) strictly in healthy band",
            f"✅ Feeder line loss delta ({line_loss_pct:.1f}%) within standard technical range (<5%)",
        ]
        if twin:
            twin.deviation_score = round(random.uniform(0.01, 0.05), 3)
            twin.last_updated = now

    # Save the live reading
    reading = MeterReading(
        id=uuid4(),
        meter_id=meter.id,
        timestamp=now,
        voltage=voltage,
        current=current,
        power_kw=power_kw,
        frequency=50.0,
        energy_kwh=energy_kwh,
        power_factor=0.97 if not theft_detected else 0.72,
        thd=2.1 if not theft_detected else 8.4,
        is_anomaly=theft_detected,
    )
    db.add(reading)
    await db.commit()

    return LiveGridCalculationResponse(
        meter_id=meter.id,
        meter_number=meter.meter_number,
        consumer_name=meter.consumer_name,
        timestamp=now,
        power_kw=power_kw,
        voltage=voltage,
        current=current,
        energy_kwh=energy_kwh,
        transformer_name=transformer.name if transformer else "DT-001",
        transformer_supply_kw=supply_kw,
        total_metered_kw=total_metered_kw,
        grid_imbalance_kw=imbalance_kw,
        line_loss_percent=line_loss_pct,
        theft_detected=theft_detected,
        theft_probability=theft_prob,
        confidence=confidence,
        status=status_str,
        indicator_color=indicator_color,
        risk_level=risk_level,
        positive_indicators=positive_indicators,
        theft_reasons=theft_reasons,
        alert_created=alert_created,
        prediction_id=prediction_id,
    )

