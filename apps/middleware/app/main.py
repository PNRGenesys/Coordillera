"""FastAPI application entry point for the control-plane middleware."""

from fastapi import FastAPI

from .config import get_settings

app = FastAPI(title="Cordillera Middleware", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness endpoint used by the container healthcheck and monitoring.

    Kept intentionally cheap: it must not depend on downstream services so a
    slow API or gateway never makes this service look unhealthy.
    """

    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    """Basic identity endpoint to confirm which service answered."""

    settings = get_settings()
    return {"service": "cordillera-middleware", "api_base_url": settings.api_base_url}
