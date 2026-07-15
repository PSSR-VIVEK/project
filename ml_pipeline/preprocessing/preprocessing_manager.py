"""
====================================================
README: Preprocessing Manager
====================================================
Purpose: Centralizes preprocessing objects (SimpleImputer, StandardScaler, LabelEncoder)
         by fitting them once on the historical dataset and keeping them in memory.
         Provides these objects via dependency injection to other modules.
====================================================
"""
import logging
from pathlib import Path
from typing import Union, Optional, List
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, LabelEncoder

logger = logging.getLogger(__name__)

class PreprocessingManager:
    """
    Centralized manager for all preprocessing objects.
    Ensures scalers and imputers are fitted exactly once on the training dataset.
    """
    
    WEATHER_COLS = [
        'era5_temp_mean_c', 'era5_dewpoint_mean_c', 'era5_pressure_mean_pa',
        'era5_u_wind_mean', 'era5_v_wind_mean', 'era5_precip_sum_mm',
        'era5_runoff_sum_mm', 'LST_Day_C'
    ]

    def __init__(
        self, 
        cnn_csv: Union[str, Path], 
        era5_csv: Union[str, Path], 
        modis_csv: Union[str, Path],
        labels_csv: Optional[Union[str, Path]] = None
    ):
        self.cnn_csv = Path(cnn_csv)
        self.era5_csv = Path(era5_csv)
        self.modis_csv = Path(modis_csv)
        self.labels_csv = Path(labels_csv) if labels_csv else None
        
        self.imputer = SimpleImputer(strategy='median')
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        
        self.numerical_cols: List[str] = []
        self.weather_cols_present: List[str] = []
        
        self._initialize()

    def _initialize(self) -> None:
        """Loads historical data, merges it, and fits all preprocessing objects."""
        logger.info("Initializing PreprocessingManager...")
        
        if not all([self.cnn_csv.exists(), self.era5_csv.exists(), self.modis_csv.exists()]):
            logger.warning("Historical feature CSVs missing. Preprocessors will be unfitted.")
            return

        cnn = pd.read_csv(self.cnn_csv)
        era5 = pd.read_csv(self.era5_csv)
        modis = pd.read_csv(self.modis_csv)

        cnn['event_id'] = cnn['event_id'].astype(str).str.replace('_Sentinel-2', '', regex=False)
        era5['event_id'] = era5['event_id'].astype(str)
        modis['event_id'] = modis['event_id'].astype(str)

        era5 = era5.drop(columns=['image_date'], errors='ignore')
        modis = modis.drop(columns=['image_date'], errors='ignore')

        merged = cnn.merge(era5, on='event_id', how='left')
        merged = merged.merge(modis, on='event_id', how='left')
        merged = merged.drop_duplicates(subset='event_id')

        # Define weather columns available in the merged dataset
        self.weather_cols_present = [c for c in self.WEATHER_COLS if c in merged.columns]
        self.numerical_cols = self.weather_cols_present  # Only impute weather features, ignore CNN features

        # Fit Imputer
        if self.numerical_cols:
            logger.info(f"Imputer fitted on: {self.numerical_cols}")
            self.imputer.fit(merged[self.numerical_cols])

        # Fit Scaler
        if self.weather_cols_present:
            logger.info(f"Scaler fitted on: {self.weather_cols_present}")
            self.scaler.fit(merged[self.weather_cols_present])
            
        # Fit LabelEncoder if labels are provided
        if self.labels_csv and self.labels_csv.exists():
            labels_df = pd.read_csv(self.labels_csv)
            if 'event_type' in labels_df.columns:
                self.label_encoder.fit(labels_df['event_type'].astype(str))
                logger.info("LabelEncoder fitted.")
            
        logger.info("PreprocessingManager initialized successfully.")
