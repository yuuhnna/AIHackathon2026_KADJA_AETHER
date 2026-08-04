# AETHER — AI-Enabled Ecosystem Risk Assessment & Adaptive Rehabilitation Framework

> **AIHackathon 2026 Submission by Team KADJA**  
> An intelligent geospatial decision-support platform predicting mangrove degradation risk and recommending prioritized conservation actions for Mangrove Management Areas (MMAs) in Iloilo Province, Philippines.

---

## Overview

**AETHER** addresses the challenge of allocating limited environmental conservation resources by predicting which mangrove management zones are most vulnerable to future area loss. By combining satellite remote sensing (Sentinel-2, SRTM, ERA5 climate data, OpenStreetMap) with explainable Random Forest machine learning and a rule-based expert recommendation engine, AETHER empowers environmental officers and policymakers to move from reactive restoration to proactive ecological management.

---

## Key Features

- **Interactive GIS Risk Map**: Visualizes Mangrove Management Areas (MMAs) across Iloilo Province, categorized into Low, Moderate, and High Risk zones with Leaflet interactive overlays.
- **Predictive Degradation Scoring**: Predicts next-year percentage area loss using a trained Random Forest Regressor.
- **Explainable AI (SHAP & Feature Importance)**: Deconstructs predictions per zone using SHAP (SHapley Additive exPlanations) and global feature importance metrics to show *why* a zone is at risk.
- **Actionable Conservation Recommendations**: Generates transparent, rule-based intervention plans aligned with the **DENR / PENRO Guimaras** expert validation framework.
- **Model Transparency & Evaluation**: Live dashboard views for model performance metrics ($R^2$, MAE, RMSE) and error-by-severity analysis.
- **Rehabilitation Activity Tracker**: Integrated with Supabase PostgreSQL for logging, tracking, and auditing field rehabilitation projects and zone assessments.

---

## Repository Architecture

```
AIHackathon2026_KADJA_AETHER/
├── ai/                      # Machine Learning Training & Evaluation Pipeline
│   ├── analysis/            # Error-by-severity and diagnostic visualization scripts
│   ├── explainability/      # Feature importance and SHAP analysis
│   ├── models/              # Saved model binaries (.joblib) and feature tables
│   ├── scripts/             # Data loading, preprocessing, model training, and testing
│   ├── requirements.txt     # Python ML dependencies
│   └── train.py             # Main AI training pipeline entrypoint
│
├── backend/                 # FastAPI REST API Backend
│   ├── app/
│   │   ├── config.py        # Central configuration, feature schemas & risk thresholds
│   │   ├── lifespan.py      # FastAPI startup/shutdown asset loading
│   │   ├── routes/          # API endpoint handlers (zones, prediction, metrics, etc.)
│   │   └── services/        # Prediction, SHAP, and recommendation services
│   ├── main.py              # Uvicorn entrypoint & CORS middleware setup
│   └── requirements.txt     # Backend Python dependencies
│
├── frontend/                # Next.js 16 Web Application
│   ├── app/                 # Next.js App Router (Dashboard, Map, Methodology, Explainability)
│   ├── components/          # UI Components (GIS Map, Sidebar, Validation Tables, Charts)
│   ├── lib/                 # Utility functions, API clients, color tokens
│   └── package.json         # Node.js dependencies (React 19, Leaflet, Tailwind v4, Supabase)
│
└── supabase/                # Database Schemas & Row-Level Security
    └── schema.sql           # SQL script for rehab_activities and zone_assessments tables
```

---

## Data Sources & Feature Matrix

AETHER extracts environmental features at the **Mangrove Management Area (MMA)** spatial resolution observed annually:

| Feature Name | Description | Data Source |
| :--- | :--- | :--- |
| `mean_ndvi` | Normalized Difference Vegetation Index (Canopy greenness & vigor) | Sentinel-2 (via Google Earth Engine) |
| `mean_mvi` | Mangrove Vegetation Index (Mangrove-specific condition) | Sentinel-2 (Baloloy et al., 2020) |
| `mean_temperature` | Mean air temperature for the zone | ERA5 Climate Reanalysis |
| `annual_precipitation` | Total annual rainfall | ERA5 Climate Reanalysis |
| `mean_wind_speed` | Average wind speed and storm exposure | ERA5 Climate Reanalysis |
| `mean_elevation` | Elevation above sea level (meters) | SRTM Digital Elevation Model |
| `mean_slope` | Terrain slope steepness | SRTM Digital Elevation Model |
| `nearest_aquaculture_distance_m` | Distance to nearest aquaculture site (m) | OpenStreetMap |
| `nearest_river_distance_m` | Distance to nearest river channel (m) | OpenStreetMap |

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or v20.x
- **Python**: v3.10+
- **npm** or **pnpm** / **yarn** / **bun**

---

### 1. Frontend Setup (Next.js)

> **Windows PowerShell note:** If `npm` commands fail with a script execution policy error, run this first in your PowerShell session:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start at **`http://localhost:3000`** (or **`http://localhost:3001`** if port 3000 is already in use).

---

### 2. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

> **Windows PowerShell note:** If you see a script execution policy error when running `npm` or activating the venv, run this first in your PowerShell session:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```
> This only applies to the current terminal session and resets when you close it.

The backend API will run at **`http://localhost:8000`** (Interactive OpenAPI docs available at `http://localhost:8000/docs`).

---

### 3. AI Model Pipeline (Optional / Retraining)

To run the AI pipeline from scratch, preprocess data, train the Random Forest model, and generate explainability artifacts:

```bash
# Navigate to ai directory
cd ai

# Install AI dependencies
pip install -r requirements.txt

# Run the training script
python train.py
```

This updates model artifacts in `ai/models/` and `backend/artifacts/`.

---

### 4. Database Setup (Supabase)

To enable rehabilitation tracking and zone assessment recording:

1. Create a project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in Supabase.
3. Run the SQL statements from [`supabase/schema.sql`].
4. Configure environment variables in `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

---

## Backend API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API Welcome message & version |
| `GET` | `/api/summary` | Summary stats across all monitored mangrove zones |
| `GET` | `/api/zones` | Monitored zones list with predicted risk, SHAP drivers, & recommendations |
| `GET` | `/api/zones/{zone_id}` | Detailed assessment for a specific zone |
| `POST` | `/api/predict` | Live risk prediction for custom feature vectors |
| `GET` | `/api/feature-importance` | Global Random Forest feature importance rankings |
| `GET` | `/api/model-metrics` | Model performance evaluation metrics ($R^2$, MAE, RMSE) |
| `GET` | `/api/error-by-severity` | Residual and error breakdown grouped by risk severity bins |
| `GET` | `/health` | API health status check |

---

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Leaflet / React-Leaflet, Supabase JS Client
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic, Scikit-Learn, SHAP, Joblib, Google Earth Engine API (`earthengine-api`)
- **Machine Learning**: Random Forest Regressor, SHAP TreeExplainer, Pandas, NumPy, Scikit-learn
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)

---

## Expert Validation & Limitations

- **Expert Review**: The recommendation rule base was submitted for expert review by **PENRO Guimaras (DENR)**.
- **Scope**: Targeted for Mangrove Management Areas (MMAs) in Iloilo Province, Philippines.
- **Decision Support**: AETHER is designed as a human-in-the-loop decision-support tool. All recommendations require field validation prior to execution.


