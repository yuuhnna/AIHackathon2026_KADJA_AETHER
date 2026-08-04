"""
One-off test: export Sentinel-2 NDVI/MVI zone stats via Earth Engine's
batch Export instead of the interactive getInfo() path, which proved
unreliable at ~2000 zones due to the cost of re-evaluating the full
Sentinel-2 composite on every call.

Run with:
    python scripts/test_export.py

Then check your Google Drive for a file named "aether_ndvi_mvi_test.csv"
once the task finishes (this can take a few minutes — Earth Engine runs
it server-side, not locally).
"""

import ee
import time

ee.Initialize(project="rising-capsule-503003-c4")

ILOILO_BBOX = [122.20, 10.40, 123.20, 11.30]
aoi = ee.Geometry.Rectangle(ILOILO_BBOX)

cgmd_mask = (
    ee.FeatureCollection("projects/mangrovedatahub2/assets/CGMD-Extent30")
    .filter(ee.Filter.eq("year", 2022))
    .filterBounds(aoi)
)

grid = aoi.coveringGrid(aoi.projection().atScale(300), 300)
grid = grid.filterBounds(cgmd_mask)


def tag_zone_id(feature):
    return feature.set("zone_id", ee.String("ILO-").cat(feature.get("system:index")))


zones = grid.map(tag_zone_id)


def mask_s2_clouds(image):
    scl = image.select("SCL")
    mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
    return image.updateMask(mask)


collection = (
    ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(aoi)
    .filterDate("2024-01-01", "2024-12-31")
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
    .map(mask_s2_clouds)
)
composite = collection.median()
ndvi = composite.normalizedDifference(["B8", "B4"]).rename("NDVI")
mvi = composite.expression(
    "(GREEN - SWIR1) / (GREEN + SWIR1)",
    {"GREEN": composite.select("B3"), "SWIR1": composite.select("B11")},
).rename("MVI")
bands = composite.addBands([ndvi, mvi]).select(["NDVI", "MVI"])

stats = bands.reduceRegions(collection=zones, reducer=ee.Reducer.mean(), scale=10)

task = ee.batch.Export.table.toDrive(
    collection=stats,
    description="aether_ndvi_mvi_test",
    fileNamePrefix="aether_ndvi_mvi_test",
    fileFormat="CSV",
)
task.start()

print(f"Export task started: {task.id}")
print("Checking status every 15 seconds (this can take a few minutes)...")

while task.active():
    print(f"  Status: {task.status()['state']}")
    time.sleep(15)

print("Final status:", task.status())