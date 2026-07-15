import logging
from ml_pipeline.cnn.feature_extraction import CNNFeatureExtractor
from ml_pipeline.preprocessing.preprocessing_manager import PreprocessingManager
from ml_pipeline.transformer.transformer_encoder import WeatherTransformerEncoder
from ml_pipeline.fusion.multimodal_predictor import MultimodalPredictor
from backend.config.settings import settings
from backend.core.exceptions import ModelNotLoadedError

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Singleton manager to load ML models exactly once during startup.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._is_loaded = False
        return cls._instance

    def load_all(self):
        if self._is_loaded:
            logger.info("Models already loaded.")
            return

        logger.info("Initializing PreprocessingManager...")
        self.preprocessor = PreprocessingManager(
            cnn_csv=settings.CNN_FEATURES_CSV,
            era5_csv=settings.ERA5_FEATURES_CSV,
            modis_csv=settings.MODIS_FEATURES_CSV
        )

        logger.info("Initializing CNNFeatureExtractor...")
        self.cnn_extractor = CNNFeatureExtractor(
            model_path=settings.CNN_MODEL_PATH
        )

        logger.info("Initializing WeatherTransformerEncoder...")
        self.transformer_encoder = WeatherTransformerEncoder(
            model_path=settings.TRANSFORMER_MODEL_PATH,
            input_dim=len(self.preprocessor.weather_cols_present) if self.preprocessor.weather_cols_present else 8
        )

        logger.info("Initializing MultimodalPredictor...")
        self.fusion_predictor = MultimodalPredictor(
            model_path=settings.MULTIMODAL_MODEL_PATH
        )
        self.fusion_predictor.initialize()

        self._is_loaded = True
        logger.info("All models loaded successfully into memory.")

    def get_preprocessor(self) -> PreprocessingManager:
        if not self._is_loaded: raise ModelNotLoadedError("PreprocessingManager")
        return self.preprocessor

    def get_cnn_extractor(self) -> CNNFeatureExtractor:
        if not self._is_loaded: raise ModelNotLoadedError("CNNFeatureExtractor")
        return self.cnn_extractor

    def get_transformer_encoder(self) -> WeatherTransformerEncoder:
        if not self._is_loaded: raise ModelNotLoadedError("WeatherTransformerEncoder")
        return self.transformer_encoder

    def get_fusion_predictor(self) -> MultimodalPredictor:
        if not self._is_loaded: raise ModelNotLoadedError("MultimodalPredictor")
        return self.fusion_predictor

    @property
    def status(self) -> dict:
        return {
            "loaded": getattr(self, "_is_loaded", False),
            "cnn_encoder": settings.CNN_MODEL_PATH.name,
            "transformer": settings.TRANSFORMER_MODEL_PATH.name,
            "fusion_model": settings.MULTIMODAL_MODEL_PATH.name
        }

model_manager = ModelManager()
