from fastapi import APIRouter
from backend.core.model_manager import model_manager
from backend.config.settings import settings
from backend.api.schemas.responses import HealthResponse

router = APIRouter(tags=["System"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns the basic health status, version, and model manager readiness."""
    status_dict = model_manager.status
    is_loaded = status_dict.get("loaded", False)
    
    return HealthResponse(
        status="healthy" if is_loaded else "starting",
        version=settings.APP_VERSION,
        model_manager="loaded" if is_loaded else "uninitialized"
    )
