"""
Prediction endpoints.

Exposes API endpoints for AI-powered mangrove
area loss prediction.
"""

from fastapi import APIRouter

from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse
)

from app.services.prediction_service import (
    get_prediction_service
)

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"]
)


@router.post(
    "",
    response_model=PredictionResponse
)
def predict(
    request: PredictionRequest
):
    """
    Predict next year's mangrove area loss percentage.
    """

    prediction_service = get_prediction_service()

    return prediction_service.predict(request)