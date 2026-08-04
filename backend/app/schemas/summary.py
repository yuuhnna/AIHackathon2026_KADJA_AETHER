"""
Summary schemas.

Defines the response model for the
dashboard summary endpoint.
"""

from pydantic import BaseModel


class SummaryResponse(BaseModel):
    """
    Dashboard summary statistics.
    """

    total_mangrove_zones: int
    total_mangrove_area_ha: float
    highest_predicted_area_loss_pct: float
    active_rehabilitation_initiatives: int