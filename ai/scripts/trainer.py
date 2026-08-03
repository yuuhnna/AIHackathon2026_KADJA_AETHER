"""
This file is responsible for training the machine learning model using the processed dataset.

Input:
    - Processed training dataset

Output:
    - Trained machine learning model
"""
from sklearn.ensemble import RandomForestRegressor

def train_model(X_train, y_train):
    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    return model