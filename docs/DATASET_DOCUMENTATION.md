Comprehensive technical documentation detailing the origin, format, purpose, schema, and preprocessing workflows for all datasets powering the **AETHER** Ecosystem Risk Assessment Platform.

---

## Table of Contents

1. [Overview & Data Architecture](#overview--data-architecture)
2. [Primary Datasets](#primary-datasets)
   - [1. Monitored Feature Matrix (`feature_table.csv`)](#1-monitored-feature-matrix-feature_tablecsv)
   - [2. Feature Importance Matrix (`feature_importance.csv`)](#2-feature-importance-matrix-feature_importancecsv)
   - [3. Error Diagnostic Tier Matrix (`error_by_severity.csv`)](#3-error-diagnostic-tier-matrix-error_by_severitycsv)
   - [4. Model Evaluation Metrics (`metrics.json`)](#4-model-evaluation-metrics-metricsjson)
   - [5. Field Operations & Rehabilitation Database (`supabase/schema.sql`)](#5-field-operations--rehabilitation-database-supabaseschemasql)
3. [Feature Dictionary & Measurement Units](#feature-dictionary--measurement-units)
4. [Data Flow & Preprocessing Pipeline](#data-flow--preprocessing-pipeline)

---

## Overview & Data Architecture

The **AETHER** platform fuses multi-source satellite remote sensing, digital elevation models, climate reanalysis, and vector spatial datasets to monitor **Mangrove Management Areas (MMAs)** across Iloilo Province, Philippines. 

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RAW DATA SOURCES                                 │
├───────────────┬────────────────┬─────────────────┬───────────┬──────────────┤
│  Sentinel-2   │    SRTM DEM    │  ERA5 Climate   │ OpenStMap │  DENR MMAs   │
│ Optical Bands │ Elevation/Slope│ Temp/Rain/Wind  │ Rivers/Ponds│ Boundaries │
└───────┬───────┴────────┬───────┴────────┬────────┴─────┬─────┴──────┬───────┘
        │                │                │              │            │
        └────────────────┼────────────────┴──────────────┴────────────┘
                         │ Google Earth Engine & Spatial Joining
                         ▼
        ┌──────────────────────────────────────────────────┐
        │  Processed Feature Table (feature_table.csv)     │
        │  2,560 Spatial Polygon Observations (2022)       │
        └────────────────────────┬─────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │   AI Training     │           │   FastAPI API     │
       │ Random Forest Reg │           │ Prediction Engine │
       └─────────┬─────────┘           └─────────┬─────────┘
                 │                               │
                 ▼                               ▼
       ┌───────────────────┐           ┌───────────────────┐
       │ XAI & Diagnostics │           │ Next.js Dashboard │
       │ Importance/Metrics│           │ Interactive GIS   │
       └───────────────────┘           └───────────────────┘
```

---

## Primary Datasets

### 1. Monitored Feature Matrix (`feature_table.csv`)

- **File Path**: 
  - `ai/data/raw/processed/feature_table.csv`
  - `backend/data/raw/processed/feature_table.csv`
- **Origin**: Multi-sensor remote sensing & spatial data fusion:
  - **Sentinel-2 Satellite Imagery** (via Google Earth Engine API): Multi-spectral bands used to calculate vegetation condition indices.
  - **SRTM (Shuttle Radar Topography Mission) DEM**: 30m Digital Elevation Model for topography and elevation metrics.
  - **ERA5 Climate Reanalysis** (ECMWF): Annual climate and atmospheric observations.
  - **OpenStreetMap (OSM)**: Open vector GIS infrastructure and hydrological spatial datasets.
  - **DENR / PENRO Mangrove Management Areas**: Boundaries defining monitored spatial management polygon units across Iloilo Province.
- **Format**: Tabular CSV (Comma-Separated Values), 2,560 rows $\times$ 13 columns with embedded GeoJSON strings.
- **Purpose**: Serves as the core input feature matrix for training, evaluating, and serving real-time risk predictions with the AETHER Random Forest Regressor to predict next-year percentage area change/degradation (`next_year_change_pct`).

#### Data Schema (`feature_table.csv`)

| Column Name | Data Type | Units / Range | Description | Source |
| :--- | :--- | :--- | :--- | :--- |
| `feature_id` | String (Hex) | 20-char hash | Unique spatial identifier for each MMA polygon | Regional Boundary GIS |
| `year` | Integer | YYYY (e.g. 2022) | Observation year | Temporal Metadata |
| `annual_precipitation` | Float | millimeters (mm) | Total annual rainfall over the zone | ERA5 Reanalysis |
| `mean_temperature` | Float | Celsius (°C) | Mean annual air temperature | ERA5 Reanalysis |
| `mean_wind_speed` | Float | meters / second | Average annual wind speed and storm exposure | ERA5 Reanalysis |
| `mean_elevation` | Float | meters (m) | Mean elevation above sea level | SRTM 30m DEM |
| `mean_slope` | Float | degrees (°) | Terrain slope steepness within polygon | SRTM 30m DEM |
| `mean_ndvi` | Float | [-1.0, +1.0] | Normalized Difference Vegetation Index (Canopy greenness) | Sentinel-2 |
| `mean_mvi` | Float | [-2.0, +50.0+] | Mangrove Vegetation Index (Baloloy et al., 2020) | Sentinel-2 |
| `nearest_aquaculture_distance_m` | Float | meters (m) | Distance from polygon to nearest aquaculture site | OpenStreetMap |
| `nearest_river_distance_m` | Float | meters (m) | Distance from polygon to nearest river channel | OpenStreetMap |
| `next_year_change_pct` | Float | percentage (%) | **Target Variable**: Expected next-year mangrove area loss/change | Satellite Change Analysis |
| `.geo` | String (JSON) | GeoJSON Polygon | Spatial coordinates of zone boundary (EPSG:4326 WGS84) | Earth Engine Export |

#### Preprocessing & Transformation Steps:
1. **Spatial Zonal Aggregation**: Clipped continuous raster layers (Sentinel-2, SRTM, ERA5) to MMA polygon boundaries and calculated mean raster values (`mean_*`, `annual_*`) via Google Earth Engine API.
2. **Proximity Vector Analysis**: Computed minimum geodesic distances (in meters) from each MMA polygon boundary to nearest OSM river polylines and aquaculture polygon geometries.
3. **Data Cleaning & Type Casting**: Standardized headers, cast numerical values, and formatted polygon geometries into EPSG:4326 GeoJSON standard.
4. **Dataset Partitioning**: Split into 80% training (`X_train`, `y_train`) and 20% testing (`X_test`, `y_test`) sets using `train_test_split(test_size=0.2, random_state=42)`.
5. **Predictor Selection**: Extracted 9 numerical predictor features (`annual_precipitation`, `mean_elevation`, `mean_mvi`, `mean_ndvi`, `mean_slope`, `mean_temperature`, `mean_wind_speed`, `nearest_aquaculture_distance_m`, `nearest_river_distance_m`) in a fixed column order required by scikit-learn.

---

### 2. Feature Importance Matrix (`feature_importance.csv`)

- **File Path**: 
  - `ai/models/feature_importance.csv`
  - `backend/models/feature_importance.csv`
- **Origin**: Derived programmatically post-training from the fitted `RandomForestRegressor` via `model.feature_importances_`.
- **Format**: CSV table (2 columns: `Feature`, `Importance`).
- **Purpose**: Provides global Explainable AI (XAI) transparency by ranking the relative influence of each environmental variable on the model's risk predictions.

#### Sample Data Layout:

```csv
Feature,Importance
mean_mvi,0.3421
nearest_aquaculture_distance_m,0.1845
nearest_river_distance_m,0.1210
mean_ndvi,0.0984
annual_precipitation,0.0823
mean_temperature,0.0612
mean_slope,0.0451
mean_wind_speed,0.0381
mean_elevation,0.0273
```

#### Preprocessing Steps:
1. Computed mean decrease in impurity across all 100 trees in the Random Forest ensemble.
2. Normalized importance scores so that they sum to $1.0$.
3. Sorted features descending by importance score and exported for consumption by the `/api/feature-importance` endpoint.

---

### 3. Error Diagnostic Tier Matrix (`error_by_severity.csv`)

- **File Path**: 
  - `ai/models/error_by_severity.csv`
  - `backend/artifacts/error_by_severity.csv`
- **Origin**: Model evaluation module (`ai/analysis/error_by_severity.py`) comparing ground truth vs. predicted values across the test dataset.
- **Format**: CSV table containing error distributions across risk tiers.
- **Purpose**: Evaluates model performance and residuals across Low, Moderate, and High risk severity bins to ensure prediction accuracy remains consistent regardless of degradation severity.

#### Key Metrics Tracked:
- **`severity_bin`**: Risk category tier (Low: $<35\%$, Moderate: $35-55\%$, High: $>55\%$).
- **`sample_count`**: Number of test samples falling into each tier.
- **`mae`**: Mean Absolute Error within the tier.
- **`rmse`**: Root Mean Squared Error within the tier.
- **`mean_residual`**: Average prediction bias ($\hat{y} - y$).

---

### 4. Model Evaluation Metrics (`metrics.json`)

- **File Path**: `backend/artifacts/metrics.json`
- **Origin**: Automated evaluation script (`ai/scripts/evaluate.py` or `backend/retrain.py`).
- **Format**: JSON object.
- **Purpose**: Feeds the live model transparency dashboard (`/api/model-metrics`) with quantitative performance indicators.

#### Sample File Structure:

```json
{
    "mae": 4.1205,
    "rmse": 5.8431,
    "r2": 0.8654,
    "confidence_score": 0.9142,
    "dataset": {
        "samples": 2560,
        "features": 9
    },
    "model": {
        "name": "Random Forest Regressor",
        "version": "1.0"
    }
}
```

#### Preprocessing & Calculation:
- **Mean Absolute Error (MAE)**: Average magnitude of prediction errors in percentage points.
- **Root Mean Squared Error (RMSE)**: Square root of mean squared prediction residuals.
- **Coefficient of Determination ($R^2$)**: Proportion of variance in area loss explained by the environmental features.
- **Confidence Score**: Fraction of test predictions where absolute error is $\le 10.0$ percentage points.

---

### 5. Field Operations & Rehabilitation Database (`supabase/schema.sql`)

- **File Path**: `supabase/schema.sql`
- **Origin**: Database schema designed for the AETHER platform's field management module.
- **Format**: PostgreSQL DDL SQL file compatible with Supabase.
- **Purpose**: Stores ground-truth field verification logs, user assessments, and mangrove rehabilitation tracking projects.

#### Database Tables Overview:

1. **`zone_assessments`**: Stores local field inspections logged by environmental officers.
   - Fields: `id` (UUID), `zone_id` (Text), `assessed_by` (Text), `assessment_date` (Timestamp), `observed_risk` (Enum: Low/Moderate/High), `notes` (Text).
2. **`rehab_activities`**: Tracks conservation and planting interventions.
   - Fields: `id` (UUID), `zone_id` (Text), `activity_name` (Text), `activity_type` (Enum e.g., Reforestation, Fencing, Aquaculture Regulation), `status` (Enum: Planned/In-Progress/Completed), `target_completion_date` (Date), `created_at` (Timestamp).

#### Security & Access Control:
- **Row-Level Security (RLS)**: Enabled on all tables.
- **Access Policies**: Permits read access to authenticated users and authorized write access for registered DENR field staff.

---

## Feature Dictionary & Measurement Units

| Feature Identifier | Display Label | Data Type | Range / Format | Description & Ecological Context |
| :--- | :--- | :--- | :--- | :--- |
| `mean_ndvi` | Vegetation health (NDVI) | Float | $-1.0$ to $+1.0$ | Normalized Difference Vegetation Index measures photosynthetic canopy greenness ($NIR - Red / NIR + Red$). |
| `mean_mvi` | Mangrove Vegetation Condition (MVI) | Float | $-2.0$ to $+50.0+$ | Mangrove Vegetation Index (Baloloy et al., 2020), specifically tuned for green/NIR/SWIR ratio to distinguish mangroves from terrestrial flora. |
| `mean_temperature` | Mean air temperature | Float | °C (e.g. $26.4°C$) | Annual average air temperature; thermal stress affects mangrove metabolic productivity. |
| `annual_precipitation` | Annual precipitation | Float | mm (e.g. $3754.27$ mm) | Total annual rainfall; freshwater inflow regulates salinity balance in estuarine mangrove habitats. |
| `mean_wind_speed` | Mean wind exposure | Float | m/s (e.g. $1.66$ m/s) | Wind speed & wave/storm surge exposure metric; high values correlate with physical wave erosion. |
| `mean_elevation` | Elevation above sea level | Float | meters (e.g. $0.0 - 3.5$ m) | Mean elevation above mean sea level; lower elevation zones (<2m) are highly susceptible to inundation and tidal stress. |
| `mean_slope` | Terrain slope | Float | degrees (e.g. $0° - 5°$) | Slope steepness; flatter intertidal zones affect tidal exchange and sedimentation rates. |
| `nearest_aquaculture_distance_m` | Proximity to aquaculture sites | Float | meters (e.g. $0.0 - 1500$ m) | Distance to nearest fishponds/shrimp farms. Proximity of 0m indicates immediate land conversion pressure. |
| `nearest_river_distance_m` | Proximity to rivers | Float | meters (e.g. $50.0 - 3000$ m) | Distance to nearest river mouth/estuary; dictates sediment supply and nutrient runoff. |

---

## Data Flow & Preprocessing Pipeline

The flowchart below illustrates how raw datasets transition through preprocessing, model training, backend serving, and database persistence:

```
[ Sentinel-2 Imagery ]     [ SRTM DEM ]     [ ERA5 Climate ]     [ OSM Vectors ]
          │                     │                  │                    │
          ▼                     ▼                  ▼                    ▼
     (GEE Spectral        (GEE Spatial        (GEE Spatial         (OSM Vector
      Indices Calculation) Clip & Average)    Clip & Average)     Distance Join)
          │                     │                  │                    │
          └─────────────────────┼──────────────────┴────────────────────┘
                                │
                                ▼
                 [ Raw Combined Spatial Feature Matrix ]
                                │
                                ▼  ai/scripts/preprocess.py
               - Missing value check & geometry parsing
               - Select 9 feature predictors & 1 target
               - 80/20 Train-Test Random Split
                                │
                                ▼
                [ Processed Feature Table: feature_table.csv ]
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
    [ AI Training Pipeline ]           [ Backend API Service ]
    - RandomForestRegressor            - FastAPI Uvicorn Server
    - Feature Importance Extraction    - Relative Municipality Ranking
    - Residual Severity Analysis       - SHAP Explanation Generation
               │                                 │
               ▼                                 ▼
   [ Model Artifacts (.joblib) ]       [ Interactive User Application ]
   - aether_v1.0.joblib                - Leaflet Map & Zone Dashboard
   - feature_importance.csv            - Supabase Rehabilitation Log
   - metrics.json
