import logging
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

class ModelNotLoadedError(Exception):
    def __init__(self, model_name: str):
        self.model_name = model_name

class EventNotFoundError(Exception):
    def __init__(self, event_id: str):
        self.event_id = event_id

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error.", "error": str(exc)},
    )

async def model_not_loaded_handler(request: Request, exc: ModelNotLoadedError):
    return JSONResponse(
        status_code=503,
        content={"detail": f"Model not loaded: {exc.model_name}. Please check backend startup logs."},
    )

async def event_not_found_handler(request: Request, exc: EventNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"detail": f"Event ID '{exc.event_id}' not found in historical datasets."},
    )
