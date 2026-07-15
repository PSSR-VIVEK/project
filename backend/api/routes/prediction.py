from fastapi import APIRouter
from backend.api.schemas.requests import PredictExistingEventRequest, PredictRequest
from backend.api.schemas.responses import PredictionResponse
from backend.services.pipeline import PredictionPipeline
from backend.config.settings import settings

router = APIRouter(tags=["Prediction"])

@router.post("/predict-existing-event", response_model=PredictionResponse)
async def predict_existing_event(request: PredictExistingEventRequest):
    """
    Mode 1: Research Mode. Predicts an existing event by looking up its historical data
    and passing it through the in-memory models.
    """
    result = PredictionPipeline.predict(event_id=request.event_id)
    pred_data = result
    
    return PredictionResponse(
        **{
            "Predicted Class": pred_data["Predicted Class"],
            "Prediction Index": pred_data["Prediction Index"],
            "FLASH Probability": pred_data.get("FLASH Probability", pred_data.get("Class Probabilities", {}).get("FLASH", 0.0)),
            "HEAT Probability": pred_data.get("HEAT Probability", pred_data.get("Class Probabilities", {}).get("HEAT", 0.0)),
            "Confidence": pred_data["Confidence"],
            "Raw Logits": pred_data["Raw Logits"],
            "Inference Time": pred_data["Inference Time"]
        }
    )

@router.post("/predict", response_model=PredictionResponse)
async def predict_new_event(request: PredictRequest):
    """
    Mode 2: Production Mode (Prototype). Predicts a new event using the image and weather inputs.
    """
    dummy_image_path = settings.RAW_IMAGES_DIR / "dummy.tif"
    
    result = PredictionPipeline.predict(image_path=dummy_image_path, weather_data=request.weather_features)
    pred_data = result
    
    return PredictionResponse(
        **{
            "Predicted Class": pred_data["Predicted Class"],
            "Prediction Index": pred_data["Prediction Index"],
            "FLASH Probability": pred_data.get("FLASH Probability", pred_data.get("Class Probabilities", {}).get("FLASH", 0.0)),
            "HEAT Probability": pred_data.get("HEAT Probability", pred_data.get("Class Probabilities", {}).get("HEAT", 0.0)),
            "Confidence": pred_data["Confidence"],
            "Raw Logits": pred_data["Raw Logits"],
            "Inference Time": pred_data["Inference Time"]
        }
    )
