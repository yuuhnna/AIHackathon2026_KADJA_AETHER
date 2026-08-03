"""
This file is responsible for evaluating the trained model on the testing dataset.

Input:
    - Trained model
    - Testing dataset

Output:
    - Regression evaluation metrics
"""

from sklearn.metrics import(
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
import numpy as np

def test_model(model, X_test, y_test):
    """
    Evaluate trained model
    """

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, predictions)

    print("\n===== Model Evaluation =====")
    print(f"MAE :  {mae:.4f}")
    print(f"MSE :  {mse:.4f}")
    print(f"RMSE:  {rmse:.4f}")
    print(f"R²  :  {r2:.4f}")

    return {
        "mae": mae,
        "mse": mse,
        "rmse": rmse,
        "r2": r2,
    }