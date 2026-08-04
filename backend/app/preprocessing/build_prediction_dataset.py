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

    polygons = polygons.map(
        lambda f: f.set(
            "zone_id",
            ee.String("ZONE_").cat(f.id())
        )
    )

    print(f"✓ Loaded {polygons.size().getInfo()} mangrove polygons")

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


# ============================================================================
# VEGETATION FEATURES
# ============================================================================

def compute_vegetation_features(polygons, province):
    """
    Computes vegetation features for every mangrove polygon.

    Features
    --------
    mean_ndvi
    mean_mvi
    """

    image = build_sentinel_composite(province)

    image = add_vegetation_indices(image)

    vegetation_df = sample_image_at_centroid(

        image=image.select(["NDVI", "MVI"]),

        polygons=polygons,

        band_mapping={

            "NDVI": "mean_ndvi",

            "MVI": "mean_mvi",

        }

    )

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
    era5 = build_era5_collection(province)

    temperature = (
        era5.select("temperature_2m").mean().subtract(273.15).rename("mean_temperature")
    )
    precipitation = (
        era5.select("total_precipitation_sum").sum().multiply(1000).rename("annual_precipitation")
    )
    wind = (
        era5.map(lambda img: img.expression(
            "sqrt(u*u + v*v)",
            {"u": img.select("u_component_of_wind_10m"), "v": img.select("v_component_of_wind_10m")},
        ).rename("wind"))
        .mean()
        .rename("mean_wind_speed")
    )

    climate = temperature.addBands([precipitation, wind])
    band_names = climate.bandNames()

    # ERA5-Land masks ocean cells, and most mangrove zones sit on the coast.
    # focal_mean() alone does NOT fill this -- its default skipMasked=True
    # keeps the output masked wherever the input was masked. Use
    # reduceNeighborhood directly with skipMasked=False, iterating a few
    # times to reach far enough inland. Rename back since reduceNeighborhood
    # appends "_mean" to every band name.
    kernel = ee.Kernel.square(radius=2, units="pixels")

    for _ in range(6):
        climate = climate.reduceNeighborhood(
            reducer=ee.Reducer.mean(),
            kernel=kernel,
            skipMasked=False,
        ).rename(band_names)

    print("✓ Annual climate image created (gap-filled).")
    return climate


def compute_climate_features(polygons, province):
    climate = build_climate_image(province)

    climate_df = sample_image_at_centroid(
        image=climate,
        polygons=polygons,
        band_mapping={
            "mean_temperature": "mean_temperature",
            "annual_precipitation": "annual_precipitation",
            "mean_wind_speed": "mean_wind_speed",
        },
    )

    print(f"✓ Climate features computed ({len(climate_df)} polygons)")
    return climate_df


# ============================================================================
# GENERIC IMAGE SAMPLER
# ============================================================================
def sample_image_at_centroid(image, polygons, band_mapping):

    def sample(feature):

        centroid = feature.geometry().centroid(1)

        pixel = image.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=centroid.buffer(6000),
            scale=1000,
            maxPixels=1e9
        )

        values = ee.Dictionary(
            ee.Algorithms.If(
                pixel,
                pixel,
                ee.Dictionary({})
            )
        )

        values = values.set(
            "zone_id",
            feature.get("zone_id")
        )

        return ee.Feature(None, values)

    sampled = polygons.map(sample)

    rows = sampled.getInfo()["features"]

    data = []

    for row in rows:

        props = row["properties"]

        record = {
            "zone_id": props.get("zone_id")
        }

        for ee_band, column_name in band_mapping.items():
            record[column_name] = props.get(ee_band)

        data.append(record)

    return pd.DataFrame(data)


def build_srtm_image(province):
    """
    Loads SRTM 30m elevation and derives slope.

    Outputs:
        elevation (m)
        slope (degrees)
    """

    dem = ee.Image("USGS/SRTMGL1_003")

    elevation = dem.rename("elevation")
    slope = ee.Terrain.slope(dem).rename("slope")

    srtm = elevation.addBands(slope)

    print("✓ SRTM elevation/slope image created.")

    return srtm


def compute_terrain_features(polygons, province):
    """
    Computes elevation and slope for every mangrove polygon.

    Features
    --------
    elevation_m
    slope_deg
    """

    srtm = build_srtm_image(province)

    terrain_df = sample_image_at_centroid(
        image=srtm,
        polygons=polygons,
        band_mapping={
            "elevation": "elevation_m",
            "slope": "slope_deg",
        },
    )

    print(f"✓ Terrain features computed ({len(terrain_df)} polygons)")

    return terrain_df

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

    climate_df = compute_climate_features(
        polygons,
        province
    )

    print(climate_df.head())

    terrain_df = compute_terrain_features(
        polygons,
        province
    )

    print(terrain_df.head())

if __name__ == "__main__":
    main()