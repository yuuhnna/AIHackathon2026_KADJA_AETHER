"""
Analyzes the model's prediction error across different mangrove
change severity levels and visualizes the Mean Absolute Error (MAE)
for each severity category.

Input:
    - Prediction results table

Output:
    - Error-by-severity summarization table
    - Error summary group by severity
"""
import pandas as pd
import matplotlib.pyplot as plt

from analysis.save_plot import save_plot

RANGE_BINS = [
    (0.0, 0.5, "0–0.5 ha"),
    (0.5, 1.0, "0.5–1 ha"),
    (1.0, 2.0, "1–2 ha"),
    (2.0, float("inf"), "2+ ha"),
]

def analyze_error_by_severity(prediction_table):
    """
    Analyze if the AI model performs poorly or only in severe mangrove degradation cases
    """

    print("\n========== ERROR BY SEVERITY ==========\n")

    df = prediction_table.copy()

    bins = [0, 1, 5, 20, 50, 101]

    labels = [
        "0–1%",
        "1–5%",
        "5–20%",
        "20–50%",
        "50–100%"
    ]

    df["Severity"] = pd.cut(
        df["Actual"],
        bins=bins,
        labels=labels,
        include_lowest=True,
        right=False
    )

    summary = (
        df.groupby("Severity", observed=True)
        .agg(
            Count=("Actual", "count"),
            MAE=("Absolute Error", "mean"),
            RMSE=("Absolute Error", lambda x: (x.pow(2).mean()) ** 0.5),
            MeanActual=("Actual", "mean"),
            MeanPrediction=("Predicted", "mean")
        )
        .reset_index()
    )

    summary["Percent"] = (
        summary["Count"] / len(df) * 100
    ).round(2)

    summary = summary[
        [
            "Severity",
            "Percent",
            "MAE",
            "RMSE",
            "MeanActual",
            "MeanPrediction"
        ]
    ]

    print(summary)

    return summary



def plot_error_by_severity(summary):

    plt.figure(figsize=(8,5))

    plt.bar(
        summary["Severity"],
        summary["MAE"]
    )

    plt.ylabel("Mean Absolute Error")
    plt.xlabel("Actual Mangrove Change")
    plt.title("Prediction Error by Severity")

    save_plot("error_by_severity.png")

    plt.close()


def export_error_by_severity(
    prediction_table: pd.DataFrame,
    output_path: str
) -> pd.DataFrame:
    """
    Export error statistics grouped by actual loss severity.
    """

    df = prediction_table.copy()

    df["absolute_error"] = (
        df["Actual"] - df["Predicted"]
    ).abs()

    rows = []

    for lower, upper, label in RANGE_BINS:

        subset = df[
            (df["Actual"] >= lower)
            & (df["Actual"] < upper)
        ]

        rows.append(
            {
                "range": label,
                "sample_size": len(subset),
                "mae": round(
                    subset["absolute_error"].mean(),
                    2
                ) if len(subset) else None,
                "error_min": round(
                    subset["absolute_error"].min(),
                    2
                ) if len(subset) else None,
                "error_max": round(
                    subset["absolute_error"].max(),
                    2
                ) if len(subset) else None,
            }
        )

    result = pd.DataFrame(rows)

    result.to_csv(
        output_path,
        index=False
    )

    return result