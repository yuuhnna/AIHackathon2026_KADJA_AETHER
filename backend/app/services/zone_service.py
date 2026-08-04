"""
Zone service.

Handles monitored zone assessment using the
trained AI model.
"""

from app.config import (
    FEATURE_COLUMNS,
    LOW_ELEVATION_CONFIDENCE_THRESHOLD_M,
    FEATURE_LABELS,
    RISK_THRESHOLDS
)
from app.schemas.zone import (
    ZoneSummary,
    ZoneDetail,
    ZoneGeoCollection,
    ZoneGeoFeature,
    ZoneGeoProperties
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

# Risk classification uses fixed cutoffs on a zone's own predicted area
# loss — see RISK_THRESHOLDS in app.config for the bands themselves.
#
# This replaced a within-municipality percentile ranking. Ranking always
# produced a top 10% no matter how healthy the province was, and a zone
# could change class purely because its neighbours did — which made
# "High risk" mean "worst locally" rather than "losing a lot of area".


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
        # The feature table is loaded once and never mutated at runtime,
        # so the bulk predictions are safe to compute once and
        # reuse — both for get_all_zones() itself and so get_zone() can
        # look up a single zone's risk_class without rerunning
        # predict_batch over every monitored zone on every detail click.
        self._zone_summaries_cache: list[ZoneSummary] | None = None

    def _classify_risk(self, predicted_loss_pct: float) -> str:
        """
        Classifies a zone from the area loss predicted for it next year,
        as a percentage of the zone's own area.

        Low below 5%, Moderate from 5% through 10%, High above 10%.
        """
        if predicted_loss_pct > RISK_THRESHOLDS["high"]:
            return "high"
        if predicted_loss_pct >= RISK_THRESHOLDS["moderate"]:
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
        Returns all monitored zones with predictions and per-zone
        SHAP-based top_factors — computed in one batch so the table
        matches the zone assessment detail panel exactly.
        """

        if self._zone_summaries_cache is not None:
            return self._zone_summaries_cache

        zones = self.data_service.get_all_zones()

        X = pd.DataFrame(
            [
                {feature: zone[feature] for feature in FEATURE_COLUMNS}
                for zone in zones
            ]
        )

        predictions = self.model_service.predict_batch(X)

        # Batch SHAP — one call for all zones, same explainer used by
        # get_zone(), so top_factors matches the detail panel exactly.
        shap_matrix = self.model_service.explainer.shap_values(X)

        summaries = []

        for i, zone in enumerate(zones):
            prediction = predictions[i]

            # Use the same _top_factors logic as the single-zone predict()
            top_factors = self.model_service._top_factors(
                shap_matrix[i],
                top_n=3
            )

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
                    risk_class=self._classify_risk(prediction),
                    confidence_flag=self._confidence_flag(zone),
                    top_factors=top_factors,
                )
            )

        self._zone_summaries_cache = summaries
        return summaries


    def get_zones_geojson(self) -> ZoneGeoCollection:
        """
        Returns every zone's real footprint as a GeoJSON
        FeatureCollection, carrying the same risk_class the table and
        detail panel use — so the map colours a shape exactly the way the
        rest of the dashboard classifies it.

        Zones whose geometry failed to parse are omitted; they still
        appear everywhere else in the app.
        """

        geometries = self.data_service.get_zone_geometries()

        features = [
            ZoneGeoFeature(
                geometry=geometries[summary.zone_id],
                properties=ZoneGeoProperties(
                    zone_id=summary.zone_id,
                    risk_class=summary.risk_class,
                    vulnerability_score=summary.vulnerability_score,
                    municipality=summary.municipality,
                ),
            )
            for summary in self.get_all_zones()
            if summary.zone_id in geometries
        ]

        return ZoneGeoCollection(features=features)


    def _get_risk_class(self, zone_id: str) -> str:
        """
        A single zone's risk_class, from the same cached predictions
        used by get_all_zones() — so the Dashboard's zone list
        and the zone detail panel never disagree on a zone's risk.
        """
        for summary in self.get_all_zones():
            if summary.zone_id == zone_id:
                return summary.risk_class
        return "low"


    def get_zone(
        self,
        zone_id: str
    ) -> ZoneDetail | None:
        """
        Returns one monitored zone.
        Reuses the cached vulnerability_score and top_factors from
        get_all_zones() so the detail panel always matches the table.
        """

        zone = self.data_service.get_zone(zone_id)

        if zone is None:
            return None

        # Get the cached summary so vulnerability_score is identical
        # to what the table shows — avoids tiny float differences between
        # a fresh single predict() and the batch predict_batch() result.
        cached_summary = next(
            (s for s in self.get_all_zones() if s.zone_id == zone_id),
            None
        )

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

        risk_class = self._get_risk_class(zone_id)

        # Use cached vulnerability_score so it matches the table,
        # but always run a fresh predict() for the detail panel so
        # we get all 9 SHAP factors, not just the 3 stored in the
        # bulk cache.
        if cached_summary is not None:
            vulnerability_score = cached_summary.vulnerability_score
        else:
            vulnerability_score = None

        # Fresh single-zone predict — returns all features (top_n=10
        # in model_service._top_factors), recommendations, and score.
        prediction_result = self.model_service.predict(features, risk_class)

        # Use cached score if we have it (consistent with the table),
        # otherwise use the fresh score.
        if vulnerability_score is None:
            vulnerability_score = prediction_result["vulnerability_score"]

        # Always use the fresh top_factors so the detail panel shows
        # all 9 contributing factors, not just the top 3 from the cache.
        top_factors = prediction_result["top_factors"]

        return ZoneDetail(
            zone_id=zone["zone_id"],
            lat=zone["lat"],
            lon=zone["lon"],
            municipality=zone["municipality"],
            vulnerability_score=vulnerability_score,
            expected_area_loss=round(vulnerability_score / 100 * ZONE_AREA_HA, 2),
            risk_class=risk_class,
            confidence_flag=self._confidence_flag(zone),
            top_factors=top_factors,
            recommendations=prediction_result["recommendations"],
            raw_features=raw_features
        )


_zone_service = ZoneService()


def get_zone_service() -> ZoneService:
    """
    Returns the shared zone service.
    """

    return _zone_service