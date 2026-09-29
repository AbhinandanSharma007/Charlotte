"""
CHARLOTTE Smart Grid Simulator (Sprint 1)

Publishes synthetic smart-meter and transformer readings over MQTT so the
rest of the stack (backend, AI modules, dashboard) has live data to work
with before real hardware is connected.

One meter ("meter-03") is deliberately under-reported relative to its
transformer's supplied energy, simulating a Non-Technical Loss (NTL) /
theft scenario for the detection pipeline to pick up on.
"""

import json
import os
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

MQTT_HOST = os.getenv("MQTT_HOST", "mqtt")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

TRANSFORMER_ID = "DT-001"
METER_IDS = ["meter-01", "meter-02", "meter-03"]
ANOMALOUS_METER = "meter-03"


def make_meter_reading(meter_id: str) -> dict:
    base_load = random.uniform(1.2, 2.4)  # kWh in this interval
    if meter_id == ANOMALOUS_METER:
        base_load *= 0.35  # under-reporting -> looks like theft/tampering

    return {
        "meter_id": meter_id,
        "transformer_id": TRANSFORMER_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "energy_kwh": round(base_load, 3),
        "voltage": round(random.uniform(225, 235), 1),
        "current": round(random.uniform(4, 9), 2),
        "power_factor": round(random.uniform(0.88, 0.99), 2),
    }


def make_transformer_reading(meter_readings: list[dict]) -> dict:
    technical_loss = random.uniform(0.02, 0.05)
    supplied = sum(r["energy_kwh"] for r in meter_readings) / (1 - technical_loss)
    return {
        "transformer_id": TRANSFORMER_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "energy_supplied_kwh": round(supplied, 3),
        "load_percent": round(random.uniform(40, 85), 1),
        "temperature_c": round(random.uniform(35, 55), 1),
    }


def main():
    client = mqtt.Client(client_id="charlotte-simulator")

    for attempt in range(10):
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
            break
        except ConnectionRefusedError:
            print(f"[simulator] MQTT not ready, retrying ({attempt + 1}/10)...")
            time.sleep(3)
    else:
        raise SystemExit("Could not connect to MQTT broker")

    client.loop_start()
    print(f"[simulator] connected to mqtt://{MQTT_HOST}:{MQTT_PORT}")

    try:
        while True:
            readings = [make_meter_reading(m) for m in METER_IDS]
            for reading in readings:
                client.publish(
                    f"charlotte/meters/{reading['meter_id']}/reading",
                    json.dumps(reading),
                )

            transformer_reading = make_transformer_reading(readings)
            client.publish(
                f"charlotte/transformers/{TRANSFORMER_ID}/reading",
                json.dumps(transformer_reading),
            )

            print(f"[simulator] published {len(readings)} meter readings + 1 transformer reading")
            time.sleep(5)
    except KeyboardInterrupt:
        pass
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
