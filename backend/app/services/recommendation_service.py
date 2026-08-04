"""
Recommendation service.

Converts model explanations and environmental
conditions into conservation actions.

This is rule-based and independent from the ML model.
"""



class RecommendationService:
    """
    Generates conservation recommendations.
    """


    def recommend(
        self,
        top_factors: list[dict],
        features: dict,
        risk: str | None = None
    ) -> list[str]:

        recommendations = []


        factor_names = {
            factor["feature"]
            for factor in top_factors
        }


        # High predicted vulnerability warrants on-site assessment
        # regardless of which factors are driving it.
        if risk == "high":

            recommendations.append(
                "Prioritize for field validation and immediate "
                "monitoring — high predicted vulnerability warrants "
                "on-site assessment."
            )


        # Aquaculture pressure
        if (
            "nearest_aquaculture_distance_m"
            in factor_names

            and features[
                "nearest_aquaculture_distance_m"
            ] < 500
        ):

            recommendations.append(
                "Review nearby aquaculture activities "
                "for possible land conversion pressure "
                "and buffer-zone compliance."
            )


        # Vegetation health
        if (
            "mean_ndvi"
            in factor_names

            and features["mean_ndvi"] < 0.5
        ):

            recommendations.append(
                "Conduct vegetation health assessment; "
                "low NDVI may indicate canopy stress."
            )


        # Mangrove condition
        if (
            "mean_mvi"
            in factor_names

            and features["mean_mvi"] < 0.35
        ):

            recommendations.append(
                "Assess mangrove stand condition; "
                "low MVI may indicate degradation."
            )


        # Elevation
        if (
            "mean_elevation"
            in factor_names

            and features["mean_elevation"] < 2
        ):

            recommendations.append(
                "Evaluate erosion-control and "
                "restoration strategies for "
                "low elevation areas."
            )


        # River connectivity
        if (
            "nearest_river_distance_m"
            in factor_names

            and features["nearest_river_distance_m"] > 1500
        ):

            recommendations.append(
                "Limited freshwater connectivity may be constraining "
                "recovery; evaluate hydrological restoration options."
            )


        # Default — differs for a zone already confirmed low-risk versus
        # one where the drivers are simply mixed/inconclusive.
        if not recommendations and risk == "low":

            recommendations.append(
                "Maintain routine monitoring cadence; no elevated-risk "
                "drivers identified in the current assessment window."
            )

        elif not recommendations:

            recommendations.append(
                "Continue routine monitoring; "
                "no dominant environmental drivers "
                "requiring immediate intervention "
                "were identified."
            )


        return recommendations



_recommendation_service = RecommendationService()


def get_recommendation_service():

    return _recommendation_service