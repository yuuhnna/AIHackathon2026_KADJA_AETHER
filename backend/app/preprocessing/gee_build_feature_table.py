"""
Builds a real, GEE-derived feature_table.csv for Iloilo Province mangrove
zones — Sentinel-2 (NDVI/MVI), SRTM (elevation/slope), and Continuous
Global Mangrove Dynamics (CGMD) for extent/loss label.

Output column names match exactly what aether_rf_model.joblib was
trained on (see feature_table4.csv) — mean_ndvi, mean_mvi,
mean_temperature, annual_precipitation, mean_wind_speed, mean_elevation,
mean_slope, nearest_aquaculture_distance_m, nearest_river_distance_m,
plus a `year` column. dist_road_m has been dropped entirely — it was
never part of the model's trained feature set.

Uses Earth Engine's batch Export (not interactive getInfo()) for every
zone-level computation, since reduceRegions() over ~2000+ zones against
a full-year Sentinel-2 composite reliably exceeded Earth Engine's
interactive memory limit. Each export writes a CSV to Google Drive,
downloaded automatically via the Drive API (reusing the same
credentials created by `earthengine authenticate`).

See README_GEE.md for setup instructions (auth, project ID) before running.

Run with:
    cd backend
    python scripts/gee_build_feature_table.py

Output:
    backend/data/processed/feature_table.csv
"""

import io
import time
from pathlib import Path

import ee
import numpy as np
import pandas as pd
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# ---------------------------------------------------------------------------
# CONFIG — edit these before running
# ---------------------------------------------------------------------------

GEE_PROJECT_ID = "rising-capsule-503003-c4"

ILOILO_BBOX = [121.95, 10.30, 123.55, 11.85]  # [west, south, east, north]
GRID_CELL_SIZE_M = 300

S2_START_DATE = "2024-01-01"
S2_END_DATE = "2024-12-31"
S2_CLOUD_PROB_THRESHOLD = 40

CGMD_ASSET_ID = "projects/mangrovedatahub2/assets/CGMD-Extent30"


OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "feature_table.csv"
DRIVE_POLL_INTERVAL_SEC = 15

# Column names match aether_rf_model.joblib's trained schema exactly —
# do not rename without retraining the model.
FEATURE_COLUMNS = [
    "mean_ndvi",
    "mean_mvi",
    "mean_temperature",
    "annual_precipitation",
    "mean_wind_speed",
    "mean_elevation",
    "mean_slope",
    "nearest_aquaculture_distance_m",
    "nearest_river_distance_m",
]

# Climate is still a placeholder (needs a separate ERA5/CDS call — see
# README_GEE.md #5). Proximity to aquaculture/river also remain
# placeholders (needs OSM/osmnx). dist_road_m has been dropped
# entirely since the model was never trained with it.
CLIMATE_PLACEHOLDER = {"mean_temperature": 27.2, "annual_precipitation": 2050.0, "mean_wind_speed": 3.4}
PROXIMITY_PLACEHOLDER = {"nearest_aquaculture_distance_m": None, "nearest_river_distance_m": None}


def init_ee():
    ee.Initialize(project=GEE_PROJECT_ID)


def get_drive_service():
    creds = ee.data.get_persistent_credentials()
    return build("drive", "v3", credentials=creds)


def run_export_and_download(feature_collection: ee.FeatureCollection, name: str) -> pd.DataFrame:
    """
    Submits a table Export to Drive, waits for completion, downloads the
    resulting CSV via the Drive API, and returns it as a DataFrame. Any
    previous file with the same name is deleted first (Drive doesn't
    overwrite by default, and re-running would otherwise produce
    duplicate files with the same name).
    """
    drive_service = get_drive_service()

    existing = drive_service.files().list(
        q=f"name='{name}.csv'", fields="files(id)"
    ).execute().get("files", [])
    for f in existing:
        drive_service.files().delete(fileId=f["id"]).execute()

    task = ee.batch.Export.table.toDrive(
        collection=feature_collection,
        description=name,
        fileNamePrefix=name,
        fileFormat="CSV",
    )
    task.start()
    print(f"  Export '{name}' started ({task.id}), waiting for completion...")

    while task.active():
        time.sleep(DRIVE_POLL_INTERVAL_SEC)

    status = task.status()
    if status["state"] != "COMPLETED":
        raise RuntimeError(f"Export '{name}' failed: {status}")

    result = drive_service.files().list(
        q=f"name='{name}.csv'", fields="files(id, name)"
    ).execute()
    files = result.get("files", [])
    if not files:
        raise RuntimeError(f"Export '{name}' completed but no matching file found in Drive.")

    file_id = files[0]["id"]
    request = drive_service.files().get_media(fileId=file_id)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    buffer.seek(0)
    df = pd.read_csv(buffer)
    print(f"  Downloaded '{name}.csv' — {len(df)} rows.")
    return df


def cgmd_year_geometry(year: int, bbox: ee.Geometry) -> ee.FeatureCollection:
    return (
        ee.FeatureCollection(CGMD_ASSET_ID)
        .filter(ee.Filter.eq("year", year))
        .filterBounds(bbox)
    )


def build_zone_grid(aoi: ee.Geometry, cell_size_m: int) -> ee.FeatureCollection:
    cgmd_mask = cgmd_year_geometry(CGMD_TARGET_YEAR, aoi)
    grid = aoi.coveringGrid(aoi.projection().atScale(cell_size_m), cell_size_m)
    grid = grid.filterBounds(cgmd_mask)

    def tag_zone_id(feature):
        return feature.set("zone_id", ee.String("ILO-").cat(feature.get("system:index")))

    return grid.map(tag_zone_id)


def mask_s2_clouds(image):
    scl = image.select("SCL")
    mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
    return image.updateMask(mask)


def s2_composite(aoi: ee.Geometry):
    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(S2_START_DATE, S2_END_DATE)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", S2_CLOUD_PROB_THRESHOLD))
        .map(mask_s2_clouds)
    )
    composite = collection.median()
    ndvi = composite.normalizedDifference(["B8", "B4"]).rename("NDVI")
    mvi = composite.expression(
        "(GREEN - SWIR1) / (GREEN + SWIR1)",
        {"GREEN": composite.select("B3"), "SWIR1": composite.select("B11")},
    ).rename("MVI")
    return composite.addBands([ndvi, mvi])


def compute_vegetation(zones: ee.FeatureCollection, aoi: ee.Geometry) -> pd.DataFrame:
    composite = s2_composite(aoi)
    stats = composite.select(["NDVI", "MVI"]).reduceRegions(
        collection=zones, reducer=ee.Reducer.mean(), scale=10
    )
    raw = run_export_and_download(stats, "aether_vegetation")
    return raw.rename(columns={"NDVI": "mean_ndvi", "MVI": "mean_mvi"})[
        ["zone_id", "mean_ndvi", "mean_mvi", ".geo"]
    ].rename(columns={".geo": "geo"})


def compute_terrain(zones: ee.FeatureCollection) -> pd.DataFrame:
    dem = ee.Image("USGS/SRTMGL1_003").rename("elevation")
    slope = ee.Terrain.slope(dem).rename("slope")
    combined = dem.addBands(slope)

    stats = combined.reduceRegions(collection=zones, reducer=ee.Reducer.mean(), scale=30)
    raw = run_export_and_download(stats, "aether_terrain")
    return raw.rename(columns={"elevation": "mean_elevation", "slope": "mean_slope"})[
        ["zone_id", "mean_elevation", "mean_slope"]
    ]


def compute_labels(zones: ee.FeatureCollection, bbox: ee.Geometry) -> pd.DataFrame:
    baseline_fc = cgmd_year_geometry(CGMD_BASELINE_YEAR, bbox)
    target_fc = cgmd_year_geometry(CGMD_TARGET_YEAR, bbox)

    baseline_img = ee.Image(0).paint(baseline_fc, 1).rename("baseline")
    target_img = ee.Image(0).paint(target_fc, 1).rename("target")
    combined = baseline_img.addBands(target_img)

    stats = combined.reduceRegions(collection=zones, reducer=ee.Reducer.sum(), scale=25)
    raw = run_export_and_download(stats, "aether_labels")

    raw["next_year_change_pct"] = raw.apply(
        lambda r: (r["baseline"] - r["target"]) / r["baseline"] if r["baseline"] > 0 else None,
        axis=1,
    )
    return raw[["zone_id", "next_year_change_pct"]]


def extract_lat_lon(geo_json_str: str):
    """Parses the .geo column (a GeoJSON string) exported by Earth Engine
    to get a representative lat/lon (first ring's first coordinate)."""
    import json

    try:
        geom = json.loads(geo_json_str)
        coord = geom["coordinates"][0][0]
        return coord[1], coord[0]  # lat, lon
    except Exception:
        return None, None


def main():
    init_ee()

    print("Fetching AOI (Iloilo bbox)...")
    aoi = ee.Geometry.Rectangle(ILOILO_BBOX)
    bbox = aoi

    print(f"Building zone grid ({GRID_CELL_SIZE_M}m cells)...")

    zones = (
        ee.FeatureCollection(CGMD_ASSET_ID)
            .filter(ee.Filter.eq("year", CGMD_TARGET_YEAR))
            .filterBounds(aoi)
    )

    print("Computing vegetation features (Sentinel-2) via Export...")
    veg_df = compute_vegetation(zones, aoi)
    veg_df["lat"], veg_df["lon"] = zip(*veg_df["geo"].map(extract_lat_lon))
    veg_df = veg_df.drop(columns=["geo"])

    print("Computing terrain features (SRTM) via Export...")
    terrain_df = compute_terrain(zones)

    print(f"Computing training labels (CGMD extent change, {CGMD_BASELINE_YEAR}->{CGMD_TARGET_YEAR}) via Export...")
    try:
        labels_df = compute_labels(zones, bbox)
    except Exception as e:
        print(f"  WARNING: CGMD label computation failed ({e}).")
        labels_df = pd.DataFrame({"zone_id": veg_df["zone_id"], "next_year_change_pct": np.nan})

    df = veg_df.merge(terrain_df, on="zone_id", how="left")
    df = df.merge(labels_df, on="zone_id", how="left")

    for col, val in CLIMATE_PLACEHOLDER.items():
        df[col] = val
    for col, val in PROXIMITY_PLACEHOLDER.items():
        df[col] = val

    # `year` marks which CGMD target year these features/label correspond
    # to — present in the model's trained schema (feature_table4.csv).
    df["year"] = CGMD_TARGET_YEAR

    df["confidence_flag"] = np.where(df["mean_elevation"] < 2.0, "low_confidence_elevation", "ok")
    df.loc[df["nearest_aquaculture_distance_m"].isna(), "confidence_flag"] = "low_confidence_proximity_placeholder"

    df = df[
        ["zone_id", "lat", "lon", "year"]
        + FEATURE_COLUMNS
        + ["next_year_change_pct", "confidence_flag"]
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nWrote {len(df)} real zones to {OUTPUT_PATH}")
    print(df.isna().sum().to_string())


if __name__ == "__main__":
    main()