# CHARLOTTE — Implementation Plan

**AI-Powered Predictive Smart Grid Intelligence Platform**  
Tagline: *Predict • Prevent • Explain • Optimize*

---

## Project Overview

Charlotte is an AI-first Smart Grid Intelligence Platform that predicts electricity theft, monitors transformer health, builds behavioral digital twins, and provides explainable AI decisions for utility operators.

### Pilot Scope
- 1 residential locality
- 1 distribution transformer
- 100 simulated smart meters
- Weather, solar, and EV charging integration

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                       │
│  Dashboard │ Live Grid │ Digital Twin │ Predictions │ AI Chat   │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  Auth │ Meters │ Transformers │ Predictions │ Analytics │ Chat  │
└──────┬──────────────┬─────────────────┬─────────────────────────┘
       │              │                 │
  PostgreSQL      Redis/Cache        AI Services
  TimescaleDB     MQTT/Kafka         (PyTorch, XGBoost, SHAP)
       ▲
       │ MQTT
  Meter Simulator (100 meters, theft events)
```

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, Zustand, Leaflet, Recharts |
| Backend | FastAPI, SQLAlchemy, Alembic, JWT, WebSockets |
| Database | PostgreSQL, TimescaleDB, Redis, MinIO |
| AI/ML | PyTorch, Scikit-Learn, XGBoost, PyTorch Geometric, SHAP, LIME |
| Infrastructure | Docker, Docker Compose, MQTT, Kafka, Prometheus, Grafana |
| AI Assistant | LLM (OpenAI/Llama), MCP Servers |

---

## 8-Sprint Development Roadmap

### Sprint 1 — Infrastructure ✅ (Current)
- [x] Docker Compose (PostgreSQL, Redis, backend, frontend)
- [x] FastAPI backend scaffold with core models
- [x] React + Vite + TypeScript frontend
- [x] Dashboard shell with navigation
- [x] Health check API

### Sprint 2 — Authentication & Users
- [ ] JWT authentication & OAuth2
- [ ] User & role management (Admin, Operator, Inspector, Analyst)
- [ ] Protected routes & RBAC
- [ ] Login/register UI

### Sprint 3 — Smart Grid Simulator
- [ ] Smart meter simulator (voltage, current, power, frequency, harmonics)
- [ ] MQTT publisher for meter readings
- [ ] Kafka ingestion pipeline
- [ ] TimescaleDB hypertables for time-series data
- [ ] Live grid WebSocket feed

### Sprint 4 — Core AI
- [ ] Digital Twin engine (behavioral profiles per consumer)
- [ ] Predictive theft AI (probability, time window, revenue impact)
- [ ] Revenue forecast module

### Sprint 5 — Advanced AI
- [ ] Graph Neural Network for grid relationships
- [ ] Physics-informed validation (Kirchhoff, power balance)
- [ ] Explainable AI (SHAP/LIME explanations)

### Sprint 6 — Optimization
- [ ] Transformer health monitoring (RUL, failure probability)
- [ ] Inspection optimizer (Reinforcement Learning)
- [ ] Synthetic data generator (theft scenarios)

### Sprint 7 — AI Assistant
- [ ] LLM-powered natural language queries
- [ ] MCP integration (Database, Weather, Maps, Reports)
- [ ] Report generation

### Sprint 8 — Deployment
- [ ] Prometheus + Grafana monitoring
- [ ] Production Docker deployment
- [ ] Performance optimization

---

## Database Schema (Core Tables)

| Table | Purpose |
|-------|---------|
| users, roles | Authentication & RBAC |
| meters, meter_readings | Smart meter data (TimescaleDB) |
| transformers, feeders, substations | Grid infrastructure |
| digital_twins | Consumer behavioral profiles |
| predictions | Theft & health predictions |
| alerts, notifications | Real-time alerts |
| weather, solar, ev_stations | Contextual data |
| revenue_forecast | Financial analytics |
| reports, audit_logs | Compliance & reporting |

---

## API Endpoints (Planned)

| Group | Endpoints |
|-------|-----------|
| Auth | POST /auth/login, /auth/register, /auth/refresh |
| Meters | GET/POST /meters, GET /meters/{id}/readings |
| Transformers | GET /transformers, GET /transformers/{id}/health |
| Predictions | GET /predictions/theft, GET /predictions/transformer |
| Analytics | GET /analytics/revenue, GET /analytics/heatmap |
| Alerts | GET/POST /alerts, PATCH /alerts/{id} |
| Dashboard | GET /dashboard/summary |
| Chat | POST /chat/query (WebSocket) |

---

## Dashboard Pages

1. **Home** — KPI summary, active alerts, grid status
2. **Live Grid** — Real-time meter map (Leaflet)
3. **Digital Twin** — Consumer behavioral profiles
4. **Heatmap** — Theft risk visualization
5. **Transformer Health** — Health scores, RUL predictions
6. **Revenue Loss** — Forecast charts
7. **Predictions** — Theft probability rankings
8. **Inspection Planner** — Optimized routes
9. **AI Assistant** — Natural language chat

---

## Key Differentiators

1. **Predictive Theft Prevention** — Predict before losses occur
2. **Behavioral Digital Twins** — Per-consumer AI profiles
3. **Multi-Modal Data** — Meters + weather + solar + EV + transformer
4. **Explainable AI** — Every prediction has reason + confidence
5. **Graph Intelligence** — Detect coordinated theft
6. **Physics-Informed Validation** — Reduce false positives
7. **MCP-Enabled AI Assistant** — Modular tool integration

---

## Getting Started

```bash
# Start all services
docker compose up -d

# Backend API: http://localhost:8000/docs
# Frontend:    http://localhost:5173
# PostgreSQL:  localhost:5432
# Redis:       localhost:6379
```
