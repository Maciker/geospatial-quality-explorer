CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS quality;

CREATE TABLE quality.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_uri TEXT,
  source_crs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quality.validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES quality.datasets(id) ON DELETE CASCADE,
  ruleset_version TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE TABLE quality.findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_run_id UUID NOT NULL REFERENCES quality.validation_runs(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  feature_identifier TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  explanation TEXT NOT NULL,
  suggested_action TEXT,
  geometry GEOMETRY(Geometry, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX findings_geometry_gix ON quality.findings USING GIST (geometry);
CREATE INDEX findings_validation_run_idx ON quality.findings (validation_run_id);
