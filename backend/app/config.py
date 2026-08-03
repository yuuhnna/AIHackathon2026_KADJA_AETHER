"""
Central configuration for the AETHER FastAPI backend.
"""

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

API_TITLE = "AETHER API"
API_VERSION = "1.0.0"

MODEL_PATH = ROOT_DIR / "models" / "aether_v1.joblib"
FEATURE_IMPORTANCE_PATH = ROOT_DIR / "models" / "feature_importance2.csv"
FEATURE_TABLE_PATH = ROOT_DIR / "data" / "processed" / "feature_table.csv"

# Column names AND ORDER match exactly what aether_v1.joblib was
# trained on (see training/preprocessing/feature_selection.py's
# FEATURE_COLUMNS) — scikit-learn validates both name and column
# position at predict time, so this order must never be changed
# without retraining the model.
FEATURE_COLUMNS = [
    "annual_precipitation",
    "mean_elevation",
    "mean_mvi",
    "mean_ndvi",
    "mean_slope",
    "mean_temperature",
    "mean_wind_speed",
    "nearest_aquaculture_distance_m",
    "nearest_river_distance_m",
]

FEATURE_LABELS = {
    "mean_ndvi": "Vegetation health (NDVI)",
    "mean_mvi": "Mangrove-specific vegetation condition (MVI)",
    "mean_temperature": "Mean air temperature",
    "annual_precipitation": "Annual precipitation",
    "mean_wind_speed": "Mean wind exposure",
    "mean_elevation": "Elevation above sea level",
    "mean_slope": "Terrain slope",
    "nearest_aquaculture_distance_m": "Proximity to aquaculture sites",
    "nearest_river_distance_m": "Proximity to rivers",
}

RISK_THRESHOLDS = {"low": 35, "moderate": 55}  # above moderate => High. Values are on a 0-100 percentage scale — next_year_change_pct (and vulnerability_score) is already a percentage, not a 0-1 fraction.

LOW_ELEVATION_CONFIDENCE_THRESHOLD_M = 2.0