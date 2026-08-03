"""
Data service.

Loads and provides access to the monitored mangrove
zone dataset.
"""

import pandas as pd

from app.config import FEATURE_TABLE_PATH


class DataService:
    """
    Handles loading and accessing the zone dataset.
    """

    def __init__(self):
        """
        Load the dataset into memory.
        """
        self.dataset = pd.read_csv(FEATURE_TABLE_PATH)

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


# Singleton data service
_data_service = DataService()


def get_data_service() -> DataService:
    """
    Returns the shared data service instance.
    """

    return _data_service