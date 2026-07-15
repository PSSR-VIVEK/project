from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from backend.config.settings import settings
from backend.core.model_manager import model_manager
from backend.core.exceptions import (
    ModelNotLoadedError, 
    EventNotFoundError, 
    global_exception_handler, 
    model_not_loaded_handler, 
    event_not_found_handler
)

from backend.api.routes import health, architecture, models, datasets, metrics, prediction

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load all models into memory exactly once
    logger.info("Starting up Backend. Initializing ModelManager...")
    try:
        model_manager.load_all()
    except Exception as e:
        logger.error(f"Failed to load models during startup: {e}")
        # Allow graceful loading failures so the API still starts, but endpoints will throw 503
    yield
    # Shutdown
    logger.info("Shutting down Backend.")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Multimodal Deep Learning Prediction",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(ModelNotLoadedError, model_not_loaded_handler)
app.add_exception_handler(EventNotFoundError, event_not_found_handler)

# Include Routers
app.include_router(health.router)
app.include_router(architecture.router)
app.include_router(models.router)
app.include_router(datasets.router)
app.include_router(metrics.router)
app.include_router(prediction.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
