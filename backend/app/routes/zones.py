"""
Zone endpoints.

Exposes API endpoints for monitored mangrove zones.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.zone import (
    ZoneSummary,
    ZoneDetail
)
from app.services.zone_service import (
    get_zone_service
)

router = APIRouter(
    prefix="/zones",
    tags=["Zones"]
)


@router.get(
    "",
    response_model=list[ZoneSummary]
)
def get_all_zones():
    """
    Returns all monitored zones.
    """

    zone_service = get_zone_service()

    return zone_service.get_all_zones()


@router.get(
    "/{zone_id}",
    response_model=ZoneDetail
)
def get_zone(
    zone_id: str
):
    """
    Returns a single monitored zone.
    """

    zone_service = get_zone_service()

    zone = zone_service.get_zone(zone_id)

    if zone is None:
        raise HTTPException(
            status_code=404,
            detail=f"Zone '{zone_id}' not found."
        )

    return zone