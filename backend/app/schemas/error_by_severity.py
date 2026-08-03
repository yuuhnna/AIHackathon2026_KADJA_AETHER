from pydantic import BaseModel


class ErrorBySeverityItem(BaseModel):
    range: str
    sample_size: int
    mae: float
    error_min: float
    error_max: float