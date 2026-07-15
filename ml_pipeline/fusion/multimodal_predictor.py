"""
====================================================
README: Multimodal Predictor (09_Cross_Attention_Fusion_v2)
====================================================
Purpose: Fuses CNN and Transformer embeddings using Cross-Attention to
         predict FLASH or HEAT events. Completely independent of data
         loading/preprocessing.
Inputs: 512D CNN embedding, 512D Transformer embedding
Outputs: Dictionary containing Predicted Class, Probabilities, Confidence, etc.
Dependencies: torch, numpy, time
Example usage:
    predictor = MultimodalPredictor(model_path="trained_models/multimodal_model.pth")
    predictor.initialize()
    result = predictor.predict(cnn_feat, tr_feat)
====================================================
"""
import os
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
import numpy as np
import torch
import torch.nn as nn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FusionModel(nn.Module):
    """Exact PyTorch architecture from Notebook 09."""
    def __init__(self, dim: int = 512, ncls: int = 2):
        super().__init__()
        self.attn = nn.MultiheadAttention(dim, 8, batch_first=True)
        self.head = nn.Sequential(
            nn.Linear(dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, ncls)
        )

    def forward(self, cnn: torch.Tensor, tr: torch.Tensor) -> torch.Tensor:
        out, _ = self.attn(cnn.unsqueeze(1), tr.unsqueeze(1), tr.unsqueeze(1))
        return self.head(out.squeeze(1))

class MultimodalPredictor:
    """
    Production wrapper for the FusionModel.
    Handles inference for single and batch samples independently of data pipelines.
    """
    
    # Scikit-learn LabelEncoder sorts alphabetically
    CLASSES = ["FLASH", "HEAT"]

    def __init__(self, model_path: Union[str, Path], dim: int = 512, device: Optional[str] = None):
        self.model_path = Path(model_path)
        self.dim = dim
        self.is_initialized = False
        
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)
            
        self.model: Optional[FusionModel] = None

    def initialize(self) -> None:
        """Loads the model weights into memory exactly once."""
        if self.is_initialized:
            logger.warning("MultimodalPredictor is already initialized.")
            return
            
        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model not found at: {self.model_path}")

        self.model = FusionModel(dim=self.dim, ncls=len(self.CLASSES))
        
        logger.info(f"Loading weights from {self.model_path}")
        state = torch.load(self.model_path, map_location='cpu')
        self.model.load_state_dict(state)
        
        self.model.to(self.device)
        self.model.eval()
        self.is_initialized = True
        logger.info(f"Multimodal Predictor initialized successfully on {self.device}")

    def predict_single(self, cnn_emb: np.ndarray, tr_emb: np.ndarray) -> Dict[str, Any]:
        """Runs inference on a single event."""
        if not self.is_initialized or self.model is None:
            raise RuntimeError("Predictor not initialized. Call initialize() first.")
            
        start_time = time.time()
        
        c = torch.tensor(cnn_emb, dtype=torch.float32).unsqueeze(0).to(self.device)
        t = torch.tensor(tr_emb, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            logits = self.model(c, t)
            probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
            
        inference_time = (time.time() - start_time) * 1000 # ms
        
        pred_idx = int(np.argmax(probs))
        confidence = float(np.max(probs))
        predicted_class = self.CLASSES[pred_idx]
        
        return {
            "Predicted Class": predicted_class,
            "Prediction Index": pred_idx,
            "FLASH Probability": float(probs[0]),
            "HEAT Probability": float(probs[1]),
            "Confidence": confidence,
            "Raw Logits": logits.squeeze(0).cpu().numpy().tolist(),
            "Inference Time": f"{inference_time:.2f} ms"
        }

    def predict_batch(self, cnn_batch: np.ndarray, tr_batch: np.ndarray) -> List[Dict[str, Any]]:
        """Runs inference on a batch of events."""
        if not self.is_initialized or self.model is None:
            raise RuntimeError("Predictor not initialized. Call initialize() first.")
            
        start_time = time.time()
        
        c = torch.tensor(cnn_batch, dtype=torch.float32).to(self.device)
        t = torch.tensor(tr_batch, dtype=torch.float32).to(self.device)
        
        with torch.no_grad():
            logits = self.model(c, t)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
            
        inference_time = (time.time() - start_time) * 1000 # ms
        
        results = []
        for i in range(len(probs)):
            p = probs[i]
            l = logits[i].cpu().numpy()
            pred_idx = int(np.argmax(p))
            results.append({
                "Predicted Class": self.CLASSES[pred_idx],
                "Prediction Index": pred_idx,
                "FLASH Probability": float(p[0]),
                "HEAT Probability": float(p[1]),
                "Confidence": float(np.max(p)),
                "Raw Logits": l.tolist(),
                "Inference Time": f"{inference_time / len(probs):.2f} ms per sample"
            })
            
        return results

    def predict(self, cnn_emb: np.ndarray, tr_emb: np.ndarray) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """Automatic routing between single and batch based on dimensions."""
        if cnn_emb.ndim == 1:
            return self.predict_single(cnn_emb, tr_emb)
        else:
            return self.predict_batch(cnn_emb, tr_emb)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", type=str, default=os.getenv("MULTIMODAL_MODEL_PATH", "trained_models/multimodal_model.pth"))
    args = parser.parse_args()
    
    # Demo validation logic
    predictor = MultimodalPredictor(model_path=args.model_path)
    try:
        predictor.initialize()
        dummy_cnn = np.random.rand(512).astype(np.float32)
        dummy_tr = np.random.rand(512).astype(np.float32)
        res = predictor.predict(dummy_cnn, dummy_tr)
        logger.info(f"Test Prediction: {res}")
    except Exception as e:
        logger.error(f"Failed to initialize or predict: {e}")
