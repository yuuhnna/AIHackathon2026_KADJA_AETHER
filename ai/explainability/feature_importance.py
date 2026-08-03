"""
This file is responsible of computing and visualization of the
importance of the AETHERv1.0 AI model

Input:
    - Trained Random Forest Model
    - Feature dataset (X)

Output: 
    - Ranked feature importance table
    - Feature importance plot
"""

import pandas as pd
import matplotlib.pyplot as plt
from analysis.save_plot import save_plot

def feature_importance(model, X):

    importance = pd.DataFrame({
        "Feature": X.columns,
        "Importance": model.feature_importances_
    })

    # Sort features by value 
    importance = importance.sort_values(
        by="Importance",
        ascending=False
    )

    print(importance)

    plt.figure(figsize=(8,5))

    plt.barh(
        importance['Feature'],
        importance['Importance']
    )

    plt.xlabel("Importance")
    plt.title("Random Forest Feature Importance")

    plt.gca().invert_yaxis()

    save_plot("feature_importance.png")

    return importance



