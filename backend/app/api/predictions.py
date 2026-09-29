from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Alert, Prediction
from app.schemas import PredictionCreate, PredictionIngestRequest, PredictionResponse

router = APIRouter()


def _alert_severity(probability: float) -> str:
    if probability >= 0.95:
        return "critical"
    if probability >= 0.8:
        return "high"
    if probability >= 0.6:
        return "medium"
    return "low"


async def _create_alert_for_prediction(db: AsyncSession, prediction: Prediction) -> None:
    if prediction.prediction_type == "theft" and prediction.probability >= 0.8:
        alert = Alert(
            id=uuid4(),
            title=f"Theft risk detected for meter {prediction.meter_id or 'unknown'}",
            description=(
                f"{prediction.model_version} flagged this meter with "
                f"{prediction.probability * 100:.1f}% theft probability."
            ),
            severity=_alert_severity(prediction.probability),
            status="open",
            meter_id=prediction.meter_id,
            transformer_id=prediction.transformer_id,
            alert_metadata={
                "prediction_id": str(prediction.id),
                "model_version": prediction.model_version,
                "probability": prediction.probability,
            },
        )
        db.add(alert)


def _prepare_prediction_data(payload: PredictionCreate) -> dict:
    prediction_data = payload.model_dump()
    if payload.status is None or not prediction_data.get("status"):
        prediction_data["status"] = (
            "flagged"
            if payload.prediction_type == "theft" and payload.probability >= 0.8
            else "normal"
        )
    return prediction_data


@router.get("", response_model=list[PredictionResponse])
async def list_predictions(
    prediction_type: str | None = Query(None),
    only_anomalies: bool = Query(False),
    min_probability: float = Query(0.0, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Prediction)
    if prediction_type:
        query = query.where(Prediction.prediction_type == prediction_type)
    if only_anomalies:
        query = query.where(Prediction.probability >= 0.5)
    if min_probability > 0:
        query = query.where(Prediction.probability >= min_probability)

    query = query.order_by(Prediction.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/theft", response_model=list[PredictionResponse])
async def list_theft_predictions(
    min_probability: float = Query(0.0, ge=0.0, le=1.0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Prediction)
        .where(Prediction.prediction_type == "theft", Prediction.probability >= min_probability)
        .order_by(Prediction.probability.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.post("", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def create_prediction(
    payload: PredictionCreate,
    db: AsyncSession = Depends(get_db),
):
    if not 0 <= payload.probability <= 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="probability must be between 0 and 1",
        )

    prediction_data = payload.model_dump()
    if payload.status is None:
        prediction_data["status"] = (
            "flagged"
            if payload.prediction_type == "theft" and payload.probability >= 0.8
            else "normal"
        )
    elif not prediction_data["status"]:
        prediction_data["status"] = (
            "flagged"
            if payload.prediction_type == "theft" and payload.probability >= 0.8
            else "normal"
        )

    prediction = Prediction(**prediction_data)
    db.add(prediction)
    await db.flush()

    await _create_alert_for_prediction(db, prediction)
    await db.commit()
    await db.refresh(prediction)
    return prediction


@router.post(
    "/ingest",
    response_model=list[PredictionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def ingest_predictions(
    payload: PredictionIngestRequest,
    db: AsyncSession = Depends(get_db),
):
    predictions: list[Prediction] = []

    for item in payload.predictions:
        if not 0 <= item.probability <= 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="probability must be between 0 and 1",
            )
        prediction_data = _prepare_prediction_data(item)
        prediction = Prediction(**prediction_data)
        db.add(prediction)
        predictions.append(prediction)

    await db.flush()

    for prediction in predictions:
        await _create_alert_for_prediction(db, prediction)

    await db.commit()

    for prediction in predictions:
        await db.refresh(prediction)

    return predictions
