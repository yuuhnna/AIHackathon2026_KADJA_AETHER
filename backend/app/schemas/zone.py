"""
Zone schemas.

Defines the response models for monitored mangrove zones.
"""

from pydantic import BaseModel
from typing import Optional


class ZoneSummary(BaseModel):
    """
    Summary information for a monitored zone.
    """

    zone_id: str
    lat: float
    lon: float
    vulnerability_score: float
    municipality: str
    expected_area_loss: float


class ZoneDetail(ZoneSummary):
    """
    Detailed information for a monitored zone.
    """

    raw_features: dict[str, Optional[float]]