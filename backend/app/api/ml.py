from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import ModelRegistry
from app.schemas import ModelRegistryResponse
from app.ml.training import train_pipeline
from typing import Dict, Any

router = APIRouter()

@router.get("/models", response_model=list[ModelRegistryResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelRegistry).order_by(ModelRegistry.created_at.desc()))
    return result.scalars().all()

@router.get("/models/active", response_model=ModelRegistryResponse)
async def get_active_model(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelRegistry).where(ModelRegistry.is_active == True).limit(1))
    model = result.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="No active model found")
    return model

@router.post("/train", response_model=Dict[str, Any])
async def trigger_training(
    version: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        metrics, feature_importance = await train_pipeline(db, version)
        return {
            "status": "success",
            "version": version,
            "metrics": metrics,
            "feature_importance": feature_importance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
