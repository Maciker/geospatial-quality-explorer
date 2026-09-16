.PHONY: db-up db-down api-test api-dev web-dev

db-up:
	docker compose -f infra/docker-compose.yml up -d db

db-down:
	docker compose -f infra/docker-compose.yml down

api-test:
	cd apps/api && pytest

api-dev:
	cd apps/api && fastapi dev app/main.py

web-dev:
	cd apps/web && npm run dev
