from pathlib import Path
import json
from app.config import ROOT_DIR

ARTIFACT_DIR = ROOT_DIR / "artifacts" # adjust to your project layout


def load_json(filename: str):
    path = ARTIFACT_DIR / filename

    if not path.exists():
        raise FileNotFoundError(f"{filename} not found.")

    with open(path, "r") as f:
        return json.load(f)