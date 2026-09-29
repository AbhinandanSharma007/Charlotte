# CHARLOTTE — Architecture & Roadmap

Condensed from the original design conversation (project was scoped as
"GridSentinel AI" and later renamed **CHARLOTTE**).

## Problem framing

Traditional electricity grids only deliver power. A smart grid adds sensors,
smart meters, and two-way communication so utilities can monitor, forecast,
and automatically respond to changes in supply and demand. CHARLOTTE builds
on top of that to solve one specific, high-value problem: **Non-Technical
Loss (NTL) / theft detection.**

## Detection hierarchy

```text
National Grid
      │
Regional Utility
      │
Substation
      │
11 kV Feeder
      │
Distribution Transformer   ← most effective deployment point
      │
Smart Meters
      │
Homes / Shops / Industries
```

| Level | What's detected |
|---|---|
| Smart Meter | Bypass, magnetic tampering, reverse current, meter opening, abnormal consumption |
| Distribution Transformer | Energy balance (supplied vs. billed), area-wise NTL, consumer clustering |
| Feeder | High-loss feeder identification, power-flow comparison, regional anomalies |
| Substation | Outage monitoring, transformer overload, voltage monitoring |
| Utility Control Center | AI analytics, theft heatmaps, maintenance scheduling, billing verification |

The **distribution transformer level is the recommended deployment scale**:
each transformer typically serves 100–500 consumers, small enough that an
unexplained energy gap can be narrowed to a short inspection list, large
enough to be worth automating.

## AI module roadmap

Beyond Sprint 1's foundation, the platform is designed to add these modules
incrementally:

1. **Digital Twin** — learns each consumer's baseline load profile so
   deviations are easy to spot.
2. **Physics + Graph AI** — validates the meter-vs-transformer energy
   balance across the feeder graph (physics constraints + GNN).
3. **Multi-Modal Fusion** — combines meter data, weather, and grid topology.
4. **Self-Learning Detection** — adapts to new/evolving theft patterns.
5. **Synthetic Theft Generator** — produces realistic anomalous training
   data where labeled theft examples are scarce.
6. **Explainable AI (XAI)** — every flag ships with SHAP/LIME-style evidence,
   not just a score.
7. **Predictive Theft Prevention** — forecasts risk before losses accumulate.
8. **Reinforcement-Learning Inspection Planner** — ranks which
   transformer/meter to inspect next to maximize recovered revenue per
   inspection.
9. **LLM Grid Assistant (MCP)** — natural-language queries over live grid
   state ("which feeders are trending toward high loss this week?").

## Technology stack (full vision)

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Tailwind CSS, Anime.js, Leaflet/Mapbox, Recharts |
| Backend | FastAPI |
| ML | PyTorch, Scikit-learn |
| Time-series forecasting | Temporal Fusion Transformer / Informer |
| Graph AI | PyTorch Geometric |
| Explainability | SHAP, LIME |
| Database | PostgreSQL + TimescaleDB |
| Cache | Redis |
| Messaging | MQTT (meter ingestion) + Kafka (event streaming, optional at smaller scale) |
| Object storage | MinIO |
| Monitoring | Prometheus + Grafana |
| Deployment | Docker Compose |

> Note: for a college-scale deployment, running both MQTT and Kafka is more
> infrastructure than necessary — MQTT alone covers meter → backend
> ingestion. Kafka is included here for anyone who wants to demonstrate
> high-throughput event streaming, and can be dropped without affecting the
> rest of the stack.

## Development phases

| Phase | Goal |
|---|---|
| 1 (this repo) | Simulator, backend, database, dashboard foundation, Docker orchestration. |
| 2 | Baseline anomaly detection (Isolation Forest / Random Forest) on simulated meter data. |
| 3 | Digital Twin, multi-modal feature engineering, explainable AI. |
| 4 | Graph Neural Networks, physics-informed AI, synthetic data generation. |
| 5 | Predictive theft-risk forecasting, RL inspection planning, LLM assistant. |
| 6 | Evaluation: precision/recall/F1, false-positive rate, forecasting MAE, inspection cost savings vs. baseline. |

## Recommendation for a college project / hackathon scope

You don't need every module implemented from scratch to have a strong
result. A good target:

- Fully working **baseline pipeline**: simulate → ingest → store → dashboard
  → anomaly detection → explanation.
- **Two or three** advanced modules built in depth (e.g. Digital Twin,
  Graph AI, predictive theft prevention).
- The remaining modules designed with clear interfaces and partially
  prototyped, so the roadmap to a full platform stays visible.

## Database

See `database/schema.sql` for the full table list. Time-series tables
(`meter_readings`, `transformer_readings`, `weather`, `predictions`,
`alerts`) are TimescaleDB hypertables.

## Example NTL calculation

```
Transformer supplies:        15,000 kWh/day
Smart meters bill:            13,900 kWh/day
Expected technical loss:          300 kWh/day
Expected total:      13,900 + 300 = 14,200 kWh
Unexplained delta:   15,000 - 14,200 = 800 kWh/day  ← flag for inspection
```
