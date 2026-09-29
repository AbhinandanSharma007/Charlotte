-- Basic seed data so the Sprint 1 dashboard has something to show

INSERT INTO roles (name, description) VALUES
    ('admin', 'Full platform access'),
    ('inspector', 'Field inspection and theft verification'),
    ('analyst', 'Read-only analytics access'),
    ('consumer', 'Consumer self-service portal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO substations (name, region, latitude, longitude) VALUES
    ('Substation Alpha', 'Chengalpattu Zone', 12.6273, 79.9739)
ON CONFLICT DO NOTHING;

INSERT INTO feeders (substation_id, name, voltage_kv) VALUES
    (1, 'Feeder-11kV-A', 11)
ON CONFLICT DO NOTHING;

INSERT INTO transformers (feeder_id, name, capacity_kva, latitude, longitude, installed_at) VALUES
    (1, 'DT-001', 250, 12.6280, 79.9750, '2020-01-15')
ON CONFLICT DO NOTHING;

INSERT INTO smart_meters (transformer_id, consumer_name, consumer_type, address, latitude, longitude, installed_at) VALUES
    (1, 'Demo Household 1', 'residential', 'Sample Street 1', 12.6282, 79.9752, '2021-03-01'),
    (1, 'Demo Household 2', 'residential', 'Sample Street 2', 12.6285, 79.9755, '2021-03-01'),
    (1, 'Demo Shop 1',       'commercial',  'Market Road 5',   12.6288, 79.9758, '2021-05-10')
ON CONFLICT DO NOTHING;
