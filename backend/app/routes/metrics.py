"""
Model metrics endpoints.
"""

from fastapi import APIRouter

from app.schemas.metrics import MetricsResponse
from app.services.metrics_service import get_metrics_service

router = APIRouter(
    prefix="/model-metrics",
    tags=["Model Metrics"]
)


@router.get(
    "",
    response_model=MetricsResponse
)
def get_model_metrics():
    """
    Returns AI model evaluation metrics.
    """

    metrics_service = get_metrics_service()

    return metrics_service.get_metrics()