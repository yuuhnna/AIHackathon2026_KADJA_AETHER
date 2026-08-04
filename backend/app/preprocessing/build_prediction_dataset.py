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
import fiona
import pyogrio
import geopandas as gpd
import json


# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID = "rising-capsule-503003-c4"


GADM_MUNICIPALITY_LAYER = "ADM_ADM_2" 

DATA_DIR = Path(r"C:\Users\admin\AIHackathon2026_KADJA_AETHER\backend\data\raw\processed")

OUTPUT_PATH = DATA_DIR / "current_feature_table.csv"
GADM_PATH = DATA_DIR / "gadm41_PHL.gpkg"

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


def compute_zone_locations(polygons):
    """
    Computes centroid latitude/longitude for every mangrove polygon.
    """

    def add_centroid(feature):
        centroid = feature.geometry().centroid(1)
        coords = centroid.coordinates()
        return feature.set({
            "lon": coords.get(0),
            "lat": coords.get(1),
        })

    located = polygons.map(add_centroid)

    rows = located.select(["zone_id", "lat", "lon"]).getInfo()["features"]

    data = []
    for row in rows:
        props = row["properties"]
        data.append({
            "zone_id": props.get("zone_id"),
            "lat": props.get("lat"),
            "lon": props.get("lon"),
        })

    location_df = pd.DataFrame(data)

    print(f"✓ Zone locations computed ({len(location_df)} polygons)")

    return location_df


def compute_municipality_features(location_df):
    municipalities = (
        gpd.read_file(GADM_PATH, layer=GADM_MUNICIPALITY_LAYER)
        .to_crs("EPSG:4326")[["NAME_2", "geometry"]]
    )

    zones_gdf = gpd.GeoDataFrame(
        location_df.copy(),
        geometry=gpd.points_from_xy(location_df["lon"], location_df["lat"]),
        crs="EPSG:4326",
    )

    joined = gpd.sjoin(zones_gdf, municipalities, how="left", predicate="within")

    unmatched_mask = joined["NAME_2"].isna()
    if unmatched_mask.any():
        nearest = gpd.sjoin_nearest(
            zones_gdf[unmatched_mask],
            municipalities,
            how="left",
        )
        joined.loc[unmatched_mask, "NAME_2"] = nearest["NAME_2"].values

    municipality_df = joined[["zone_id", "NAME_2"]].rename(
        columns={"NAME_2": "municipality"}
    )

    still_missing = municipality_df["municipality"].isna().sum()
    if still_missing:
        print(f"⚠ {still_missing} zones still unmatched after nearest-neighbor fallback")

    print(f"✓ Municipality lookup computed ({len(municipality_df)} polygons)")

    return municipality_df

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
            "elevation": "mean_elevation",
            "slope": "mean_slope",
        },
    )

    print(f"✓ Terrain features computed ({len(terrain_df)} polygons)")

    return terrain_df


def compute_distance_features(polygons, province):
    """
    PLACEHOLDER — distance-to-feature values are not yet computed from OSM.
    Returns the correct shape/columns so the pipeline runs end-to-end;
    replace with real distance calculations before this feeds the model.

    Features
    --------
    dist_aquaculture_m
    dist_river_m
    dist_road_m   -- TODO: confirm this is the third distance you want;
                     using nearest road as a placeholder guess
    """

    zone_ids = polygons.aggregate_array("zone_id").getInfo()

    distance_df = pd.DataFrame({
        "zone_id": zone_ids,
        "nearest_distance_to_aquaculture_m": -1,
        "nearest_distance_to_roads_m": -1,
    })

    print(f"⚠ Distance features are placeholders ({len(distance_df)} polygons)")

    return distance_df


def merge_feature_tables(vegetation_df, climate_df, terrain_df, distance_df, location_df, municipality_df, geo_df):
    feature_table = vegetation_df.merge(climate_df, on="zone_id", how="left")
    feature_table = feature_table.merge(terrain_df, on="zone_id", how="left")
    feature_table = feature_table.merge(distance_df, on="zone_id", how="left")
    feature_table = feature_table.merge(location_df, on="zone_id", how="left")
    feature_table = feature_table.merge(municipality_df, on="zone_id", how="left")
    feature_table = feature_table.merge(geo_df, on="zone_id", how="left")


    print(
        f"✓ Feature tables merged "
        f"({len(feature_table)} zones, {feature_table.shape[1]} columns)"
    )

    return feature_table


def export_feature_table(feature_table):
    """
    Writes the merged feature table to OUTPUT_PATH, creating the
    destination folder if it doesn't exist yet.
    """

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    feature_table.to_csv(OUTPUT_PATH, index=False)

    print(f"✓ Feature table exported to {OUTPUT_PATH}")


def compute_geometry_column(polygons):
    """
    Attaches each zone's full polygon boundary as a GeoJSON string in a
    ".geo" column -- the same convention Earth Engine uses when
    exporting FeatureCollections straight to CSV. Keeps geometry
    traveling with the rest of the metadata in one file.
    """

    rows = polygons.select(["zone_id"]).getInfo()["features"]

    data = []
    for feature in rows:
        data.append({
            "zone_id": feature["properties"].get("zone_id"),
            ".geo": json.dumps(feature["geometry"]),
        })

    geo_df = pd.DataFrame(data)

    print(f"✓ Geometry column computed ({len(geo_df)} polygons)")

    return geo_df
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

    vegetation_df = compute_vegetation_features(polygons, province)
    print(vegetation_df.head())

    era5 = build_era5_collection(province)

    climate_df = compute_climate_features(polygons, province)
    print(climate_df.head())

    terrain_df = compute_terrain_features(polygons, province)
    print(terrain_df.head())

    distance_df = compute_distance_features(polygons, province)
    print(distance_df.head())

    location_df = compute_zone_locations(polygons)
    print(location_df.head())

    municipality_df = compute_municipality_features(location_df)
    print(municipality_df.head())

    geo_df = compute_geometry_column(polygons)
    print(geo_df.head())

    feature_table = merge_feature_tables(
        vegetation_df,
        climate_df,
        terrain_df,
        distance_df,
        location_df,
        municipality_df,
        geo_df
    )

    print(len(feature_table))                             # should be 398
    print(feature_table["zone_id"].duplicated().sum())     # should be 0
    print(feature_table["municipality"].isna().sum())      # should be 0

    export_feature_table(feature_table)

    print(feature_table.head())


    for layer_name, _ in pyogrio.list_layers(GADM_PATH):
        gdf = gpd.read_file(GADM_PATH, layer=layer_name)
        name_cols = [c for c in gdf.columns if c.startswith("NAME_")]
        for col in name_cols:
            if "Ajuy" in gdf[col].values:
                print(f"Found 'Ajuy' in layer={layer_name}, column={col}")




if __name__ == "__main__":
    main()