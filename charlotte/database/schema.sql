-- =====================================================================
-- CHARLOTTE — AI-Powered Predictive Smart Grid Intelligence Platform
-- Core schema (Sprint 1)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ---------------------------------------------------------------------
-- Identity & access
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,        -- e.g. admin, inspector, analyst, consumer
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    full_name     TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role_id       INTEGER REFERENCES roles(id),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Grid topology: substation -> feeder -> transformer -> meter
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS substations (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    region      TEXT,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS feeders (
    id             SERIAL PRIMARY KEY,
    substation_id  INTEGER REFERENCES substations(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    voltage_kv     NUMERIC DEFAULT 11
);

CREATE TABLE IF NOT EXISTS transformers (
    id           SERIAL PRIMARY KEY,
    feeder_id    INTEGER REFERENCES feeders(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    capacity_kva NUMERIC,
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    installed_at DATE
);

CREATE TABLE IF NOT EXISTS smart_meters (
    id              SERIAL PRIMARY KEY,
    transformer_id  INTEGER REFERENCES transformers(id) ON DELETE CASCADE,
    consumer_name   TEXT,
    consumer_type   TEXT,          -- residential, commercial, industrial
    address         TEXT,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    installed_at    DATE,
    status          TEXT DEFAULT 'active'
);

-- ---------------------------------------------------------------------
-- Time-series data (TimescaleDB hypertables)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meter_readings (
    time        TIMESTAMPTZ NOT NULL,
    meter_id    INTEGER REFERENCES smart_meters(id) ON DELETE CASCADE,
    energy_kwh  NUMERIC,
    voltage     NUMERIC,
    current     NUMERIC,
    power_factor NUMERIC
);
SELECT create_hypertable('meter_readings', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS transformer_readings (
    time            TIMESTAMPTZ NOT NULL,
    transformer_id  INTEGER REFERENCES transformers(id) ON DELETE CASCADE,
    energy_supplied_kwh NUMERIC,
    load_percent    NUMERIC,
    temperature_c   NUMERIC
);
SELECT create_hypertable('transformer_readings', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS weather (
    time        TIMESTAMPTZ NOT NULL,
    region      TEXT,
    temperature_c NUMERIC,
    humidity    NUMERIC,
    irradiance  NUMERIC
);
SELECT create_hypertable('weather', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS predictions (
    time        TIMESTAMPTZ NOT NULL,
    entity_type TEXT,        -- meter, transformer, feeder
    entity_id   INTEGER,
    model_name  TEXT,
    score       NUMERIC,      -- e.g. theft probability
    label       TEXT
);
SELECT create_hypertable('predictions', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS alerts (
    time        TIMESTAMPTZ NOT NULL,
    entity_type TEXT,
    entity_id   INTEGER,
    severity    TEXT,          -- low, medium, high, critical
    message     TEXT,
    acknowledged BOOLEAN DEFAULT FALSE
);
SELECT create_hypertable('alerts', 'time', if_not_exists => TRUE);

-- ---------------------------------------------------------------------
-- Renewables / EV / digital twin / AI / ops
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solar_panels (
    id          SERIAL PRIMARY KEY,
    meter_id    INTEGER REFERENCES smart_meters(id) ON DELETE CASCADE,
    capacity_kw NUMERIC
);

CREATE TABLE IF NOT EXISTS ev_stations (
    id          SERIAL PRIMARY KEY,
    transformer_id INTEGER REFERENCES transformers(id) ON DELETE CASCADE,
    name        TEXT,
    charger_kw  NUMERIC
);

CREATE TABLE IF NOT EXISTS digital_twins (
    id          SERIAL PRIMARY KEY,
    meter_id    INTEGER REFERENCES smart_meters(id) ON DELETE CASCADE,
    baseline_profile JSONB,
    last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS theft_predictions (
    id          SERIAL PRIMARY KEY,
    meter_id    INTEGER REFERENCES smart_meters(id) ON DELETE CASCADE,
    probability NUMERIC,
    explanation JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_predictions (
    id          SERIAL PRIMARY KEY,
    transformer_id INTEGER REFERENCES transformers(id) ON DELETE CASCADE,
    expected_kwh NUMERIC,
    predicted_loss_kwh NUMERIC,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transformer_health (
    id             SERIAL PRIMARY KEY,
    transformer_id INTEGER REFERENCES transformers(id) ON DELETE CASCADE,
    health_score   NUMERIC,
    risk_factors   JSONB,
    created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspections (
    id          SERIAL PRIMARY KEY,
    meter_id    INTEGER REFERENCES smart_meters(id) ON DELETE CASCADE,
    scheduled_by INTEGER REFERENCES users(id),
    scheduled_at TIMESTAMPTZ,
    status      TEXT DEFAULT 'pending',
    result      TEXT
);

CREATE TABLE IF NOT EXISTS reports (
    id          SERIAL PRIMARY KEY,
    title       TEXT,
    generated_by INTEGER REFERENCES users(id),
    file_url    TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_models (
    id          SERIAL PRIMARY KEY,
    name        TEXT,
    version     TEXT,
    metric_name TEXT,
    metric_value NUMERIC,
    trained_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logs (
    id          SERIAL PRIMARY KEY,
    level       TEXT,
    message     TEXT,
    context     JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message     TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);
