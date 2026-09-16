from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_service_metadata() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "geospatial-quality-explorer-api"
    assert body["timestamp"].endswith("Z") or "+00:00" in body["timestamp"]
