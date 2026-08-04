"""
Retrain the model using the backend venv's scikit-learn so the
saved joblib is compatible with the version used to serve it.

Run from the backend/ folder:
    .venv\\Scripts\\python.exe retrain.py
"""
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent
DATA_PATH   = ROOT.parent / "ai" / "data" / "raw" / "processed" / "feature_table.csv"
MODEL_OUT   = ROOT / "models" / "aether_v1.joblib"
FI_OUT      = ROOT / "models" / "feature_importance.csv"
METRICS_OUT = ROOT / "artifacts" / "metrics.json"

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
TARGET_COLUMN = "next_year_change_pct"

FEATURE_LABELS = {
    "mean_ndvi":                       "Vegetation health (NDVI)",
    "mean_mvi":                        "Mangrove-specific vegetation condition (MVI)",
    "mean_temperature":                "Mean air temperature",
    "annual_precipitation":            "Annual precipitation",
    "mean_wind_speed":                 "Mean wind exposure",
    "mean_elevation":                  "Elevation above sea level",
    "mean_slope":                      "Terrain slope",
    "nearest_aquaculture_distance_m":  "Proximity to aquaculture sites",
    "nearest_river_distance_m":        "Proximity to rivers",
}

# ── Load data ─────────────────────────────────────────────────────────────────
print(f"Loading dataset from {DATA_PATH} ...")
df = pd.read_csv(DATA_PATH)
print(f"  {len(df)} rows, {len(df.columns)} columns")

X = df[FEATURE_COLUMNS]
y = df[TARGET_COLUMN]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── Train ─────────────────────────────────────────────────────────────────────
print("Training RandomForestRegressor ...")
model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)
print("  Training complete.")

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
mae    = float(mean_absolute_error(y_test, y_pred))
rmse   = float(np.sqrt(mean_squared_error(y_test, y_pred)))
r2     = float(r2_score(y_test, y_pred))

# confidence_score = fraction of test samples whose absolute error
# is within 10 percentage points (a meaningful threshold for area-loss %)
confidence_score = float(np.mean(np.abs(y_pred - y_test) <= 10.0))

print(f"  MAE:              {mae:.4f}")
print(f"  RMSE:             {rmse:.4f}")
print(f"  R²:               {r2:.4f}")
print(f"  Confidence score: {confidence_score:.4f}")

# ── Save model ────────────────────────────────────────────────────────────────
MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
joblib.dump(model, MODEL_OUT)
print(f"  Model saved → {MODEL_OUT}")

# ── Feature importance CSV ────────────────────────────────────────────────────
fi = pd.DataFrame({
    "Feature":    FEATURE_COLUMNS,
    "Importance": model.feature_importances_,
}).sort_values("Importance", ascending=False)

fi.to_csv(FI_OUT, index=False)
print(f"  Feature importance saved → {FI_OUT}")

# ── Metrics JSON ──────────────────────────────────────────────────────────────
metrics = {
    "mae":              mae,
    "rmse":             rmse,
    "r2":               r2,
    "confidence_score": confidence_score,
    "dataset": {
        "samples":  len(df),
        "features": len(FEATURE_COLUMNS),
    },
    "model": {
        "name":    "Random Forest Regressor",
        "version": "1.0",
    },
}
METRICS_OUT.parent.mkdir(parents=True, exist_ok=True)
with open(METRICS_OUT, "w") as f:
    json.dump(metrics, f, indent=4)
print(f"  Metrics saved → {METRICS_OUT}")

print("\nDone. You can now start the backend:")
print("  .venv\\Scripts\\uvicorn.exe main:app --reload --port 8000")
