"""
Zone service.

Handles monitored zone assessment using the
trained AI model.
"""

from app.config import FEATURE_COLUMNS, LOW_ELEVATION_CONFIDENCE_THRESHOLD_M
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
from app.services.recommendation_service import (
    get_recommendation_service
)
import pandas as pd
import math

ZONE_AREA_HA = 9.0

# Risk classification is ranked WITHIN each municipality (not against a
# fixed province-wide cutoff) — DENR does not publish an official
# vulnerability threshold, so the most defensible approach is relative
# ranking: the most vulnerable zones in each locality stand out as
# "High" regardless of that municipality's overall baseline.
RISK_HIGH_PERCENTILE = 0.90   # top 10%
RISK_MODERATE_PERCENTILE = 0.70  # next 20% (0.70-0.90)


class ZoneService:
    """
    Handles monitored zone assessment.
    """

    def __init__(self):
        self.data_service = get_data_service()
        self.model_service = get_model_service()
        self.recommendation_service = (
            get_recommendation_service()
        )

    def _classify_risk(self, rank_pct: float) -> str:
        """
        Classifies a zone's risk level from its percentile rank
        (0-1) of vulnerability_score within its own municipality.
        """
        if rank_pct >= RISK_HIGH_PERCENTILE:
            return "high"
        if rank_pct >= RISK_MODERATE_PERCENTILE:
            return "moderate"
        return "low"

    def _confidence_flag(self, zone: dict) -> str:
        """
        Flags a zone as low-confidence when its elevation reading is
        near sea level, where satellite-derived measurements tend to
        be noisier and less reliable.
        """
        elevation = zone.get("mean_elevation")
        if elevation is None or (isinstance(elevation, float) and math.isnan(elevation)):
            return "low"
        if elevation < LOW_ELEVATION_CONFIDENCE_THRESHOLD_M:
            return "low"
        return "ok"

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

        # Attach predictions to a DataFrame so we can rank vulnerability
        # within each municipality group.
        df = pd.DataFrame(zones)
        df["vulnerability_score"] = predictions
        df["rank_pct"] = df.groupby("municipality")["vulnerability_score"].rank(
            pct=True, ascending=True
        )

        summaries = []

        for i, zone in enumerate(zones):
            prediction = predictions[i]
            rank_pct = df.iloc[i]["rank_pct"]

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
                    ),
                    risk_class=self._classify_risk(rank_pct),
                    confidence_flag=self._confidence_flag(zone),
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

        prediction_result = (
            self.model_service.predict(
                features
            )  
        )

        
        return ZoneDetail(

            zone_id=zone["zone_id"],

            lat=zone["lat"],

            lon=zone["lon"],

            municipality=zone["municipality"],


            vulnerability_score=
                prediction_result[
                    "vulnerability_score"
                ],


            expected_area_loss=round(
                prediction_result[
                    "vulnerability_score"
                ] / 100 * ZONE_AREA_HA,
                2
            ),


            top_factors=
                prediction_result[
                    "top_factors"
                ],


            recommendations=
                prediction_result[
                    "recommendations"
                ],


            raw_features=raw_features
        )


_zone_service = ZoneService()


def get_zone_service() -> ZoneService:
    """
    Returns the shared zone service.
    """

    return _zone_service