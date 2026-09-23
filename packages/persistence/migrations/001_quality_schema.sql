CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS quality;

CREATE TABLE IF NOT EXISTS quality.schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality.validation_runs (
  run_id TEXT PRIMARY KEY,
  dataset_name TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  source_crs TEXT NOT NULL,
  license TEXT NOT NULL,
  feature_count INTEGER NOT NULL CHECK (feature_count >= 0),
  ruleset_id TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  parameters JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed')),
  limitations JSONB NOT NULL,
  findings JSONB NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  failure_message TEXT
);

CREATE TABLE IF NOT EXISTS quality.finding_geometries (
  finding_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES quality.validation_runs(run_id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  feature_id TEXT NOT NULL,
  feature_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  geometry geometry(Geometry, 4326)
);

CREATE INDEX IF NOT EXISTS finding_geometries_gix ON quality.finding_geometries USING GIST (geometry);
