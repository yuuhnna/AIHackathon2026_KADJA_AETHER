"""
Model metrics schemas.

Defines the response model for AI evaluation metrics.
All fields map directly to artifacts/metrics.json.
"""

from pydantic import BaseModel
from typing import Optional


class DatasetInfo(BaseModel):
    samples: int
    features: int
    # Additional metadata added so the frontend can display
    # these without hardcoding them in the UI.
    year_range: Optional[str] = None
    source: Optional[str] = None
    prediction_target: Optional[str] = None
    prediction_horizon: Optional[str] = None


class ModelInfo(BaseModel):
    name: str
    version: str
    type: Optional[str] = None


class MetricsResponse(BaseModel):
    mae: float
    rmse: float
    r2: float
    confidence_score: float
    dataset: DatasetInfo
    model: ModelInfo
