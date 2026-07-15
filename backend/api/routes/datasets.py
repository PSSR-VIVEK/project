from fastapi import APIRouter
import pandas as pd
from backend.config.settings import settings

router = APIRouter(tags=["Datasets"])

@router.get("/datasets")
async def get_datasets():
    """Returns available datasets and their basic summary."""
    datasets_info = {}
    
    try:
        df = pd.read_csv(settings.CNN_FEATURES_CSV)
        event_count = len(df["event_id"].unique())
        datasets_info["cnn_features"] = {
            "status": "Available",
            "event_count": event_count
        }
    except Exception:
        datasets_info["cnn_features"] = {"status": "Missing", "event_count": 0}

    try:
        df = pd.read_csv(settings.TRANSFORMER_FEATURES_CSV)
        event_count = len(df["event_id"].unique())
        datasets_info["transformer_features"] = {
            "status": "Available",
            "event_count": event_count
        }
    except Exception:
        datasets_info["transformer_features"] = {"status": "Missing", "event_count": 0}

    return {
        "datasets": datasets_info,
        "csv_directory": str(settings.CNN_FEATURES_CSV.parent)
    }

@router.get("/events")
async def get_events():
    """Returns a list of event IDs that exist in BOTH the CNN and Transformer feature files."""
    try:
        cnn = pd.read_csv(settings.CNN_FEATURES_CSV)
        tr = pd.read_csv(settings.TRANSFORMER_FEATURES_CSV)

        # CNN dataset uses _Sentinel-2 suffix, strip it for matching
        cnn_events = set(cnn['event_id'].astype(str).str.replace('_Sentinel-2', '', regex=False))
        tr_events = set(tr['event_id'].astype(str))

        # Compute intersection of the two datasets the pipeline actually uses
        valid_events = cnn_events.intersection(tr_events)
        
        # Sort alphanumerically
        sorted_events = sorted(list(valid_events))

        return {
            "total_events": len(sorted_events),
            "event_ids": sorted_events
        }
    except Exception as e:
        return {"total_events": 0, "event_ids": [], "error": str(e)}
