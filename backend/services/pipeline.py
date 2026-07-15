import logging
import pandas as pd
import numpy as np
from pathlib import Path
from backend.core.model_manager import model_manager
from backend.config.settings import settings
from backend.core.exceptions import EventNotFoundError

logger = logging.getLogger(__name__)

class PredictionPipeline:
    """
    Central pipeline orchestrating inference in either Research Mode or Production Mode.
    """

    @staticmethod
    def predict_existing_event(event_id: str) -> dict:
        """
        Mode 1: Research Mode (Primary)
        Fetches historical features and runs them through the Transformer and Fusion.
        """
        logger.info(f"Executing Mode 1: Research Mode for event {event_id}")
        
        preprocessor = model_manager.get_preprocessor()
        transformer = model_manager.get_transformer_encoder()
        fusion = model_manager.get_fusion_predictor()

        # 1. Load corresponding CNN embedding
        cnn_df = pd.read_csv(settings.CNN_FEATURES_CSV)
        cnn_row = cnn_df[cnn_df["event_id"].astype(str).str.startswith(event_id)]
        if cnn_row.empty:
            raise EventNotFoundError(event_id)
        
        cnn_cols = [c for c in cnn_row.columns if c != "event_id"]
        cnn_emb = cnn_row[cnn_cols].values[0].astype(np.float32)

        # 2. Load corresponding Transformer embedding
        tr_df = pd.read_csv(settings.TRANSFORMER_FEATURES_CSV)
        tr_row = tr_df[tr_df["event_id"].astype(str).str.startswith(event_id)]
        if tr_row.empty:
            raise EventNotFoundError(event_id)

        tr_cols = [c for c in tr_row.columns if c != "event_id"]
        tr_emb = tr_row[tr_cols].values[0].astype(np.float32)

        logger.info(f"Loaded CNN feature columns count: {len(cnn_cols)}")
        logger.info(f"Loaded Transformer feature columns count: {len(tr_cols)}")

        # 5. MultimodalPredictor
        prediction = fusion.predict_single(cnn_emb, tr_emb)
        
        return prediction

    @staticmethod
    def predict_new(image_path: Path, weather_data: dict) -> dict:
        """
        Mode 2: Production Mode (Future Extension)
        Executes CNN extractor -> Transformer -> Fusion.
        """
        logger.info("Executing Mode 2: Production Mode for new satellite image")
        
        cnn_extractor = model_manager.get_cnn_extractor()
        preprocessor = model_manager.get_preprocessor()
        transformer = model_manager.get_transformer_encoder()
        fusion = model_manager.get_fusion_predictor()

        # 1. Satellite Image -> CNNFeatureExtractor
        cnn_emb = cnn_extractor.extract_features(image_path)

        # 2. Weather -> PreprocessingManager
        weather_df = pd.DataFrame([weather_data])
        
        if preprocessor.numerical_cols:
            cols = [c for c in preprocessor.numerical_cols if c in weather_df.columns]
            if cols:
                logger.info(f"Weather input columns used for Imputer (New Event): {cols}")
                weather_df[cols] = preprocessor.imputer.transform(weather_df[cols])
        
        if preprocessor.weather_cols_present:
            cols = [c for c in preprocessor.weather_cols_present if c in weather_df.columns]
            if cols:
                logger.info(f"Weather input columns used for Scaler (New Event): {cols}")
                weather_df[cols] = preprocessor.scaler.transform(weather_df[cols])

        # 3. WeatherTransformerEncoder
        tr_emb = transformer.transform_single(weather_df)

        # 4. MultimodalPredictor
        prediction = fusion.predict_single(cnn_emb, tr_emb)

        return prediction

    @staticmethod
    def predict(event_id: str = None, image_path: Path = None, weather_data: dict = None) -> dict:
        """Automatically routes to the correct mode."""
        if event_id:
            return PredictionPipeline.predict_existing_event(event_id)
        elif image_path and weather_data:
            return PredictionPipeline.predict_new(image_path, weather_data)
        else:
            raise ValueError("Must provide either event_id OR (image_path AND weather_data)")
