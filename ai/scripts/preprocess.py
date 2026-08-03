"""
This file is responsible for preparing the raw dataset for machine learning. Handles the encoding features, 
splitting the dataset, and preparing the final training inputs.

Input:
    - Raw DataFrame

Output:
    - X_train, X_test, y_train, y_test
"""

from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [
    "annual_precipitation",
    "mean_elevation",
    "mean_mvi",
    "mean_ndvi",
    "mean_slope",
    "mean_temperature",
    "mean_wind_speed",
    "nearest_aquaculture_distance_m",
    "nearest_river_distance_m"
]

TARGET_COLUMN = "next_year_change_pct"

def preprocess(df):
    """
    Select features and target, then split the dataset
    """
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    return X_train, X_test, y_train, y_test