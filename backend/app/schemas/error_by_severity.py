"""
Error-by-severity schema.

One row of the model's test-set error, grouped by how much mangrove area
was actually lost — used to show whether the model is only wrong on the
severe cases.
"""

from pydantic import BaseModel


class ErrorBySeverityItem(BaseModel):
    range: str
    sample_size: int
    mae: float
    error_min: float
    error_max: float