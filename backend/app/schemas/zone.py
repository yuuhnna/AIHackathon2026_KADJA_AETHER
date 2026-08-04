"""
Zone schemas.

Defines the response models for monitored mangrove zones.
"""

from pydantic import BaseModel
from typing import Optional, Literal



class TopFactor(BaseModel):
    """
    SHAP explanation factor.
    """

    feature: str
    label: str
    shap_value: float
    direction: Literal[
        "increases",
        "decreases"
    ]



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
    risk_class: str
    confidence_flag: str


class ZoneDetail(BaseModel):

    zone_id: str

    lat: float

    lon: float

    municipality: str


    vulnerability_score: float

    expected_area_loss: float

    risk_class: str

    confidence_flag: str


    top_factors: list[TopFactor]

    recommendations: list[str]


    raw_features: dict[str, float | None]