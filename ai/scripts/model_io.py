"""
This file is responsible for saving and loading the trained machine learning model

Input:
    - Trained model

Output:
    - Serialized model file (.joblib)
"""

from pathlib import Path

import joblib

def export_model(model, model_path: str):
    """
    Save the trained model to disk.
    """

    Path(model_path).parent.mkdir(parents=True, exist_ok=True)

    # Save model
    joblib.dump(model, model_path)

    print(f"Model is succesfully saved to: {model_path}")



def load_model(model_path: str):
    """
    Load the trained model
    """

    return joblib.load(model_path)