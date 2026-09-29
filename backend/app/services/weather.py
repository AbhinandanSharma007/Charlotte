import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import WeatherData

async def seed_weather_data(db: AsyncSession):
    now = datetime.now(timezone.utc)
    
    # Check if we already have weather data
    from sqlalchemy import select, func
    count = await db.scalar(select(func.count()).select_from(WeatherData))
    if count and count > 0:
        return
        
    weather_records = []
    
    for hour_offset in range(24):
        ts = now - timedelta(hours=23 - hour_offset)
        hour = ts.hour
        
        # Temp varies by hour: coolest at 4 AM, hottest at 2 PM
        if 4 <= hour <= 14:
            base_temp = 20 + (hour - 4) * 1.5
        elif hour > 14:
            base_temp = 35 - (hour - 14) * 1.0
        else:
            base_temp = 24 - (hour + 10) * 0.4
            
        temp = round(base_temp + random.uniform(-1, 1), 1)
        humidity = round(random.uniform(40, 80) if temp < 25 else random.uniform(30, 60), 1)
        wind_speed = round(random.uniform(5, 15), 1)
        condition = "clear" if temp > 25 and humidity < 60 else "cloudy"
        
        weather_records.append(
            WeatherData(
                id=uuid.uuid4(),
                timestamp=ts,
                temperature_c=temp,
                humidity_percent=humidity,
                wind_speed_kmh=wind_speed,
                condition=condition
            )
        )
        
    db.add_all(weather_records)
    await db.commit()
