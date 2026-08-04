"""
Replaces the placeholder lat/lon scatter with coordinates clustered around
REAL, documented mangrove-relevant sites in Iloilo Province.

Sources (verified via web search, not guessed):
- Katunggan Ecopark, Barangay Gua-an/Nabitasan, Leganes — a real mangrove
  rehabilitation site (10.75006, 122.56984). Source: BMB.gov.ph, WorldPlaces.
- Iloilo City coastal greenbelt barangays (Bito-on, Balabago — Jaro
  District; Hinactacan — La Paz District) — ~110 ha of mangrove forest
  protected under the city's 2026 Coastal Greenbelt Zone ordinance.
  Anchor: Iloilo City center (10.7202, 122.5621), adjusted toward the
  coast.
- Barotac Nuevo (10.89717, 122.69620) — coastal municipality. Source:
  Wikipedia (via Don Jose S. Monfort Medical Center geo-reference).
- Barotac Viejo (11.05, 122.85) — coastal municipality with a documented
  mangrove planting site (Barangay San Fernando). Source: Wikipedia,
  PhilAtlas.
- Concepcion (11.2, 123.1) — coastal municipality, 25 barangays, known for
  the Concepcion Islands and active coastal-erosion concerns (e.g.
  Barangay Pedada, Ajuy, just north). Source: Wikipedia.

IMPORTANT — read this before trusting the map placement:
These are REAL, named locations, but they are anchor points (a mangrove
park's coordinates, or a municipality's center), not surveyed zone-level
boundaries. Real per-zone geometry requires the actual Global Mangrove
Watch (GMW) polygon data pulled via the GEE pipeline (see
backend/scripts/README_GEE.md). This script is an honest middle ground:
better than a random scatter across the province, but still a stand-in
for the real AOI.

Run with:
    python scripts/anchor_real_coordinates.py
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(7)

FEATURE_TABLE_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "feature_table.csv"

# Real, documented mangrove-relevant sites in Iloilo Province.
ANCHORS = [
    {"name": "Leganes (Katunggan Ecopark)", "lat": 10.75006, "lon": 122.56984, "jitter_deg": 0.02},
    {"name": "Iloilo City coastal greenbelt (Jaro/La Paz)", "lat": 10.7302, "lon": 122.5791, "jitter_deg": 0.015},
    {"name": "Barotac Nuevo", "lat": 10.89717, "lon": 122.69620, "jitter_deg": 0.025},
    {"name": "Barotac Viejo", "lat": 11.05, "lon": 122.85, "jitter_deg": 0.03},
    {"name": "Concepcion", "lat": 11.2, "lon": 123.1, "jitter_deg": 0.03},
]


def assign_real_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    n = len(df)

    anchor_idx = RNG.integers(0, len(ANCHORS), size=n)
    lats, lons, anchor_names = [], [], []

    for i in anchor_idx:
        anchor = ANCHORS[i]
        lat = anchor["lat"] + RNG.normal(0, anchor["jitter_deg"])
        lon = anchor["lon"] + RNG.normal(0, anchor["jitter_deg"])
        lats.append(round(lat, 5))
        lons.append(round(lon, 5))
        anchor_names.append(anchor["name"])

    df["lat"] = lats
    df["lon"] = lons
    df["anchor_site"] = anchor_names  # kept for transparency, not used by the model
    return df


if __name__ == "__main__":
    if not FEATURE_TABLE_PATH.exists():
        raise FileNotFoundError(f"{FEATURE_TABLE_PATH} not found.")

    df = pd.read_csv(FEATURE_TABLE_PATH)
    df = assign_real_coordinates(df)
    df.to_csv(FEATURE_TABLE_PATH, index=False)

    print(f"Updated {len(df)} zones with coordinates anchored to real Iloilo mangrove sites.")
    print(df["anchor_site"].value_counts().to_string())