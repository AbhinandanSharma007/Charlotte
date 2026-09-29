import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.database import async_session
from app.models import Alert, DigitalTwin, Meter, MeterReading, Prediction, Transformer, ModelRegistry
from app.services.weather import seed_weather_data


async def seed_demo_data() -> None:
    async with async_session() as session:
        existing = await session.scalar(select(func.count()).select_from(Meter))
        if existing and existing > 0:
            return

        transformer = Transformer(
            id=uuid.uuid4(),
            name="DT-001",
            capacity_kva=500.0,
            latitude=12.9716,
            longitude=77.5946,
            health_score=87.5,
            load_percent=62.3,
            status="healthy",
        )
        session.add(transformer)
        
        active_model = ModelRegistry(
            id=uuid.uuid4(),
            version="HQNN-v1.0",
            is_active=True,
            metrics={"accuracy": 0.94, "f1": 0.92},
            features=["night_consumption_ratio", "deviation_score", "transformer_load_delta"]
        )
        session.add(active_model)
        await session.flush()

        meters: list[Meter] = []
        for i in range(1, 101):
            meter = Meter(
                id=uuid.uuid4(),
                meter_number=f"MTR-{i:04d}",
                consumer_name=f"Consumer {i}",
                address=f"Street {(i - 1) // 10 + 1}, House {i}",
                latitude=12.9716 + random.uniform(-0.01, 0.01),
                longitude=77.5946 + random.uniform(-0.01, 0.01),
                transformer_id=transformer.id,
                has_solar=random.random() < 0.15,
                has_ev=random.random() < 0.08,
            )
            meters.append(meter)
            session.add(meter)

        await session.flush()

        now = datetime.now(timezone.utc)
        for meter in meters:
            twin = DigitalTwin(
                id=uuid.uuid4(),
                meter_id=meter.id,
                avg_daily_kwh=round(random.uniform(8, 35), 2),
                weekend_factor=round(random.uniform(0.8, 1.3), 2),
                deviation_score=round(random.uniform(0, 0.4), 3),
                peak_hours=[18, 19, 20, 21],
            )
            session.add(twin)

            for hour_offset in range(24):
                ts = now - timedelta(hours=23 - hour_offset)
                base_power = random.uniform(0.3, 4.5)
                session.add(
                    MeterReading(
                        id=uuid.uuid4(),
                        meter_id=meter.id,
                        timestamp=ts,
                        voltage=round(random.uniform(228, 242), 1),
                        current=round(base_power * 4.3, 2),
                        power_kw=round(base_power, 3),
                        frequency=round(random.uniform(49.8, 50.2), 2),
                        energy_kwh=round(base_power * hour_offset * 0.1, 3),
                        power_factor=round(random.uniform(0.85, 0.99), 2),
                        thd=round(random.uniform(1, 8), 2),
                        is_anomaly=random.random() < 0.02,
                    )
                )

        high_risk_meters = random.sample(meters, 5)
        for meter in high_risk_meters:
            session.add(
                Prediction(
                    id=uuid.uuid4(),
                    meter_id=meter.id,
                    prediction_type="theft",
                    probability=round(random.uniform(0.65, 0.97), 3),
                    confidence=round(random.uniform(0.75, 0.99), 3),
                    expected_window_start=now + timedelta(days=1),
                    expected_window_end=now + timedelta(days=7),
                    revenue_impact=round(random.uniform(500, 5000), 2),
                    explanation={
                        "reasons": [
                            "Night consumption increased 42% vs baseline",
                            "Behavioral digital twin deviation detected",
                            "Transformer power balance mismatch",
                        ],
                        "confidence": 0.93,
                    },
                    model_version=active_model.version,
                    status="flagged",
                    top_feature_importance={
                        "night_consumption_ratio": 0.42,
                        "deviation_score": 0.93,
                        "transformer_load_delta": 0.18,
                    },
                )
            )
            session.add(
                Alert(
                    id=uuid.uuid4(),
                    title=f"High theft risk: {meter.meter_number}",
                    description=f"Predictive AI flagged {meter.consumer_name} for potential electricity theft.",
                    severity="high" if random.random() > 0.5 else "critical",
                    status="open",
                    meter_id=meter.id,
                    transformer_id=transformer.id,
                    alert_metadata={
                        "model_version": active_model.version,
                        "prediction_type": "theft",
                    },
                )
            )

        session.add(
            Alert(
                id=uuid.uuid4(),
                title="Transformer load approaching threshold",
                description="DT-001 load at 62.3% — monitor during peak hours.",
                severity="medium",
                status="open",
                transformer_id=transformer.id,
            )
        )

        await session.commit()
        await seed_weather_data(session)
