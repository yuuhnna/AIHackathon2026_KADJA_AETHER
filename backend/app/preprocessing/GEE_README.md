# Wiring in real Google Earth Engine data

This replaces the synthetic `feature_table.csv` with real Sentinel-2
(NDVI/MVI), SRTM (elevation/slope), and Global Mangrove Watch (extent/loss
label) data pulled from Earth Engine for actual Iloilo Province mangrove
zones. Everything downstream — the trained model, SHAP, the FastAPI
endpoints, the dashboard — reads the same CSV schema, so **nothing else
needs to change** once this file is in place.

## 0. What you need

- A Google Earth Engine account with a **registered Cloud Project**
  (you said you already have this — if not: https://code.earthengine.google.com/register)
- Python 3.10+ with the backend's `requirements.txt` installed, plus:
  ```bash
  pip install earthengine-api geopandas
  ```

## 1. Authenticate

One-time, interactive (opens a browser to log into your Google account):
```bash
earthengine authenticate
```
This stores a credential locally so `ee.Initialize()` works from then on.

If you're running this on a headless machine (e.g. a cloud VM with no
browser), use a service account instead — see
https://developers.google.com/earth-engine/guides/service_account.

## 2. Set your project ID

Open `backend/scripts/gee_build_feature_table.py` and set:
```python
GEE_PROJECT_ID = "your-gcp-project-id"
```
(the same project ID you registered for Earth Engine access).

## 3. Define your AOI (area of interest)

You have two options — pick whichever matches what you have:

**Option A — you don't have your own zone boundaries yet (fastest):**
The script can pull the real Global Mangrove Watch (GMW v3) mangrove
extent polygon for Iloilo Province directly from Earth Engine and use it
as the AOI automatically. No file needed — this is the default in the
script as shipped.

**Option B — you have official zone/barangay boundaries** (e.g. from
DENR/PENRO, or your own digitized shapefile):
Put the file at `backend/data/raw/aoi/iloilo_mangrove_zones.geojson` and
set `USE_CUSTOM_AOI = True` in the script. It must have a polygon per
zone; a `zone_id` column is optional (auto-generated if missing).

## 4. Run it

```bash
cd backend
python scripts/gee_build_feature_table.py
```

This will:
1. Fetch (or load) the AOI
2. Split it into a grid of zones (~300m cells by default — adjust
   `GRID_CELL_SIZE_M` in the script if you want coarser/finer zones)
3. Pull a cloud-masked Sentinel-2 median composite for your date window
   and compute NDVI + MVI per zone
4. Pull SRTM elevation + slope per zone
5. Pull GMW mangrove extent at two time points and compute a per-zone
   loss fraction as the training label
6. Write `backend/data/processed/feature_table.csv` in the exact schema
   the backend expects

## 5. What this script does NOT cover

Two feature groups still need separate data sources not available on GEE
in the same way:

- **Climate (ERA5)** — needs a Copernicus CDS API key. Use
  `src/features/climate.py` from the earlier
  `aether-feature-engineering` scaffold (same schema, drop-in).
- **Proximity (OSM roads/aquaculture/rivers)** — needs `osmnx`. Use
  `src/features/proximity.py` from the same scaffold.

If you don't have time to wire those up before judging, the script fills
those columns with reasonable defaults (province-wide climate means, and
a note in `confidence_flag`) so the pipeline still runs end-to-end — just
flag to judges that those two feature groups are placeholder-quality
until the real pulls are wired in.

## 6. After it runs

```bash
# from backend/
uvicorn app.main:app --reload --port 8000
```
That's it — `data_service.py` loads `feature_table.csv` at startup, so
restarting the server is the only step needed. The dashboard will show
real Sentinel-2/SRTM/GMW-derived zones automatically.

## 7. A note on what I could and couldn't verify from here

I don't have network access to Earth Engine's servers from this
environment, so I wrote and syntax-checked this script but **could not
run it against live GEE data myself**. Before your demo, run it once
ahead of time and sanity-check the output — in particular:
- Confirm the zone count and coordinates look right on the dashboard map
- Check `feature_table.csv` for NaN columns (usually means a GMW asset
  path changed, or your AOI didn't intersect any Sentinel-2 tiles for
  the date window)