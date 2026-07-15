"""
====================================================
README: CNN Feature Extraction Module (05C_CNN_Feature_Extraction)
====================================================
Purpose: Loads the trained ResNet18 encoder, removes the classification head, 
         extracts 512D feature vectors for GeoTIFF images, and saves them.
Inputs: Sentinel and Landsat GeoTIFF images, cnn_encoder_resnet18.pth
Outputs: cnn_features.csv containing 512D vectors for each event.
Dependencies: torch, torchvision, rasterio, pandas, numpy, tqdm
Example usage:
    python -m ml_pipeline.cnn.feature_extraction \
        --model_path trained_models/cnn_encoder_resnet18.pth \
        --image_dir data/raw/images \
        --output_csv data/processed/cnn_features.csv
====================================================
"""
import os
import glob
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Union
import numpy as np
import pandas as pd
import rasterio
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import resnet18
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CNNFeatureExtractor:
    """
    Extracts 512-dimensional feature vectors from satellite GeoTIFF 
    images using a fine-tuned ResNet18 encoder.
    """

    def __init__(self, model_path: Union[str, Path], image_size: int = 224, device: Optional[str] = None):
        """
        Initializes the ResNet18 model and loads the pre-trained weights.
        
        Args:
            model_path (str | Path): Path to the trained cnn_encoder_resnet18.pth model.
            image_size (int): Target size for the input image (default: 224).
            device (str): Device to run inference on ('cpu', 'cuda'). Autodetects if None.
        """
        self.model_path = Path(model_path)
        self.image_size = image_size
        
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)
            
        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model not found at: {self.model_path}")
            
        self.encoder = self._build_encoder()
        self.encoder.to(self.device)
        self.encoder.eval()
        logger.info(f"CNN Encoder loaded successfully on {self.device}")

    def _build_encoder(self) -> nn.Module:
        """Constructs the ResNet18 model for 4-channel input and removes the FC layer."""
        model = resnet18(weights=None)
        
        # Modify conv1 for 4 channels (R, G, B, NIR/etc.)
        old = model.conv1
        model.conv1 = nn.Conv2d(
            4,
            old.out_channels,
            kernel_size=old.kernel_size,
            stride=old.stride,
            padding=old.padding,
            bias=False
        )
        
        # Set Temporary FC to match the state dict from training
        # Trained checkpoint uses exactly 2 classes: FLASH, HEAT
        model.fc = nn.Linear(model.fc.in_features, 2)
        
        # Load state dict
        logger.info(f"Loading weights from {self.model_path}")
        state = torch.load(self.model_path, map_location='cpu')
        model.load_state_dict(state)
        
        # Remove the classification layer to extract features (output is 512D)
        encoder = nn.Sequential(*list(model.children())[:-1])
        return encoder

    def preprocess_image(self, image_path: Union[str, Path]) -> torch.Tensor:
        """
        Reads a GeoTIFF image, normalizes, and resizes it.
        
        Args:
            image_path (str | Path): Path to the GeoTIFF image.
            
        Returns:
            torch.Tensor: Preprocessed image tensor ready for inference.
        """
        with rasterio.open(image_path) as src:
            img = src.read().astype(np.float32)
            
        # Normalize by 10000.0 (Standard for Sentinel/Landsat SR)
        img = np.clip(img / 10000.0, 0, 1)
        
        x = torch.from_numpy(img)
        x = F.interpolate(
            x.unsqueeze(0),
            size=(self.image_size, self.image_size),
            mode='bilinear',
            align_corners=False
        )
        return x

    def extract_features(self, image_path: Union[str, Path]) -> np.ndarray:
        """
        Extracts the 512D feature vector for a single image.
        
        Args:
            image_path (str | Path): Path to the image.
            
        Returns:
            np.ndarray: The 512-dimensional feature vector.
        """
        x = self.preprocess_image(image_path).to(self.device)
        with torch.no_grad():
            feat = self.encoder(x).squeeze().cpu().numpy()
        return feat

    def batch_extract(self, image_dir: Union[str, Path], output_csv: Union[str, Path]) -> None:
        """
        Processes an entire directory of images and saves the features to a CSV.
        
        Args:
            image_dir (str | Path): Root directory containing Sentinel and Landsat subfolders or GeoTIFFs.
            output_csv (str | Path): Path to save the extracted features CSV.
        """
        image_dir = Path(image_dir)
        output_csv = Path(output_csv)
        output_csv.parent.mkdir(parents=True, exist_ok=True)
        
        files_list = glob.glob(str(image_dir / 'Sentinel' / '*.tif'))
        files_list += glob.glob(str(image_dir / 'Landsat' / '*.tif'))
        
        # Fallback if flat structure
        if not files_list:
            files_list = glob.glob(str(image_dir / '*.tif'))

        if not files_list:
            logger.warning(f"No .tif files found in {image_dir}")
            return
            
        logger.info(f"Found {len(files_list)} images to process.")
        rows = []
        
        for fp in tqdm(files_list, desc="Extracting CNN Features"):
            try:
                feat = self.extract_features(fp)
                row = {"event_id": os.path.splitext(os.path.basename(fp))[0]}
                for i, v in enumerate(feat):
                    row[f"feature_{i+1}"] = float(v)
                rows.append(row)
            except Exception as e:
                logger.error(f"Failed to process {fp}: {e}")
                
        if rows:
            df = pd.DataFrame(rows)
            df.to_csv(output_csv, index=False)
            logger.info(f"Successfully saved {len(rows)} feature vectors to {output_csv}")
        else:
            logger.warning("No features extracted.")

def main():
    parser = argparse.ArgumentParser(description="Extract CNN features from GeoTIFFs.")
    parser.add_argument(
        "--model_path", 
        type=str, 
        default=os.getenv("CNN_MODEL_PATH", "trained_models/cnn_encoder_resnet18.pth"),
        help="Path to trained ResNet18 model"
    )
    parser.add_argument(
        "--image_dir", 
        type=str, 
        default=os.getenv("IMAGE_DIR", "data/raw/images"),
        help="Directory containing Sentinel/Landsat images"
    )
    parser.add_argument(
        "--output_csv", 
        type=str, 
        default=os.getenv("CNN_FEATURES_OUTPUT", "data/processed/cnn_features.csv"),
        help="Output CSV for CNN features"
    )

    args = parser.parse_args()

    try:
        extractor = CNNFeatureExtractor(model_path=args.model_path)
        extractor.batch_extract(image_dir=args.image_dir, output_csv=args.output_csv)
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        exit(1)

if __name__ == "__main__":
    main()
