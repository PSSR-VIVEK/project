from fastapi import APIRouter
from backend.core.model_manager import model_manager

router = APIRouter(tags=["Models"])

@router.get("/models")
async def get_models():
    """Returns the loaded models, their target device, and loading status."""
    try:
        device = str(model_manager.get_fusion_predictor().device)
    except Exception:
        device = "unknown"
        
    status = model_manager.status
    
    return {
        "loaded_models": [
            status.get("cnn_encoder", "cnn_encoder_resnet18.pth"),
            status.get("transformer", "weather_transformer.pth"),
            status.get("fusion_model", "multimodal_model.pth")
        ],
        "device": device,
        "status": "Ready" if status.get("loaded", False) else "Loading"
    }
