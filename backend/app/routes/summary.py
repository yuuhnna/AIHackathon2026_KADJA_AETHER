"""
Summary endpoints.

Exposes dashboard summary statistics.
"""

from fastapi import APIRouter

from app.schemas.summary import SummaryResponse
from app.services.summary_service import (
    get_summary_service
)

router = APIRouter(
    prefix="/summary",
    tags=["Summary"]
)


@router.get(
    "",
    response_model=SummaryResponse
)
def get_summary():
    """
    Returns dashboard summary statistics.
    """

    service = get_summary_service()

    return service.get_summary()