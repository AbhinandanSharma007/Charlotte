from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.grid import Transformer, SmartMeter
from app.schemas.grid import TransformerOut, SmartMeterOut

router = APIRouter(prefix="/api/grid", tags=["grid"])


@router.get("/transformers", response_model=list[TransformerOut])
def list_transformers(db: Session = Depends(get_db)):
    return db.query(Transformer).all()


@router.get("/transformers/{transformer_id}/meters", response_model=list[SmartMeterOut])
def list_meters_for_transformer(transformer_id: int, db: Session = Depends(get_db)):
    return db.query(SmartMeter).filter(SmartMeter.transformer_id == transformer_id).all()
