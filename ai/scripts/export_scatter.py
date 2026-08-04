import json
from pathlib import Path


def export_scatter_data(prediction_table):
    """
    Export prediction results for frontend scatter plot.
    """

    points = []

    for _, row in prediction_table.iterrows():
        points.append({
            "actual": float(row["Actual"]),
            "predicted": float(row["Predicted"]),
            "absolute_error": float(row["Absolute Error"])
        })

    artifact = {
        "title": "Actual vs Predicted",
        "xAxis": "Actual",
        "yAxis": "Predicted",
        "points": points
    }

    output_path = Path("artifacts") / "scatter_plot.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(artifact, f, indent=4)