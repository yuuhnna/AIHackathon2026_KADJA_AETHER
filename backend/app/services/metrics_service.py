"""
Metrics service.

Loads AI evaluation metrics generated during training.
"""

import json

from app.schemas.metrics import MetricsResponse
from app.config import METRICS_PATH


class MetricsService:
    """
    Handles model evaluation metrics.
    """

    def get_metrics(self) -> MetricsResponse:
        """
        Load model metrics from disk.
        """

        with open(METRICS_PATH, "r") as file:
            data = json.load(file)

        return MetricsResponse(**data)


_metrics_service = MetricsService()


def get_metrics_service() -> MetricsService:
    """
    Returns the shared metrics service instance.
    """

    return _metrics_service