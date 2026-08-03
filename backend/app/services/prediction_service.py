"""
Prediction service.

Handles the prediction workflow by coordinating the
AI model and formatting the prediction response.
"""

from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse
)
from app.services.model_service import get_model_service


class PredictionService:
    """
    Handles AI prediction requests.
    """

    def __init__(self):
        self.model_service = get_model_service()

    def predict(
        self,
        request: PredictionRequest
    ) -> PredictionResponse:
        """
        Predict next year's mangrove area loss percentage.

        Input:
            - Prediction request

        Output:
            - Prediction response
        """

        prediction = self.model_service.predict(
            request.model_dump()
        )

        return PredictionResponse(
            next_year_change_pct=
                prediction["vulnerability_score"]
        )


# Singleton prediction service
_prediction_service = PredictionService()


def get_prediction_service() -> PredictionService:
    """
    Returns the shared prediction service instance.
    """

    return _prediction_service