"""
Reverse-geocodes each zone's real lat/lon (from gee_build_feature_table.py)
into its actual Iloilo Province municipality/city, using OpenStreetMap's
free Nominatim API. Replaces the random np.random.choice() municipality
assignment in patch_feature_table.py, which was disconnected from real
coordinates.

Rate-limited to 1 request/second per Nominatim's usage policy — expect
this to take roughly (num_zones / 60) minutes to run.

Run with:
    cd backend
    python scripts/geocode_municipalities.py
"""

import time
from pathlib import Path

import pandas as pd
import requests

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "feature_table.csv"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "AETHER-mangrove-monitoring/1.0 (hackathon project)"

# Known Iloilo Province LGUs, for cleaning up whatever Nominatim returns
# (e.g. mapping "Municipality of Banate" -> "Banate").
ILOILO_LGUS = [
    "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate",
    "Barotac Nuevo", "Barotac Viejo", "Batad", "Bingawan", "Cabatuan",
    "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas",
    "Estancia", "Guimbal", "Igbaras", "Janiuay", "Lambunao", "Leganes",
    "Lemery", "Leon", "Maasin", "Miagao", "Mina", "New Lucena",
    "Oton", "Pavia", "Pototan", "San Dionisio", "San Enrique",
    "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara",
    "Sara", "Tigbauan", "Tubungan", "Zarraga", "Iloilo City", "Passi City",
]


def normalize_municipality(raw_name, state):
    """
    Match Nominatim's raw name against our known LGU list — but only if
    the state/province is actually Iloilo. Several town names (e.g. "San
    Enrique", "San Rafael", "Concepcion") exist in multiple Philippine
    provinces, so matching on name alone can silently mislabel a zone in
    Negros Occidental (or elsewhere) as belonging to Iloilo.
    """
    if not raw_name:
        return None
    if state and state.strip().lower() != "iloilo":
        return None

    cleaned = raw_name.replace("Municipality of ", "").replace("City of ", "").strip()
    for lgu in ILOILO_LGUS:
        if lgu.lower() == cleaned.lower():
            return lgu
    for lgu in ILOILO_LGUS:
        if lgu.lower() in cleaned.lower() or cleaned.lower() in lgu.lower():
            return lgu
    return None


def reverse_geocode(lat, lon):
    params = {
        "lat": lat,
        "lon": lon,
        "format": "jsonv2",
        "zoom": 10,
        "addressdetails": 1,
    }
    headers = {"User-Agent": USER_AGENT}
    try:
        resp = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        address = data.get("address", {})
        candidate = (
            address.get("municipality")
            or address.get("city")
            or address.get("town")
            or address.get("county")
        )
        state = address.get("state")
        return normalize_municipality(candidate, state)
    except Exception as e:
        print(f"  WARNING: geocode failed for ({lat}, {lon}): {e}")
        return None


def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"{CSV_PATH} not found.")

    df = pd.read_csv(CSV_PATH)
    n = len(df)
    municipalities = []

    print(f"Reverse-geocoding {n} zones (1 request/sec, ~{n / 60:.1f} min)...")
    for i, row in df.iterrows():
        muni = reverse_geocode(row["lat"], row["lon"])
        municipalities.append(muni)
        if (i + 1) % 50 == 0:
            print(f"  {i + 1}/{n} done...")
        time.sleep(1.0)

    df["municipality"] = municipalities

    unresolved = df["municipality"].isna().sum()
    print(f"\nDone. {n - unresolved}/{n} zones matched to a known Iloilo LGU.")
    if unresolved > 0:
        print(f"  {unresolved} zones could not be matched (likely offshore/water pixels, or outside Iloilo — e.g. Negros).")

    df.to_csv(CSV_PATH, index=False)
    print(f"Updated {CSV_PATH} with real municipality assignments.")


if __name__ == "__main__":
    main()