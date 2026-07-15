from pydantic import BaseModel, Field
from typing import Dict

class PredictExistingEventRequest(BaseModel):
    event_id: str = Field(..., description="The unique identifier for the existing event.", examples=["FLASH_0120"])

class PredictRequest(BaseModel):
    """Future Extension: Handles the weather JSON portion of the multipart prediction request."""
    weather_features: Dict[str, float] = Field(..., description="Dictionary of weather variables")
