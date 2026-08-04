"""
Feature importance service.

Reads the feature_importance.csv exported by the AI training
pipeline and maps each raw feature name to a human-readable
label using the FEATURE_LABELS lookup in config.
"""

import pandas as pd

from app.config import FEATURE_IMPORTANCE_PATH, FEATURE_LABELS
from app.schemas.feature_importance import FeatureImportanceItem


class FeatureImportanceService:
    def get_feature_importance(self) -> list[FeatureImportanceItem]:
        """
        Load feature importance from CSV, attach human-readable
        labels, and return sorted descending by importance.
        """
        df = pd.read_csv(FEATURE_IMPORTANCE_PATH)

        # Normalise column names — the CSV uses 'Feature'/'Importance'
        df.columns = [c.strip().lower() for c in df.columns]

        items = []
        for _, row in df.iterrows():
            feature = str(row["feature"])
            items.append(
                FeatureImportanceItem(
                    feature=feature,
                    label=FEATURE_LABELS.get(feature, feature),
                    importance=float(row["importance"]),
                )
            )

        # Highest importance first
        items.sort(key=lambda x: x.importance, reverse=True)
        return items


_feature_importance_service = FeatureImportanceService()


def get_feature_importance_service() -> FeatureImportanceService:
    return _feature_importance_service
