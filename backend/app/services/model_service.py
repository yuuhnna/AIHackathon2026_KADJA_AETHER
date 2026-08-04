"""
Model service.

Loads the trained AI model once and provides prediction
functionality for the backend.
"""
import joblib
import pandas as pd

from app.config import MODEL_PATH, FEATURE_COLUMNS
from app.services.recommendation_service import (
    get_recommendation_service
)
import shap
import numpy as np
from app import config


class ModelService:
    """
    Handles AI model loading and prediction.
    """

    def __init__(self):
        """
        Load the trained model into memory.
        """
        self.model = joblib.load(MODEL_PATH)

        self.explainer = shap.TreeExplainer(
            self.model
        )
        self.feature_columns = FEATURE_COLUMNS

        self.recommendation_service = (
            get_recommendation_service()
        )


    def predict(self, features: dict, risk: str | None = None) -> float:
        """
        Predict next year's mangrove area loss percentage.

        Input:
            - Dictionary containing the model features.
            - risk: this zone's risk_class ("low"/"moderate"/"high"), if
              already known by the caller — enables the risk-based
              recommendation rules. Callers without zone/municipality
              context (e.g. the ad hoc /predict endpoint) can omit it.

        Output:
            - Predicted next_year_change_pct.
        """

        X = pd.DataFrame(
            [features],
            columns=FEATURE_COLUMNS
        )

        prediction = self.model.predict(X)[0]

        shap_values = self.explainer.shap_values(
            X
        )

        top_factors = self._top_factors(
            shap_values[0],
            top_n=10
        )


        recommendations = (
            self.recommendation_service.recommend(
                top_factors,
                features,
                risk
            )
        )


        return {
            "vulnerability_score": round(
                float(prediction),
                4
            ),

            "top_factors": top_factors,

            "recommendations": recommendations
        }



    def predict_batch(
        self,
        dataframe: pd.DataFrame
    ) -> list[float]:
        """
        Batch prediction for multiple zones.
        """

        X = dataframe[
            self.feature_columns
        ]

        predictions = self.model.predict(X)

        return predictions.tolist()


    def _top_factors(
        self,
        shap_row: np.ndarray,
        top_n: int = 10
    ) -> list[dict]:
        """
        Extract highest contributing features.
        """

        indexes = np.argsort(
            -np.abs(shap_row)
        )[:top_n]


        factors = []


        for index in indexes:

            feature = (
                self.feature_columns[index]
            )

            factors.append(
                {
                    "feature": feature,

                    "label":
                        config.FEATURE_LABELS.get(
                            feature,
                            feature
                        ),

                    "shap_value":
                        round(
                            float(shap_row[index]),
                            4
                        ),

                    "direction":
                        (
                            "increases"
                            if shap_row[index] > 0
                            else "decreases"
                        )
                }
            )


        return factors



# Singleton model service
_model_service = ModelService()


def get_model_service():
    """
    Returns the shared model service instance.
    """

    return _model_service