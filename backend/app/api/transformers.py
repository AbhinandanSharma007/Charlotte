from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Meter, Transformer
from app.schemas import TransformerResponse

router = APIRouter()


@router.get("", response_model=list[TransformerResponse])
async def list_transformers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transformer))
    transformers = result.scalars().all()

    responses = []
    for t in transformers:
        count = await db.scalar(select(func.count()).select_from(Meter).where(Meter.transformer_id == t.id)) or 0
        data = TransformerResponse.model_validate(t)
        data.meter_count = count
        responses.append(data)
    return responses


@router.get("/{transformer_id}", response_model=TransformerResponse)
async def get_transformer(transformer_id: UUID, db: AsyncSession = Depends(get_db)):
    transformer = await db.get(Transformer, transformer_id)
    if not transformer:
        raise HTTPException(status_code=404, detail="Transformer not found")

    count = await db.scalar(
        select(func.count()).select_from(Meter).where(Meter.transformer_id == transformer_id)
    ) or 0
    response = TransformerResponse.model_validate(transformer)
    response.meter_count = count
    return response
