"""
Feature importance schemas.

Defines the response model for global feature importance.
"""

from pydantic import BaseModel


class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    importance: float