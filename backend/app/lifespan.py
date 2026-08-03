"""
Application lifespan.

Handles startup and shutdown
"""

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app):
    """
    Startup tasks
    """

    print("Starting AETHER API.")

    yield

    print("Stopping AETHER API.")