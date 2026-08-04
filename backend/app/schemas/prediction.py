"""
Prediction request and response schemas.

Defines the data models used for AI prediction endpoints.
"""

from pydantic import BaseModel

class PredictionRequest(BaseModel):
    """
    Input features required by the AI model.
    """
    mean_mvi: float
    mean_ndvi: float
    mean_elevation: float
    nearest_aquaculture_distance_m: float
    nearest_river_distance_m: float
    mean_slope: float
    mean_wind_speed: float
    mean_temperature: float
    annual_precipitation: float


class PredictionResponse(BaseModel):
    """
    AI prediction result.
    """

    next_year_change_pct: float