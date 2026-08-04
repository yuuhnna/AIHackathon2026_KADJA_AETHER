"""
Central configuration for the AETHER FastAPI backend.
"""

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

API_TITLE = "AETHER API"
API_VERSION = "1.0.0"

MODEL_PATH = ROOT_DIR / "models" / "aether_v1.joblib"
FEATURE_IMPORTANCE_PATH = ROOT_DIR / "models" / "feature_importance.csv"
FEATURE_TABLE_PATH = ROOT_DIR / "data" / "raw" / "processed" / "feature_table.csv"
METRICS_PATH = ROOT_DIR / "artifacts" / "metrics.json"

# Earth Engine writes each zone's footprint into the feature table as a
# GeoJSON geometry string under this column. It is the map's only source
# of real zone shapes, so it always stays in sync with the predictions
# computed from the same rows.
GEOMETRY_COLUMN = ".geo"

ERROR_BY_SEVERITY_PATH  = ROOT_DIR / "artifacts" / "error_by_severity.csv"
SCATTER_PLOT_PATH  = ROOT_DIR / "artifacts" / "scatter_plot.csv"

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

# Absolute cutoffs on a zone's predicted area loss for next year:
#
#   below 5%   -> Low
#   5% to 10%  -> Moderate
#   above 10%  -> High
#
# Values are on a 0-100 percentage scale — next_year_change_pct (and so
# vulnerability_score) is already a percentage, not a 0-1 fraction. A
# zone landing exactly on a cutoff counts as the lower band, so the
# Moderate range is inclusive at both ends.
#
# These are fixed thresholds, not a ranking: a zone's class depends only
# on its own prediction, so it does not change when neighbouring zones
# are added, removed or filtered.
RISK_THRESHOLDS = {"moderate": 5.0, "high": 10.0}

LOW_ELEVATION_CONFIDENCE_THRESHOLD_M = 2.0