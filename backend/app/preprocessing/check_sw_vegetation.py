import ee
import io
import time
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import pandas as pd

ee.Initialize(project="rising-capsule-503003-c4")

full_bbox = ee.Geometry.Rectangle([121.95, 10.30, 123.55, 11.85])
sw_test = ee.Geometry.Rectangle([121.90, 10.55, 122.50, 10.85])

cgmd_sw = (
    ee.FeatureCollection("projects/mangrovedatahub2/assets/CGMD-Extent30")
    .filter(ee.Filter.eq("year", 2022))
    .filterBounds(sw_test)
)

grid = full_bbox.coveringGrid(full_bbox.projection().atScale(300), 300)
grid_sw = grid.filterBounds(cgmd_sw)


def tag_zone_id(feature):
    return feature.set("zone_id", ee.String("ILO-").cat(feature.get("system:index")))


sw_zones = grid_sw.map(tag_zone_id)


def mask_s2_clouds(image):
    scl = image.select("SCL")
    mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
    return image.updateMask(mask)


collection = (
    ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(sw_test)
    .filterDate("2024-01-01", "2024-12-31")
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
    .map(mask_s2_clouds)
)
count = collection.size().getInfo()
print(f"Sentinel-2 images available for SW area in 2024: {count}")

composite = collection.median()
ndvi = composite.normalizedDifference(["B8", "B4"]).rename("NDVI")
mvi = composite.expression(
    "(GREEN - SWIR1) / (GREEN + SWIR1)",
    {"GREEN": composite.select("B3"), "SWIR1": composite.select("B11")},
).rename("MVI")
bands = composite.addBands([ndvi, mvi]).select(["NDVI", "MVI"])

stats = bands.reduceRegions(collection=sw_zones, reducer=ee.Reducer.mean(), scale=10)

task = ee.batch.Export.table.toDrive(
    collection=stats,
    description="sw_test_check",
    fileNamePrefix="sw_test_check",
    fileFormat="CSV",
)
task.start()
print("Export started, waiting...")
while task.active():
    time.sleep(15)
print("Status:", task.status()["state"])

creds = ee.data.get_persistent_credentials()
drive_service = build("drive", "v3", credentials=creds)
result = drive_service.files().list(q="name='sw_test_check.csv'", fields="files(id)").execute()
file_id = result["files"][0]["id"]

request = drive_service.files().get_media(fileId=file_id)
buffer = io.BytesIO()
downloader = MediaIoBaseDownload(buffer, request)
done = False
while not done:
    _, done = downloader.next_chunk()
buffer.seek(0)

df = pd.read_csv(buffer)
print(f"\nExported rows: {len(df)}")
print(df[["zone_id", "NDVI", "MVI"]].to_string())
print(f"\nNull NDVI count: {df['NDVI'].isna().sum()}")