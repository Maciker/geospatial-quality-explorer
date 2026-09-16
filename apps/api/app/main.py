"""Application entry point for Geospatial Quality Explorer."""

from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="Geospatial Quality Explorer API",
    version="0.1.0",
    description="Read-only API for deterministic geospatial data-quality findings.",
)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    timestamp: datetime


class FeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[dict] = Field(default_factory=list)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Report that the HTTP service is available."""
    return HealthResponse(
        status="ok",
        service="geospatial-quality-explorer-api",
        timestamp=datetime.now(timezone.utc),
    )


@app.get("/api/v1/findings", response_model=FeatureCollection, tags=["findings"])
def list_findings() -> FeatureCollection:
    """Return findings as GeoJSON.

    Database-backed filtering is intentionally introduced in the persistence issue.
    Returning an empty collection keeps the frontend contract testable from day one.
    """
    return FeatureCollection()
