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


if __name__ == "__main__":
    main()