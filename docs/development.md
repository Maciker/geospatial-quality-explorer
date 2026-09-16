# Local development

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker Compose
- QGIS for the QGIS workflow issues

## Database

```bash
docker compose -f infra/docker-compose.yml up -d db
```

The compose file creates a local development database and loads the initial schema. It is only for local development; never reuse the included password outside that environment.

## API

```bash
cd apps/api
python -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[dev]'
fastapi dev app/main.py
```

Run the API test suite with `pytest` from `apps/api`.

## Web

```bash
cd apps/web
npm install
npm run dev
```

The web app expects the API at `http://localhost:8000` by default. Set `VITE_API_BASE_URL` for a different local address.
