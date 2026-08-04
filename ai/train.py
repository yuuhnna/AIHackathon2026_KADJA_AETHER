"""
Entry point of our AI Model training workflow

[!] This file must remain lightweight and only orchestrate the
    training pipeling
"""
from scripts.loader import load_dataset
from scripts.preprocess import preprocess
from scripts.trainer import train_model 
from scripts.test import test_model
from scripts.model_io import (export_model, load_model)
from explainability.feature_importance import feature_importance
from analysis.error_by_severity import (analyze_error_by_severity, plot_error_by_severity, export_error_by_severity)
from scripts.evaluate import (export_metrics, evaluate_model)
from scripts.export_scatter import export_scatter_data

# Define constants
DATASET_PATH = "data/raw/processed/feature_table.csv"
MODEL_PATH = "models/aether_v1.0.joblib"


def main():

    # Load dataset
    df = load_dataset(DATASET_PATH)

    # Split the dataset to training and testing dataset
    X_train, X_test, y_train, y_test = preprocess(df)

    # Train model
    model = train_model(X_train, y_train)

    test_model(model, X_test, y_test)

    export_model(model, MODEL_PATH)

    results, prediction_table = evaluate_model(
        model,
        X_test,
        y_test
    )

    dataset_info = {
        "samples": len(df),
        "features": len(X_train.columns)
    }

    export_metrics(
        results,
        dataset_info
    )

    importance = feature_importance(
        model,
        X_train
    )

    importance.to_csv(
        "models/feature_importance.csv",
        index=False
    )

    severity_summary = analyze_error_by_severity(
        prediction_table
    )

    plot_error_by_severity(severity_summary)

    print(prediction_table.columns)
    print(prediction_table.head())

    export_error_by_severity(
        prediction_table,
        "models/error_by_severity.csv"
    )
    export_scatter_data(prediction_table)
    



if __name__ == "__main__":
    main()