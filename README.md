# CHARLOTTE

AI-Powered Predictive Smart Grid Intelligence Platform

> Predict • Prevent • Explain • Optimize

Charlotte is an AI-first smart grid platform that predicts electricity theft, monitors transformer health, builds behavioral digital twins, and provides explainable AI decisions for utility operators.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### Run with Docker

```bash
docker compose up -d
```

| Service | URL |
| --------- | ----- |
| Frontend Dashboard | [http://localhost:5173](http://localhost:5173) |
| Backend API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| MQTT | localhost:1883 |

### Local Development

Start each service in a separate terminal from the repository root.

**Terminal 1 — Backend API:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open the [dashboard](http://127.0.0.1:5173/). The [API documentation](http://127.0.0.1:8000/docs)
and [backend health check](http://127.0.0.1:8000/health) are also available.
The frontend proxies `/api` requests to the backend on port 8000.

### NVIDIA Kumo Relational NIM (Optional)

Kumo is used for structured meter-anomaly classification, not free-form text
generation. The assistant sends Kumo historical meter readings labeled by the
stored `is_anomaly` field and reports scores for the latest reading per meter.
Those labels are anomaly labels, not confirmed theft outcomes.

1. Rotate any NGC API key that has been shared in chat. Copy `.env.example` to
   `.env` and enter the replacement as `NGC_API_KEY` locally.
2. Authenticate to NVIDIA Container Registry with username `$oauthtoken` and
   the replacement key as the password when prompted: `docker login nvcr.io`.
3. Start the optional GPU service: `docker compose --profile kumo up -d kumo-nim`.
4. Ask **Meter Anomalies** in the AI Assistant. The NIM is exposed on host port
   `8001`, leaving Charlotte's API on port `8000`.

The NIM requires a compatible NVIDIA GPU and Docker GPU support. Without it,
the assistant continues to serve its live-database responses.

## Project Structure

```text
Charlotte/
├── backend/           # FastAPI + SQLAlchemy + AI services
├── frontend/          # React 19 + TypeScript + Tailwind
├── infrastructure/    # MQTT, monitoring configs
├── IMPLEMENTATION_PLAN.md
└── docker-compose.yml
```

## Current Status — Sprint 1

- [x] Docker Compose infrastructure
- [x] FastAPI backend with core models & APIs
- [x] 100 simulated smart meters with readings
- [x] React dashboard with 6 pages
- [x] Live grid map (Leaflet)
- [x] Theft predictions with explainable AI reasons
- [x] Transformer health monitoring
- [x] Alerts system

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full 8-sprint roadmap.

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/health` | Health check |
| GET | `/api/v1/dashboard/summary` | Dashboard KPIs |
| GET | `/api/v1/meters` | List smart meters |
| GET | `/api/v1/meters/{id}/readings` | Meter time-series |
| GET | `/api/v1/transformers` | Transformer status |
| GET | `/api/v1/predictions/theft` | Theft predictions |
| POST | `/api/v1/predictions/ingest` | Ingest model-generated predictions |
| GET | `/api/v1/alerts` | Grid alerts |

## License

Research project — Charlotte Smart Grid Intelligence Platform
