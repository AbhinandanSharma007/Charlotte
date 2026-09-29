import json
from datetime import timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import DigitalTwin, Meter, MeterReading


def _timestamp(value) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")


def _reading_values(reading: MeterReading, instance_id: int, meter_ref: int) -> list:
    timestamp = _timestamp(reading.timestamp)
    return [
        instance_id,
        meter_ref,
        timestamp,
        float(reading.voltage),
        float(reading.current),
        float(reading.power_kw),
        float(reading.energy_kwh),
        float(reading.power_factor),
        float(reading.thd),
    ]


def _meter_values(meter: Meter, twin: DigitalTwin | None, instance_id: int, meter_ref: int) -> list:
    return [
        instance_id,
        meter_ref,
        bool(meter.has_solar),
        bool(meter.has_ev),
        float(twin.avg_daily_kwh) if twin else 0.0,
        float(twin.weekend_factor) if twin else 1.0,
        float(twin.deviation_score) if twin else 0.0,
    ]


async def build_prediction_payload(db: AsyncSession) -> tuple[dict, int, int]:
    result = await db.execute(
        select(MeterReading, Meter, DigitalTwin)
        .join(Meter, Meter.id == MeterReading.meter_id)
        .outerjoin(DigitalTwin, DigitalTwin.meter_id == Meter.id)
        .order_by(MeterReading.timestamp.asc())
        .limit(10000)
    )
    records = result.all()
    if not records:
        raise ValueError("No meter readings are available for Kumo classification.")

    labeled_classes = {bool(reading.is_anomaly) for reading, _, _ in records}
    if len(labeled_classes) < 2:
        raise ValueError("Kumo classification requires both normal and anomalous labeled readings.")

    meter_refs: dict[str, int] = {}
    history_rows = []
    history_meters = []
    latest_by_meter = {}

    for instance_id, (reading, meter, twin) in enumerate(records):
        meter_key = str(meter.id)
        meter_ref = meter_refs.setdefault(meter_key, len(meter_refs))
        history_rows.append(_reading_values(reading, instance_id, meter_ref) + [bool(reading.is_anomaly)])
        history_meters.append(_meter_values(meter, twin, instance_id, meter_ref))
        latest_by_meter[meter_key] = (reading, meter, twin, meter_ref)

    prediction_rows = []
    prediction_meters = []
    next_instance_id = len(history_rows)
    for offset, (reading, meter, twin, meter_ref) in enumerate(latest_by_meter.values()):
        instance_id = next_instance_id + offset
        prediction_rows.append(_reading_values(reading, instance_id, meter_ref))
        prediction_meters.append(_meter_values(meter, twin, instance_id, meter_ref))

    reading_columns = [
        "instance_id", "__kumo_entity_ref_0", "__kumo_anchor_time", "voltage",
        "current", "power_kw", "energy_kwh", "power_factor", "thd",
    ]
    meter_columns = [
        "instance_id", "meter_id", "has_solar", "has_ev", "avg_daily_kwh",
        "weekend_factor", "deviation_score",
    ]
    payload = {
        "model": "kumo-relational",
        "task": {
            "kind": "binary_classification",
            "target": {
                "column_name": "TARGET",
                "dtype": "bool",
                "classes": ["false", "true"],
                "positive_class": "true",
            },
            "entity_table_names": ["meters"],
            "anchor_time_column": "__kumo_anchor_time",
        },
        "schema": {
            "instance_table": {
                "columns": {
                    "instance_id": {"dtype": "int64", "stype": "ID", "nullable": False},
                    "__kumo_entity_ref_0": {"dtype": "int64", "stype": "ID", "nullable": False},
                    "__kumo_anchor_time": {"dtype": "timestamp[us]", "stype": "timestamp", "nullable": False},
                    "voltage": {"dtype": "float64", "stype": "numerical"},
                    "current": {"dtype": "float64", "stype": "numerical"},
                    "power_kw": {"dtype": "float64", "stype": "numerical"},
                    "energy_kwh": {"dtype": "float64", "stype": "numerical"},
                    "power_factor": {"dtype": "float64", "stype": "numerical"},
                    "thd": {"dtype": "float64", "stype": "numerical"},
                    "TARGET": {"dtype": "bool", "stype": "categorical"},
                },
                "primary_key": "instance_id",
            },
            "related_tables": {
                "meters": {
                    "columns": {
                        "instance_id": {"dtype": "int64", "stype": "ID", "nullable": False},
                        "meter_id": {"dtype": "int64", "stype": "ID", "nullable": False},
                        "has_solar": {"dtype": "bool", "stype": "categorical"},
                        "has_ev": {"dtype": "bool", "stype": "categorical"},
                        "avg_daily_kwh": {"dtype": "float64", "stype": "numerical"},
                        "weekend_factor": {"dtype": "float64", "stype": "numerical"},
                        "deviation_score": {"dtype": "float64", "stype": "numerical"},
                    },
                    "primary_key": ["instance_id", "meter_id"],
                }
            },
            "relationships": [{
                "source_columns": ["__kumo_entity_ref_0"],
                "target_table": "meters",
                "target_columns": ["meter_id"],
            }],
        },
        "context": {
            "instance_table": {"format": "arrays", "columns": reading_columns + ["TARGET"], "rows": history_rows},
            "related_tables": {
                "meters": {"format": "arrays", "columns": meter_columns, "rows": history_meters}
            },
        },
        "predict": {
            "instance_table": {"format": "arrays", "columns": reading_columns, "rows": prediction_rows},
            "related_tables": {
                "meters": {"format": "arrays", "columns": meter_columns, "rows": prediction_meters}
            },
        },
        "output": {"fields": ["prediction", "probabilities"]},
        "inference": {
            "run_mode": "fast",
            "use_prediction_time": False,
            "inference_config": {
                "kind": "classification",
                "num_estimators": 1,
                "column_shuffle": False,
                "category_shuffle": False,
                "hop_shuffle": False,
                "class_shuffle": False,
            },
        },
    }
    return payload, len(history_rows), len(prediction_rows)


async def analyze_grid_with_kumo(db: AsyncSession, question: str) -> str:
    payload, history_count, meter_count = await build_prediction_payload(db)
    async with httpx.AsyncClient(timeout=settings.kumo_nim_timeout_seconds) as client:
        response = await client.post(f"{settings.kumo_nim_url.rstrip('/')}/v1/predictions", json=payload)
        response.raise_for_status()

    result = response.json()
    return (
        f"NVIDIA Kumo Relational classified the latest readings for {meter_count} meters "
        f"using {history_count} historical meter readings. The classification target is the "
        "stored `is_anomaly` label, not a confirmed electricity-theft label. "
        f"Your question was: {question}\n\nKumo response:\n"
        f"{json.dumps(result, ensure_ascii=False, indent=2)[:5000]}"
    )