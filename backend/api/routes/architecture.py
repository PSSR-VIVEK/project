from fastapi import APIRouter

router = APIRouter(tags=["Architecture"])

@router.get("/architecture")
async def get_architecture():
    """Returns complete pipeline architecture details."""
    return {
        "project": "Multimodal Deep Learning Framework for Regional Heat Wave and Flash Flood Occurrences",
        "loaded_modules": [
            "CNNFeatureExtractor (ResNet18)",
            "PreprocessingManager (SimpleImputer, StandardScaler)",
            "WeatherTransformerEncoder",
            "MultimodalPredictor"
        ],
        "execution_order": "Parallel Feature Extraction -> Sequential Preprocessing -> Cross Attention Fusion -> Prediction"
    }

@router.get("/pipeline")
async def get_pipeline():
    """Returns the pipeline stages (for frontend animation visualization)."""
    return {
        "pipeline_stages": [
            "Satellite Image",
            "CNN Feature Extraction",
            "Weather Preprocessing",
            "Transformer",
            "Cross Attention",
            "Prediction"
        ]
    }
