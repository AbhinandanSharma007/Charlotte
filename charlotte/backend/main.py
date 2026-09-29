from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.api.routes import grid

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description=settings.description,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(grid.router)

# Prometheus metrics exposed at /metrics
app.mount("/metrics", make_asgi_app())


@app.get("/")
async def home():
    return {
        "project": settings.project_name,
        "tagline": "Intelligent. Predictive. Explainable.",
        "status": "Running",
        "version": settings.version,
    }


@app.get("/health")
async def health():
    return {"status": "Healthy"}
