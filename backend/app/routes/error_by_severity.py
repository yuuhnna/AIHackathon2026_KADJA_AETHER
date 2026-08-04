"""
Error by severity endpoints.
"""

from fastapi import APIRouter

from app.services.error_by_severity_service import (
    get_error_by_severity_service
)
from app.schemas.error_by_severity import (
    ErrorBySeverityItem
)

router = APIRouter(
    prefix="/error-by-severity",
    tags=["Explainability"]
)

error_by_severity_service = (
    get_error_by_severity_service()
)


@router.get(
    "",
    response_model=list[ErrorBySeverityItem]
)
def get_error_by_severity():
    """
    Returns error statistics grouped by
    actual mangrove loss severity.
    """

    return (
        error_by_severity_service
        .get_error_by_severity()
    )