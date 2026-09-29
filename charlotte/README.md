# CHARLOTTE

**AI-Powered Predictive Smart Grid Intelligence Platform**
*Intelligent. Predictive. Explainable.*

CHARLOTTE detects **Non-Technical Losses (NTL)** — electricity theft, meter
tampering, and billing anomalies — by continuously comparing energy supplied
at each distribution transformer against energy billed to the meters it
serves, then using AI to narrow that gap down to a short, explainable list of
consumers worth inspecting.

This repository is **Sprint 1**: a fully runnable foundation. Later sprints
add the AI modules (digital twin, graph intelligence, explainable detection,
inspection planner, LLM assistant) described in `docs/`.

## Why the distribution-transformer level

A transformer supplying 250 houses reports `15,000 kWh/day` sent. Smart
meters under it report `13,900 kWh/day` billed. Expected technical losses
(line resistance, etc.) are `~300 kWh/day`. That leaves an unexplained
`800 kWh/day` — a strong signal of theft or tampering *within that
transformer's service area*, which narrows the search from an entire city
down to a few hundred consumers. See `docs/` for the full detection
hierarchy (substation → feeder → transformer → smart meter).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Anime.js, Recharts, Leaflet |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL + TimescaleDB (hypertables for meter/transformer time series) |
| Messaging | MQTT (meter ingestion), Kafka (event streaming) |
| Cache | Redis |
| Object storage | MinIO |
| Monitoring | Prometheus + Grafana |
| Orchestration | Docker Compose |

## Project structure

```text
charlotte/
├── frontend/        React + Vite + TS + Tailwind + Anime.js
├── backend/         FastAPI app (api / core / models / schemas / services / database)
├── database/        schema.sql, seed.sql (Postgres/TimescaleDB init scripts)
├── docker/          Per-service Docker configs (mqtt, etc.)
├── monitoring/       Prometheus config
├── simulator/        Synthetic smart-meter/transformer data generator (MQTT)
├── mcp/              Reserved for the MCP layer (LLM grid assistant, later sprint)
├── docs/             Architecture and roadmap notes carried over from design
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Running it

```bash
cp .env.example .env   # already done for local dev — edit if you change ports/creds
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Prometheus metrics | http://localhost:8000/metrics |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| MinIO console | http://localhost:9001 |

The `simulator` service starts publishing synthetic meter/transformer
readings over MQTT (`charlotte/meters/<id>/reading`,
`charlotte/transformers/<id>/reading`) as soon as the stack is up — one
meter is deliberately under-reported to simulate an NTL/theft scenario for
later sprints' detection pipeline to catch.

## Database

`database/schema.sql` and `database/seed.sql` run automatically on first
Postgres start (mounted into `/docker-entrypoint-initdb.d`). Core tables:
`users`, `roles`, `substations`, `feeders`, `transformers`, `smart_meters`,
plus TimescaleDB hypertables `meter_readings`, `transformer_readings`,
`weather`, `predictions`, `alerts`, and supporting tables for digital twins,
theft/revenue predictions, transformer health, inspections, reports, AI
model metadata, logs, and notifications.

## Roadmap (post–Sprint 1)

1. **Digital Twin** — per-consumer baseline load profile.
2. **Physics + Graph AI** — validates meter-vs-transformer energy balance across the feeder graph.
3. **Self-learning detection** — adapts to new theft patterns over time.
4. **Explainable AI** — every flag ships with the evidence behind it.
5. **RL Inspection Planner** — ranks which transformer/meter to inspect next.
6. **LLM Grid Assistant (MCP)** — natural-language queries over grid state.

See `docs/architecture.md` for the full module breakdown and data flow
carried over from the original design conversation.
