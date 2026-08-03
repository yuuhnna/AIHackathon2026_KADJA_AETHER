"""
Model service.

Loads the trained AI model once and provides prediction
functionality for the backend.
"""
import joblib
import pandas as pd

from app.config import MODEL_PATH, FEATURE_COLUMNS

class ModelService:
    """
    Handles AI model loading and prediction.
    """

    def __init__(self):
        """
        Load the trained model into memory.
        """
        self.model = joblib.load(MODEL_PATH)

    def predict(self, features: dict) -> float:
        """
        Predict next year's mangrove area loss percentage.

        Input:
            - Dictionary containing the model features.

        Output:
            - Predicted next_year_change_pct.
        """

        X = pd.DataFrame(
            [features],
            columns=FEATURE_COLUMNS
        )

        prediction = self.model.predict(X)[0]

        return float(prediction)


    def predict_batch(self, X: pd.DataFrame) -> list[float]:
        """
        Predict multiple feature vectors.
        """

        predictions = self.model.predict(X)

        return predictions.tolist()

# Singleton model service
_model_service = ModelService()


def get_model_service():
    """
    Returns the shared model service instance.
    """

    return _model_service