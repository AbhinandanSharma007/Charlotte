from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import ModelRegistry
import uuid

async def register_model(db: AsyncSession, version: str, metrics: dict, features: list):
    # Deactivate current models
    await db.execute(
        update(ModelRegistry).where(ModelRegistry.is_active == True).values(is_active=False)
    )
    
    # Register new model
    new_model = ModelRegistry(
        id=uuid.uuid4(),
        version=version,
        is_active=True,
        metrics=metrics,
        features=features
    )
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)
    return new_model

async def get_active_model(db: AsyncSession) -> ModelRegistry | None:
    result = await db.execute(
        select(ModelRegistry).where(ModelRegistry.is_active == True).limit(1)
    )
    return result.scalars().first()
