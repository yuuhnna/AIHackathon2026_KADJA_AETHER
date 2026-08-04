"""
AETHER
Build Current Features

Generates the latest feature table used by the deployed Random Forest
model for inference.

Pipeline

Official Iloilo Province Boundary
            ↓
Global Mangrove Watch
(Current Mangrove Patches)
            ↓
Sentinel-2
SRTM
ERA5
OpenStreetMap
            ↓
Feature Engineering
            ↓
current_feature_table.csv

This script generates inference data only.

It DOES NOT:
- generate labels
- train models
- evaluate models
"""

from pathlib import Path

import ee
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID = "rising-capsule-503003-c4"

OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "processed"
    / "current_feature_table.csv"
)

# End date = today (UTC)
END_DATE = datetime.utcnow().date()

# Use the previous 365 days
START_DATE = END_DATE - timedelta(days=365)

# Convert to ISO format for Earth Engine
START_DATE = START_DATE.isoformat()
END_DATE = END_DATE.isoformat()


# Global Mangrove Watch
GMW_ASSET = "projects/mangrovedatahub2/assets/CGMD-Extent30"

# Latest available GMW release year
GMW_YEAR = 2022

# Sentinel-2
S2_CLOUD_THRESHOLD = 40

COUNTRY = "Philippines"
REGION = "Region VI (Western Visayas)"
PROVINCE = "Iloilo"


# ============================================================================
# INITIALIZATION
# ============================================================================

def initialize():
    """
    Initialize Google Earth Engine.
    """

    ee.Initialize(project=PROJECT_ID)

    print("\nAnalysis Period")
    print("----------------------------")
    print(f"Start : {START_DATE}")
    print(f"End   : {END_DATE}")

    print("✓ Google Earth Engine initialized.")


# ============================================================================
# DATA LOADING
# ============================================================================

def get_iloilo_province():
    """
    Load the official Iloilo Province boundary
    from FAO GAUL Level 2.
    """

    province_fc = (
        ee.FeatureCollection("FAO/GAUL/2015/level2")
        .filter(ee.Filter.eq("ADM0_NAME", COUNTRY))
        .filter(ee.Filter.eq("ADM1_NAME", REGION))
        .filter(ee.Filter.eq("ADM2_NAME", PROVINCE))
    )

    count = province_fc.size().getInfo()

    if count != 1:
        raise RuntimeError(
            f"Expected one Iloilo Province feature but found {count}."
        )

    print("✓ Official Iloilo Province boundary loaded.")

    return province_fc.geometry()



def get_latest_cgmd_year():

    years = (
        ee.FeatureCollection(GMW_ASSET)
        .aggregate_array("year")
        .distinct()
        .sort()
        .getInfo()
    )

    latest = max(years)

    print(f"✓ Latest CGMD year: {latest}")

    return latest


def get_latest_gmw_year():

    years = (
        ee.FeatureCollection(GMW_ASSET)
        .aggregate_array("year")
        .distinct()
        .sort()
        .getInfo()
    )

    latest = max(years)

    print(f"✓ Latest GMW year: {latest}")

    return latest


def load_current_mangrove_polygons(province):

    latest_year = get_latest_cgmd_year()

    polygons = (
        ee.FeatureCollection(GMW_ASSET)
        .filter(ee.Filter.eq("year", latest_year))
        .filterBounds(province)
    )

    count = polygons.size().getInfo()

    print(f"✓ Loaded {count} mangrove polygons")

    return polygons


# ============================================================================
# SENTINEL-2
# ============================================================================

def mask_s2_clouds(image):
    """
    Removes clouds, cirrus, and cloud shadows using the Scene Classification Layer.
    """

    scl = image.select("SCL")

    mask = (
        scl.neq(3)      # Cloud shadow
        .And(scl.neq(8))   # Medium cloud
        .And(scl.neq(9))   # High cloud
        .And(scl.neq(10))  # Cirrus
    )

    return image.updateMask(mask)


def build_sentinel_composite(province):
    """
    Creates a cloud-masked Sentinel-2 median composite.
    """

    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(province)
        .filterDate(START_DATE, END_DATE)
        .filter(
            ee.Filter.lt(
                "CLOUDY_PIXEL_PERCENTAGE",
                S2_CLOUD_THRESHOLD
            )
        )
        .map(mask_s2_clouds)
    )

    print("Images:", collection.size().getInfo())

    composite = collection.median()

    print("✓ Sentinel-2 composite created.")

    return composite


def add_vegetation_indices(image):
    """
    Adds NDVI and Mangrove Vegetation Index.
    """

    ndvi = image.normalizedDifference(
        ["B8", "B4"]
    ).rename("NDVI")

    mvi = image.expression(
        "(NIR - GREEN) / (SWIR1 - GREEN)",
        {
            "NIR": image.select("B8"),
            "GREEN": image.select("B3"),
            "SWIR1": image.select("B11"),
        },
    ).rename("MVI")

    return image.addBands([ndvi, mvi])


def compute_vegetation_features(polygons, province):
    """
    Computes mean NDVI and mean MVI
    for every mangrove polygon.

    Returns
    -------
    pandas.DataFrame
    """

    image = build_sentinel_composite(province)

    image = add_vegetation_indices(image)

    stats = image.select(
        ["NDVI", "MVI"]
    ).reduceRegions(

        collection=polygons,

        reducer=ee.Reducer.mean(),

        scale=10
    )

    rows = stats.getInfo()["features"]

    print(rows[0]["properties"])

    data = []

    for i, feature in enumerate(rows):

        props = feature["properties"]

        data.append(
            {
                "zone_id": f"ZONE_{i+1:04d}",
                "mean_ndvi": props.get("NDVI"),
                "mean_mvi": props.get("MVI"),
            }
        )

    vegetation_df = pd.DataFrame(data)

    print(
        f"✓ Vegetation features computed "
        f"({len(vegetation_df)} polygons)"
    )

    return vegetation_df



def build_era5_collection(province):
    """
    Loads the latest ERA5-Land Monthly Aggregate climate data
    covering the analysis period.
    """

    collection = (
        ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY_AGGR")
        .filterBounds(province)
        .filterDate(START_DATE, END_DATE)
    )

    print(f"✓ ERA5 images: {collection.size().getInfo()}")

    return collection


def build_climate_image(province):
    """
    Builds a single annual climate image from ERA5-Land Monthly.

    Outputs:
        mean_temperature (°C)
        annual_precipitation (mm)
        mean_wind_speed (m/s)
    """

    era5 = build_era5_collection(province)

    # ------------------------------------------------------------------
    # Temperature
    # ------------------------------------------------------------------

    temperature = (
        era5
        .select("temperature_2m")
        .mean()
        .subtract(273.15)
        .rename("mean_temperature")
    )

    # ------------------------------------------------------------------
    # Precipitation
    # ------------------------------------------------------------------

    precipitation = (
        era5
        .select("total_precipitation_sum")
        .sum()
        .multiply(1000)
        .rename("annual_precipitation")
    )

    # ------------------------------------------------------------------
    # Wind Speed
    # ------------------------------------------------------------------

    wind = (
        era5
        .map(
            lambda img: img.expression(
                "sqrt(u*u + v*v)",
                {
                    "u": img.select("u_component_of_wind_10m"),
                    "v": img.select("v_component_of_wind_10m"),
                },
            )
            .rename("wind")
        )
        .mean()
        .rename("mean_wind_speed")
    )

    climate = temperature.addBands(
        [
            precipitation,
            wind,
        ]
    )

    print("✓ Annual climate image created.")

    return climate


# ============================================================================
# MAIN
# ============================================================================

def main():

    print("\n====================================")
    print("AETHER Current Feature Builder")
    print("====================================\n")

    initialize()

    province = get_iloilo_province()

    polygons = load_current_mangrove_polygons(province)

    print("\nDataset Summary")
    print("----------------------------")
    print(f"GMW Year : {GMW_YEAR}")
    print(f"Patches  : {polygons.size().getInfo():,}")
    
    print("\n✓ Foundation loaded successfully.")
    print("Ready for feature extraction.")

    vegetation_df = compute_vegetation_features(
        polygons,
        province
    )


    print(vegetation_df.head())

    era5 = build_era5_collection(province)
    print(
        era5.first().bandNames().getInfo()
    )

if __name__ == "__main__":
    main()