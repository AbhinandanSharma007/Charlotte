import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session
from app.config import settings
from app.models import MeterReading, Meter
from sqlalchemy import select

logger = logging.getLogger(__name__)

class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client(client_id=f"charlotte-backend-{uuid.uuid4().hex[:8]}")
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self._loop = asyncio.get_event_loop()
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Connected to MQTT broker")
            client.subscribe("charlotte/meters/+/reading")
            client.subscribe("charlotte/transformers/+/reading")
        else:
            logger.error(f"Failed to connect to MQTT broker with code {rc}")
            
    def on_message(self, client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode('utf-8')
        # We need to run async db operations from sync MQTT callback
        asyncio.run_coroutine_threadsafe(self.process_message(topic, payload), self._loop)

    async def process_message(self, topic: str, payload: str):
        try:
            data = json.loads(payload)
            if "meters" in topic:
                await self._process_meter_reading(data)
            elif "transformers" in topic:
                # We can store transformer readings if needed
                pass
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")

    async def _process_meter_reading(self, data: dict):
        meter_number = data.get("meter_id")
        if not meter_number:
            return
            
        async with async_session() as session:
            # Find meter
            res = await session.execute(select(Meter).where(Meter.meter_number == meter_number))
            meter = res.scalars().first()
            if not meter:
                return
                
            reading = MeterReading(
                id=uuid.uuid4(),
                meter_id=meter.id,
                timestamp=datetime.now(timezone.utc),
                voltage=data.get("voltage", 230.0),
                current=data.get("current", 5.0),
                power_kw=data.get("energy_kwh", 1.0) / 1.0, # simplified
                energy_kwh=data.get("energy_kwh", 1.0),
                power_factor=data.get("power_factor", 0.95),
            )
            session.add(reading)
            await session.commit()
            # Here we could also trigger live inference if model is active

    def start(self):
        broker_url = settings.mqtt_broker.replace("mqtt://", "")
        host = broker_url.split(":")[0]
        port = int(broker_url.split(":")[1]) if ":" in broker_url else 1883
        
        try:
            self.client.connect(host, port, 60)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"MQTT connection error: {e}")
            
    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()

mqtt_client = MQTTClient()
