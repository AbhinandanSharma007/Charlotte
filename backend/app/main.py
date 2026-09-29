from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, dashboard, meters, monitoring, predictions, transformers, ml
from app.services.mqtt_ingestion import mqtt_client
from app.config import settings
from app.database import init_db
from app.services.seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_demo_data()
    mqtt_client.start()
    yield
    mqtt_client.stop()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Predictive Smart Grid Intelligence Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(meters.router, prefix="/api/v1/meters", tags=["Meters"])
app.include_router(transformers.router, prefix="/api/v1/transformers", tags=["Transformers"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["Monitoring"])
app.include_router(ml.router, prefix="/api/v1/ml", tags=["Machine Learning"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "service": "charlotte-backend",
    }
