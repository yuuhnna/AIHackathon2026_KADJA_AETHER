"""
Keeps only zones successfully matched to a real Iloilo Province LGU by
geocode_municipalities.py, dropping zones in neighboring provinces
(Negros Occidental, Capiz, Guimaras, Antique) that got included once
the bounding box was widened to Iloilo's true extent.
"""

from pathlib import Path
import pandas as pd

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "feature_table.csv"

df = pd.read_csv(CSV_PATH)
before = len(df)

df_iloilo = df[df["municipality"].notna()].copy()

df_iloilo.to_csv(CSV_PATH, index=False)
print(f"Kept {len(df_iloilo)} of {before} zones (dropped {before - len(df_iloilo)} outside Iloilo Province).")
print("\nZones per municipality:")
print(df_iloilo["municipality"].value_counts().to_string())