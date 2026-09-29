from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Meter, MeterReading
from app.schemas import MeterReadingResponse, MeterResponse

router = APIRouter()


@router.get("", response_model=list[MeterResponse])
async def list_meters(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Meter).order_by(Meter.meter_number).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{meter_id}", response_model=MeterResponse)
async def get_meter(meter_id: UUID, db: AsyncSession = Depends(get_db)):
    meter = await db.get(Meter, meter_id)
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    return meter


@router.get("/{meter_id}/readings", response_model=list[MeterReadingResponse])
async def get_meter_readings(
    meter_id: UUID,
    limit: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
):
    meter = await db.get(Meter, meter_id)
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")

    result = await db.execute(
        select(MeterReading)
        .where(MeterReading.meter_id == meter_id)
        .order_by(MeterReading.timestamp.desc())
        .limit(limit)
    )
    readings = result.scalars().all()
    return list(reversed(readings))
