"""
Evaluates the trained Random Forest model using the testing dataset
and computes regression performance metrics.
"""
from sklearn.metrics import(
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

import math
import numpy as np
import pandas as pd
from pathlib import Path
import json


def evaluate_model(model, X_test, y_test):
    """
    Evaluates the trained model on unseen data
    """

    predictions = model.predict(X_test)

    
    results = {
        "mae": mean_absolute_error(y_test, predictions),
        "rmse": np.sqrt(mean_squared_error(y_test, predictions)),
        "r2": r2_score(y_test, predictions)
    }

    prediction_table = pd.DataFrame({
        "Actual": y_test.values,
        "Predicted": predictions,
    })

    prediction_table["Absolute Error"] = (
        prediction_table["Actual"] -
        prediction_table["Predicted"]
    ).abs()

    return results, prediction_table

    # return{ 
    #     "MAE": mae,
    #     "RMSE": rmse,
    #     "R2": r2
    # }



def export_metrics(results, dataset_info):

    metrics = {
        "mae": float(results["mae"]),
        "rmse": float(results["rmse"]),
        "r2": float(results["r2"]),
        "confidence_score": round(
            float(results["r2"]) * 100,
            2
        ),
        "dataset": {
            "samples": int(dataset_info["samples"]),
            "features": int(dataset_info["features"])
        },
        "model": {
            "name": "Random Forest Regressor",
            "version": "1.0"
        }
    }

    output_path = Path("artifacts") / "metrics.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(metrics, f, indent=4)

        