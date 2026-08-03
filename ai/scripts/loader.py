"""
This file is responsible for loading the dataset 

Input:
    - CSV, GeoPackage

Output:
    - Raw pandas DataFrame
"""

import pandas as pd

def load_dataset(path: str) -> pd.DataFrame:
    """ Loads dataset from CSV """

    return pd.read_csv(path)
