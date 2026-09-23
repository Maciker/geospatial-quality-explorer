-- Docker only enables PostGIS. Versioned tables live in packages/persistence/migrations.
CREATE EXTENSION IF NOT EXISTS postgis;
