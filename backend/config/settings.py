import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application Config
    APP_NAME: str = "Multimodal Predictor Backend"
    APP_VERSION: str = "1.0.0"

    # Base Project Directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # Model Paths
    CNN_MODEL_PATH: Path = BASE_DIR / "trained_models" / "cnn_encoder_resnet18.pth"
    TRANSFORMER_MODEL_PATH: Path = BASE_DIR / "trained_models" / "weather_transformer.pth"
    MULTIMODAL_MODEL_PATH: Path = BASE_DIR / "trained_models" / "multimodal_model.pth"

    # Dataset Paths
    CNN_FEATURES_CSV: Path = BASE_DIR / "data" / "processed" / "cnn_features.csv"
    TRANSFORMER_FEATURES_CSV: Path = BASE_DIR / "data" / "processed" / "transformer_features.csv"
    ERA5_FEATURES_CSV: Path = BASE_DIR / "data" / "processed" / "era5_features.csv"
    MODIS_FEATURES_CSV: Path = BASE_DIR / "data" / "processed" / "modis_features.csv"
    TRAINING_DATASET_CSV: Path = BASE_DIR / "data" / "processed" / "training_dataset.csv"

    # Raw Data
    RAW_IMAGES_DIR: Path = BASE_DIR / "data" / "raw" / "images"

    class Config:
        env_file = ".env"

settings = Settings()
