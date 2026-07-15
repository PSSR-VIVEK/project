"""
====================================================
README: Data Preprocessing Module (07_Data_Preprocessing)
====================================================
Purpose: Merges CNN, ERA5, and MODIS features. Handles missing data imputation 
         (median) and standard scaling for weather variables.
Inputs: cnn_features.csv, era5_features.csv, modis_features.csv
Outputs: training_dataset.csv (Batch Mode) or processed dictionary (Single Mode)
Dependencies: pandas, scikit-learn, numpy
Example usage:
    # Batch Mode (Reproduces Notebook 07)
    python -m ml_pipeline.preprocessing.data_preprocessing \
        --cnn_csv data/processed/cnn_features.csv \
        --era5_csv data/processed/era5_features.csv \
        --modis_csv data/processed/modis_features.csv \
        --output_csv data/processed/training_dataset.csv
====================================================
"""
import os
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Union
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataPreprocessor:
    """
    Handles merging and preprocessing of multimodal features (CNN, ERA5, MODIS).
    Fits imputer and scaler on the historical dataset to ensure consistency 
    for both batch processing and single-sample inference.
    """
    
    # Weather columns to scale (exact match from Notebook 07/08)
    WEATHER_COLS = [
        'era5_temp_mean_c', 'era5_dewpoint_mean_c', 'era5_pressure_mean_pa',
        'era5_u_wind_mean', 'era5_v_wind_mean', 'era5_precip_sum_mm',
        'era5_runoff_sum_mm', 'LST_Day_C'
    ]

    def __init__(
        self, 
        cnn_csv: Union[str, Path], 
        era5_csv: Union[str, Path], 
        modis_csv: Union[str, Path]
    ):
        """
        Initializes the preprocessor by loading the historical dataset 
        and fitting the SimpleImputer and StandardScaler in memory.
        
        Args:
            cnn_csv (str | Path): Path to historical cnn_features.csv
            era5_csv (str | Path): Path to historical era5_features.csv
            modis_csv (str | Path): Path to historical modis_features.csv
        """
        self.cnn_csv = Path(cnn_csv)
        self.era5_csv = Path(era5_csv)
        self.modis_csv = Path(modis_csv)
        
        self.imputer = SimpleImputer(strategy='median')
        self.scaler = StandardScaler()
        
        self.numerical_cols = []
        self.weather_cols_present = []
        
        self._fit_preprocessors()

    def _fit_preprocessors(self) -> None:
        """Loads historical data, merges it, and fits the imputer and scaler."""
        logger.info("Loading historical data to fit preprocessors in memory...")
        
        if not all([self.cnn_csv.exists(), self.era5_csv.exists(), self.modis_csv.exists()]):
            logger.warning("Historical CSVs not found. Preprocessors are uninitialized. (Only safe if processing the batch directly)")
            return

        cnn = pd.read_csv(self.cnn_csv)
        era5 = pd.read_csv(self.era5_csv)
        modis = pd.read_csv(self.modis_csv)

        # Merge matching notebook logic
        for df in [cnn, era5, modis]:
            df['event_id'] = df['event_id'].astype(str)

        era5 = era5.drop(columns=['image_date'], errors='ignore')
        modis = modis.drop(columns=['image_date'], errors='ignore')

        merged = cnn.merge(era5, on='event_id', how='left')
        merged = merged.merge(modis, on='event_id', how='left')
        merged = merged.drop_duplicates(subset='event_id')

        # Fit Imputer
        self.numerical_cols = merged.select_dtypes(include='number').columns.tolist()
        if self.numerical_cols:
            self.imputer.fit(merged[self.numerical_cols])

        # Fit Scaler
        self.weather_cols_present = [c for c in self.WEATHER_COLS if c in merged.columns]
        if self.weather_cols_present:
            self.scaler.fit(merged[self.weather_cols_present])
            
        logger.info("Imputer and Scaler fitted successfully on historical data.")

    def process_batch(self, output_csv: Union[str, Path]) -> None:
        """
        Processes the historical dataset and saves it to a CSV.
        Exactly replicates the Notebook 07 output.
        
        Args:
            output_csv (str | Path): Path to save training_dataset.csv
        """
        logger.info("Processing batch data...")
        cnn = pd.read_csv(self.cnn_csv)
        era5 = pd.read_csv(self.era5_csv)
        modis = pd.read_csv(self.modis_csv)

        for df in [cnn, era5, modis]:
            df['event_id'] = df['event_id'].astype(str)

        era5 = era5.drop(columns=['image_date'], errors='ignore')
        modis = modis.drop(columns=['image_date'], errors='ignore')

        merged = cnn.merge(era5, on='event_id', how='left')
        merged = merged.merge(modis, on='event_id', how='left')
        merged = merged.drop_duplicates(subset='event_id')

        # Transform using pre-fitted imputer
        if self.numerical_cols:
            merged[self.numerical_cols] = self.imputer.transform(merged[self.numerical_cols])

        # Transform using pre-fitted scaler
        if self.weather_cols_present:
            merged[self.weather_cols_present] = self.scaler.transform(merged[self.weather_cols_present])

        output_path = Path(output_csv)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        merged.to_csv(output_path, index=False)
        logger.info(f"Saved batch processed dataset ({merged.shape}) to {output_path}")

    def process_single(self, cnn_feat: Dict, era5_feat: Dict, modis_feat: Dict) -> pd.DataFrame:
        """
        Processes a single event for real-time inference.
        
        Args:
            cnn_feat (Dict): Dictionary of CNN features (feature_1...feature_512, event_id)
            era5_feat (Dict): Dictionary of ERA5 features
            modis_feat (Dict): Dictionary of MODIS features
            
        Returns:
            pd.DataFrame: A single-row DataFrame processed and scaled for the Transformer.
        """
        cnn = pd.DataFrame([cnn_feat])
        era5 = pd.DataFrame([era5_feat])
        modis = pd.DataFrame([modis_feat])

        for df in [cnn, era5, modis]:
            if 'event_id' in df.columns:
                df['event_id'] = df['event_id'].astype(str)

        era5 = era5.drop(columns=['image_date'], errors='ignore')
        modis = modis.drop(columns=['image_date'], errors='ignore')

        merged = cnn
        if 'event_id' in merged.columns and 'event_id' in era5.columns:
            merged = merged.merge(era5, on='event_id', how='left')
        elif not era5.empty:
            merged = pd.concat([merged, era5], axis=1)

        if 'event_id' in merged.columns and 'event_id' in modis.columns:
            merged = merged.merge(modis, on='event_id', how='left')
        elif not modis.empty:
            merged = pd.concat([merged, modis], axis=1)

        # Apply Imputer
        if self.numerical_cols:
            # Add missing columns with NaNs to ensure imputer shape matches
            for col in self.numerical_cols:
                if col not in merged.columns:
                    merged[col] = np.nan
            merged[self.numerical_cols] = self.imputer.transform(merged[self.numerical_cols])

        # Apply Scaler
        if self.weather_cols_present:
            for col in self.weather_cols_present:
                if col not in merged.columns:
                    merged[col] = np.nan
            merged[self.weather_cols_present] = self.scaler.transform(merged[self.weather_cols_present])

        return merged

def main():
    parser = argparse.ArgumentParser(description="Data Preprocessing for Multimodal Framework")
    parser.add_argument(
        "--cnn_csv", 
        type=str, 
        default=os.getenv("CNN_FEATURES_CSV", "data/processed/cnn_features.csv"),
        help="Path to cnn_features.csv"
    )
    parser.add_argument(
        "--era5_csv", 
        type=str, 
        default=os.getenv("ERA5_FEATURES_CSV", "data/processed/era5_features.csv"),
        help="Path to era5_features.csv"
    )
    parser.add_argument(
        "--modis_csv", 
        type=str, 
        default=os.getenv("MODIS_FEATURES_CSV", "data/processed/modis_features.csv"),
        help="Path to modis_features.csv"
    )
    parser.add_argument(
        "--output_csv", 
        type=str, 
        default=os.getenv("TRAINING_DATASET_CSV", "data/processed/training_dataset.csv"),
        help="Output path for training_dataset.csv"
    )

    args = parser.parse_args()

    try:
        preprocessor = DataPreprocessor(
            cnn_csv=args.cnn_csv,
            era5_csv=args.era5_csv,
            modis_csv=args.modis_csv
        )
        preprocessor.process_batch(output_csv=args.output_csv)
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        exit(1)

if __name__ == "__main__":
    main()
