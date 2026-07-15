"""
====================================================
README: Weather Transformer Encoder (08_Transformer_Encoder)
====================================================
Purpose: Loads the trained WeatherTransformer, accepts preprocessed 
         weather data, and generates a 512-dimensional embedding.
Inputs: training_dataset.csv or preprocessed DataFrame (from DataPreprocessor)
Outputs: transformer_features.csv (Batch) or 512D feature tensor (Single)
Dependencies: torch, pandas, numpy
Example usage:
    python -m ml_pipeline.transformer.transformer_encoder \
        --model_path trained_models/weather_transformer.pth \
        --input_csv data/processed/training_dataset.csv \
        --output_csv data/processed/transformer_features.csv
====================================================
"""
import os
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Union, Tuple
import pandas as pd
import numpy as np
import torch
import torch.nn as nn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WeatherTransformer(nn.Module):
    """Exact PyTorch architecture from Notebook 08"""
    def __init__(self, input_dim: int, d_model: int = 512, nhead: int = 8, layers: int = 2, classes: int = 2):
        super().__init__()
        self.embed = nn.Linear(input_dim, d_model)
        enc = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(enc, num_layers=layers)
        self.classifier = nn.Linear(d_model, classes)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        x = self.embed(x)
        x = x.unsqueeze(1)
        feat = self.transformer(x).squeeze(1)
        out = self.classifier(feat)
        return out, feat

class WeatherTransformerEncoder:
    """
    Wrapper for the WeatherTransformer to generate 512D embeddings.
    """
    WEATHER_COLS = [
        "era5_temp_mean_c", "era5_dewpoint_mean_c", "era5_pressure_mean_pa",
        "era5_u_wind_mean", "era5_v_wind_mean", "era5_precip_sum_mm",
        "era5_runoff_sum_mm", "LST_Day_C"
    ]

    def __init__(self, model_path: Union[str, Path], input_dim: int = 8, classes: int = 2, device: Optional[str] = None):
        """
        Initializes the model and loads weights.
        """
        self.model_path = Path(model_path)
        
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)
            
        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model not found at: {self.model_path}")
            
        self.model = WeatherTransformer(input_dim=input_dim, classes=classes)
        
        logger.info(f"Loading weights from {self.model_path}")
        state = torch.load(self.model_path, map_location='cpu')
        self.model.load_state_dict(state)
        
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"Weather Transformer loaded successfully on {self.device}")

    def transform_single(self, df: pd.DataFrame) -> np.ndarray:
        """
        Accepts a preprocessed DataFrame for a single event and returns a 512D vector.
        """
        # Ensure only the available weather cols are selected
        cols = [c for c in self.WEATHER_COLS if c in df.columns]
        x = df[cols].values
        
        # If there are NaNs because preprocessing failed or was skipped, fill with 0
        x = np.nan_to_num(x, nan=0.0)
        
        tensor_x = torch.tensor(x, dtype=torch.float32).to(self.device)
        
        with torch.no_grad():
            _, feat = self.model(tensor_x)
            
        return feat.squeeze().cpu().numpy()

    def transform_batch(self, df: pd.DataFrame, output_csv: Optional[Union[str, Path]] = None) -> pd.DataFrame:
        """
        Processes a batch DataFrame and optionally saves to CSV.
        """
        cols = [c for c in self.WEATHER_COLS if c in df.columns]
        
        # Notebook 08 uses median imputation natively here just in case:
        X = df[cols].fillna(df[cols].median())
        # Replace any remaining NaNs with 0
        X = X.fillna(0)
        
        x_all = torch.tensor(X.values, dtype=torch.float32).to(self.device)
        
        with torch.no_grad():
            _, feat = self.model(x_all)
            
        feat_np = feat.cpu().numpy()
        
        out = pd.DataFrame(feat_np)
        if "event_id" in df.columns:
            out.insert(0, "event_id", df["event_id"].values)
            
        if output_csv:
            output_csv = Path(output_csv)
            output_csv.parent.mkdir(parents=True, exist_ok=True)
            out.to_csv(output_csv, index=False)
            logger.info(f"Saved {len(out)} transformer features to {output_csv}")
            
        return out


def main():
    parser = argparse.ArgumentParser(description="Extract Weather Transformer features.")
    parser.add_argument(
        "--model_path", 
        type=str, 
        default=os.getenv("TRANSFORMER_MODEL_PATH", "trained_models/weather_transformer.pth"),
        help="Path to trained WeatherTransformer model"
    )
    parser.add_argument(
        "--input_csv", 
        type=str, 
        default=os.getenv("TRAINING_DATASET_CSV", "data/processed/training_dataset.csv"),
        help="Input training dataset CSV"
    )
    parser.add_argument(
        "--output_csv", 
        type=str, 
        default=os.getenv("TRANSFORMER_FEATURES_OUTPUT", "data/processed/transformer_features.csv"),
        help="Output CSV for Transformer features"
    )

    args = parser.parse_args()

    try:
        df = pd.read_csv(args.input_csv)
        cols = [c for c in WeatherTransformerEncoder.WEATHER_COLS if c in df.columns]
        
        encoder = WeatherTransformerEncoder(model_path=args.model_path, input_dim=len(cols))
        encoder.transform_batch(df, output_csv=args.output_csv)
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        exit(1)

if __name__ == "__main__":
    main()
