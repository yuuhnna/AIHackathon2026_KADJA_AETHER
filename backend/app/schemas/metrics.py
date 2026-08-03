"""
Model metrics schemas.

Defines the response model for AI evaluation metrics.
"""

from pydantic import BaseModel


class DatasetInfo(BaseModel):
    samples: int
    features: int


class ModelInfo(BaseModel):
    name: str
    version: str


class MetricsResponse(BaseModel):
    mae: float
    rmse: float
    r2: float
    confidence_score: float
    dataset: DatasetInfo
    model: ModelInfo