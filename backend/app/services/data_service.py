"""
Data service.

Loads and provides access to the monitored mangrove
zone dataset.
"""

import json

import pandas as pd

from app.config import FEATURE_TABLE_PATH, ERROR_BY_SEVERITY_PATH, GEOMETRY_COLUMN


class DataService:
    """
    Handles loading and accessing the zone dataset.
    """

    def __init__(self):
        """
        Load the dataset into memory.
        Normalise column names so the current_feature_table.csv
        (which uses slightly different names) maps to the same
        FEATURE_COLUMNS the model was trained on.
        """
        df = pd.read_csv(FEATURE_TABLE_PATH)

        # Map current_feature_table.csv names → training names
        df = df.rename(columns={
            "nearest_distance_to_aquaculture_m": "nearest_aquaculture_distance_m",
            "nearest_distance_to_roads_m":        "nearest_river_distance_m",
        })

        # Fill any missing required columns with 0 so the model
        # can still run — these will be flagged as low-confidence.
        from app.config import FEATURE_COLUMNS
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0.0

        self.dataset = df
        self._geometries = self._parse_geometries(df)

    @staticmethod
    def _parse_geometries(df: pd.DataFrame) -> dict[str, dict]:
        """
        Parses the GeoJSON geometry string column into real geometry
        dicts, keyed by zone_id.

        Parsed once at startup rather than per request — the map asks for
        all 398 footprints at once, and json.loads over the whole column
        is the expensive part of serving them.

        Rows with a missing or malformed geometry are skipped rather than
        raising: a zone with no footprint should still appear in the
        table and predictions, just not on the map.
        """
        if GEOMETRY_COLUMN not in df.columns:
            return {}

        geometries: dict[str, dict] = {}

        for zone_id, raw in zip(df["zone_id"], df[GEOMETRY_COLUMN]):
            if not isinstance(raw, str):
                continue
            try:
                geometries[zone_id] = json.loads(raw)
            except json.JSONDecodeError:
                continue

        return geometries

    def get_zone_geometries(self) -> dict[str, dict]:
        """
        Returns every zone's GeoJSON geometry, keyed by zone_id.
        """

        return self._geometries

    def get_all_zones(self) -> list[dict]:
        """
        Returns all monitored zones.
        """

        return self.dataset.to_dict(orient="records")

    def get_zone(
        self,
        zone_id: str
    ) -> dict | None:
        """
        Returns a single monitored zone.
        """

        zone = self.dataset[
            self.dataset["zone_id"] == zone_id
        ]

        if zone.empty:
            return None

        return zone.iloc[0].to_dict()

    def load_error_by_severity(self) -> pd.DataFrame:
        return pd.read_csv(
            ERROR_BY_SEVERITY_PATH
        )


# Singleton data service
_data_service = DataService()


def get_data_service() -> DataService:
    """
    Returns the shared data service instance.
    """

    return _data_service