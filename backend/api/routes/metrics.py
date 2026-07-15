from fastapi import APIRouter
from backend.api.schemas.responses import MetricsResponse

router = APIRouter(tags=["Metrics"])

@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """Returns the static research metrics achieved by the Multimodal model."""
    return MetricsResponse(
        accuracy=0.92,
        precision=0.90,
        recall=0.91,
        f1_score=0.91
    )
