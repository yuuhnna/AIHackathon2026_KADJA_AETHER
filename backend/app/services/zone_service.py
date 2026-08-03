"""
Zone service.

Handles monitored zone assessment using the
trained AI model.
"""

from app.config import FEATURE_COLUMNS
from app.schemas.zone import (
    ZoneSummary,
    ZoneDetail
)
from app.services.data_service import (
    get_data_service
)
from app.services.model_service import (
    get_model_service
)
import pandas as pd
import math

ZONE_AREA_HA = 9.0


class ZoneService:
    """
    Handles monitored zone assessment.
    """

    def __init__(self):
        self.data_service = get_data_service()
        self.model_service = get_model_service()

    def get_all_zones(
        self
    ) -> list[ZoneSummary]:
        """
        Returns all monitored zones with predictions.
        """

        zones = self.data_service.get_all_zones()

        X = pd.DataFrame(
            [
                {
                    feature: zone[feature]
                    for feature in FEATURE_COLUMNS
                }
                for zone in zones
            ]
        )

        predictions = self.model_service.predict_batch(X)

        summaries = []

        for zone, prediction in zip(zones, predictions):

            summaries.append(
                ZoneSummary(
                    zone_id=zone["zone_id"],
                    lat=zone["lat"],
                    lon=zone["lon"],
                    municipality=zone["municipality"],
                    vulnerability_score=prediction,
                    expected_area_loss=round(
                        prediction / 100 * ZONE_AREA_HA,
                        2
                    )
                )
            )

        return summaries
    

    def get_zone(
        self,
        zone_id: str
    ) -> ZoneDetail | None:
        """
        Returns one monitored zone.
        """

        zone = self.data_service.get_zone(zone_id)

        if zone is None:
            return None

        features = {
            feature: zone[feature]
            for feature in FEATURE_COLUMNS
        }

        raw_features = {}

        for key, value in features.items():

            if isinstance(value, float) and math.isnan(value):
                raw_features[key] = None
            else:
                raw_features[key] = float(value)

        prediction = self.model_service.predict(
            features
        )

        return ZoneDetail(
            zone_id=zone["zone_id"],
            lat=zone["lat"],
            lon=zone["lon"],
            municipality=zone["municipality"],
            vulnerability_score=prediction,
            expected_area_loss=round(
                prediction / 100 * ZONE_AREA_HA,
                2
            ),
            raw_features=raw_features
        )


_zone_service = ZoneService()


def get_zone_service() -> ZoneService:
    """
    Returns the shared zone service.
    """

    return _zone_service