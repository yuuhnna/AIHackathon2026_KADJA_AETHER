from fastapi import APIRouter, HTTPException

from app.services.artifact_loader import load_json

router = APIRouter(
    prefix="/api",
    tags=["Scatter Plot"]
)


@router.get("/scatter")
def get_scatter_plot():

    try:
        return load_json("scatter_plot.json")

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="scatter_plot.json not found."
        )