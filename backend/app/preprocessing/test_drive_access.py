import ee
from googleapiclient.discovery import build

ee.Initialize(project="rising-capsule-503003-c4")
creds = ee.data.get_persistent_credentials()

drive_service = build("drive", "v3", credentials=creds)
results = drive_service.files().list(
    q="name='aether_ndvi_mvi_test.csv'",
    fields="files(id, name, size)",
).execute()

print(results.get("files", []))