"""
Error by severity service.
"""

from app.services.data_service import get_data_service
from app.schemas.error_by_severity import ErrorBySeverityItem


class ErrorBySeverityService:

    def __init__(self):
        self.data_service = get_data_service()

    def get_error_by_severity(self) -> list[ErrorBySeverityItem]:
        df = self.data_service.load_error_by_severity()

        return [
            ErrorBySeverityItem(
                range=row["range"],
                sample_size=int(row["sample_size"]),
                mae=float(row["mae"]),
                error_min=float(row["error_min"]),
                error_max=float(row["error_max"]),
            )
            for _, row in df.iterrows()
        ]


_error_by_severity_service = ErrorBySeverityService()


def get_error_by_severity_service() -> ErrorBySeverityService:
    return _error_by_severity_service