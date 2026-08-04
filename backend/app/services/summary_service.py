"""
Summary service.

Computes the dashboard summary statistics
for the monitored mangrove zones.
"""

from app.schemas.summary import SummaryResponse
from app.services.data_service import get_data_service
from app.services.model_service import get_model_service
import pandas as pd

ZONE_AREA_HA = 9.0


class SummaryService:
    """
    Handles dashboard summary statistics.
    """

    def __init__(self):
        self.data_service = get_data_service()
        self.model_service = get_model_service()

    def get_summary(self) -> SummaryResponse:
        """
        Returns the dashboard summary.
        """

        zones = self.data_service.get_all_zones()

        total_zones = len(zones)
        total_area = total_zones * ZONE_AREA_HA

        X = pd.DataFrame(zones)[
            self.model_service.feature_columns
        ]

        # predict_batch returns a plain list[float] of vulnerability
        # scores (not a DataFrame) — see model_service.py.
        predictions = self.model_service.predict_batch(X)

        highest_prediction = max(predictions)

        return SummaryResponse(
            total_mangrove_zones=total_zones,
            total_mangrove_area_ha=total_area,
            highest_predicted_area_loss_pct=round(
                float(highest_prediction),
                2
            ),
            active_rehabilitation_initiatives=0   # NOTE: Hardcoded temporarily, add implementation after rehabilitations activities is implemented
        )


_summary_service = SummaryService()


def get_summary_service() -> SummaryService:
    """
    Returns the shared summary service.
    """

    return _summary_service