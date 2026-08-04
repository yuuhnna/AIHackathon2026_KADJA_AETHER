"""
Zone endpoints.

Exposes API endpoints for monitored mangrove zones.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.zone import (
    ZoneSummary,
    ZoneDetail,
    ZoneGeoCollection
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


# Declared before /{zone_id} on purpose — FastAPI matches routes in
# declaration order, so the other way round "geojson" would be captured
# as a zone_id and 404.
@router.get(
    "/geojson",
    response_model=ZoneGeoCollection
)
def get_zones_geojson():
    """
    Returns all monitored zone footprints as GeoJSON, for map rendering.
    """

    zone_service = get_zone_service()

    return zone_service.get_zones_geojson()


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