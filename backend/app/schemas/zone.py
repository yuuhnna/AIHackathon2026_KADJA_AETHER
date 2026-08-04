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
    top_factors: list[TopFactor] = []
    rehabilitation_status: str = "None"


class ZoneGeoProperties(BaseModel):
    """
    The per-zone attributes the map needs to style a footprint.

    Deliberately narrow — the map only colours and labels shapes, so
    sending the full ZoneSummary for all 398 zones a second time would
    double the payload for nothing.
    """

    zone_id: str
    risk_class: str
    vulnerability_score: float
    municipality: str


class ZoneGeoFeature(BaseModel):
    """
    One zone footprint as a GeoJSON Feature.
    """

    type: Literal["Feature"] = "Feature"
    geometry: dict
    properties: ZoneGeoProperties


class ZoneGeoCollection(BaseModel):
    """
    All zone footprints as a GeoJSON FeatureCollection, ready to hand
    straight to Leaflet's L.geoJSON().
    """

    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[ZoneGeoFeature]


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