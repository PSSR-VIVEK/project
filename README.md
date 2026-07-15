# PFIDS AI Predictor

## Project Overview
A multimodal deep learning architecture designed to predict regional climate extremes (Flash Floods and Heat Waves). The project fuses spatial data (satellite imagery) and temporal meteorological features (ERA5/MODIS data) using a novel Cross Attention Fusion mechanism.

## Architecture
- **CNN Encoder (ResNet18)**: Extracts high-level spatial features from raw satellite images.
- **Weather Transformer**: Captures complex temporal relationships in meteorological variables.
- **Cross Attention Fusion**: Dynamically weights weather signals using visual embeddings as queries.
- **FastAPI Backend**: Orchestrates model inference and data serving.
- **Next.js Frontend**: Enterprise-grade React interface for demonstration and analytics.

## Workflow
1. **Research Phase**: Code developed and validated in Jupyter Notebooks (`notebooks/`).
2. **Production Conversion**: Notebooks converted to modular Python packages (`ml_pipeline/`).
3. **Backend Integration**: FastAPI exposes inference pipelines (`backend/`).
4. **Frontend Delivery**: Next.js provides the UI (`frontend/`).

## Folder Structure
- `notebooks/`: Original research notebooks.
- `ml_pipeline/`: Converted production ML modules.
- `backend/`: FastAPI application.
- `frontend/`: Next.js web application.
- `trained_models/`: PyTorch weight files.
- `data/`: CSV feature and target files.

## Installation
### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
### Frontend
```bash
cd frontend
npm install
```

## Running the Application
Use the provided batch scripts in the root directory:
- `run_backend.bat`: Starts the FastAPI server on port 8000.
- `run_frontend.bat`: Starts the Next.js server on port 3000.
- `run_project.bat`: Starts both servers simultaneously.

## Prediction Guide
1. Open `http://localhost:3000`.
2. Navigate to the **Prediction Engine**.
3. Select an existing historical event ID (e.g., `FLASH_0120`).
4. Click **Predict** to view the pipeline animation and final classification.

## API Endpoints
- `GET /health`: System diagnostics.
- `POST /predict-existing-event`: Runs inference for a historical event.
- `GET /datasets`: Retrieves available dataset metadata.
- `GET /metrics`: Retrieves live performance metrics.

## Dataset Description
- `image_metadata.csv`: GeoTIFF file mappings.
- `era5_features.csv`: Climate reanalysis variables (Temperature, Precipitation).
- `modis_features.csv`: Land surface indices.

## Future Scope
- Expanding geographical coverage beyond the bounding box.
- Integrating Vision Transformers (ViT) for spatial extraction.
- Edge device deployment via federated learning.

## Screenshots
> *(Add presentation screenshots here)*

## Troubleshooting
- **ModuleNotFoundError**: Ensure the `backend/` directory is the current working directory when starting Uvicorn, or `ml_pipeline` is in your `PYTHONPATH`.
- **Model Files Missing**: Verify `.pth` files are stored in `trained_models/` and referenced correctly in `backend/config/settings.py`.
