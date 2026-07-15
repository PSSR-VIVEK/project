from pydantic import BaseModel, Field
from typing import Dict, Any, List

class HealthResponse(BaseModel):
    status: str
    version: str
    model_manager: str

class ArchitectureResponse(BaseModel):
    pipeline: List[str]

class MetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float

class PredictionResponse(BaseModel):
    Predicted_Class: str = Field(alias="Predicted Class")
    Prediction_Index: int = Field(alias="Prediction Index")
    FLASH_Probability: float = Field(alias="FLASH Probability")
    HEAT_Probability: float = Field(alias="HEAT Probability")
    Confidence: float
    Raw_Logits: List[float] = Field(alias="Raw Logits")
    Inference_Time: str = Field(alias="Inference Time")

    class Config:
        populate_by_name = True
