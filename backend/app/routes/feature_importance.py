"""
Feature importance endpoint.
"""

from fastapi import APIRouter

from app.schemas.feature_importance import FeatureImportanceItem
from app.services.feature_importance_service import get_feature_importance_service

router = APIRouter(
    prefix="/feature-importance",
    tags=["Feature Importance"],
)


@router.get(
    "",
    response_model=list[FeatureImportanceItem],
)
def get_feature_importance():
    """
    Returns global Random Forest feature importance (MDI),
    sorted descending by importance score.
    """
    service = get_feature_importance_service()
    return service.get_feature_importance()
