import os
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import pandas as pd
from tqdm import tqdm

try:
    import ee
except ImportError:
    ee = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SatelliteMetadataCollector:
    """
    Collects metadata for satellite imagery from Google Earth Engine 
    for specified geographical events.
    """

    def __init__(self, project_id: str = "heatwave-flood-prediction"):
        """
        Initializes the collector and authenticates with GEE.
        
        Args:
            project_id (str): The Google Cloud project ID for Earth Engine.
        """
        if ee is None:
            raise ImportError("The 'earthengine-api' package is not installed.")
            
        self.project_id = project_id
        self._initialize_ee()

    def _initialize_ee(self) -> None:
        """Initializes Google Earth Engine."""
        try:
            logger.info(f"Initializing Earth Engine with project: {self.project_id}")
            ee.Initialize(project=self.project_id)
        except Exception as e:
            logger.warning(f"Failed to initialize Earth Engine: {e}")
            logger.info("Attempting to authenticate...")
            try:
                # ee.Authenticate() usually requires browser interaction
                # In a local script, the user should run `earthengine authenticate` in the CLI beforehand.
                logger.error("Please run 'earthengine authenticate' in your terminal before running this script.")
                raise e
            except Exception as auth_e:
                logger.error(f"Authentication failed: {auth_e}")
                raise auth_e

    def fetch_metadata(self, input_csv: str | Path, output_dir: str | Path) -> Tuple[Path, Path]:
        """
        Reads input events, queries GEE for satellite images within 5 days prior,
        and saves the resulting metadata and skipped events.
        
        Args:
            input_csv (str | Path): Path to the input CSV containing event data.
            output_dir (str | Path): Directory to save the output CSVs.
            
        Returns:
            Tuple[Path, Path]: Paths to the metadata CSV and skipped events CSV.
        """
        input_csv = Path(input_csv)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        metadata_path = output_dir / "image_metadata.csv"
        skipped_path = output_dir / "skipped_events.csv"

        logger.info(f"Reading input events from {input_csv}")
        df = pd.read_csv(input_csv)
        
        metadata: List[Dict] = []
        skipped: List[Dict] = []

        logger.info(f"Processing {len(df)} events...")
        for _, row in tqdm(df.iterrows(), total=len(df)):
            event_id = row.get("event_id")
            event_date = row.get("event_start_date")
            lat = row.get("center_lat")
            lon = row.get("center_lon")

            if not all([event_id, event_date, pd.notnull(lat), pd.notnull(lon)]):
                skipped.append({
                    "event_id": event_id,
                    "event_date": event_date,
                    "reason": "Missing required coordinate or date data."
                })
                continue

            point = ee.Geometry.Point([lon, lat])
            start = ee.Date(event_date).advance(-5, "day")
            end = ee.Date(event_date)

            try:
                # Try Sentinel-2 first
                s2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                      .filterBounds(point)
                      .filterDate(start, end)
                      .sort("system:time_start", False))

                if s2.size().getInfo() > 0:
                    img = ee.Image(s2.first())
                    metadata.append({
                        "event_id": event_id,
                        "event_date": event_date,
                        "satellite": "Sentinel-2",
                        "image_date": ee.Date(img.get("system:time_start")).format("YYYY-MM-dd").getInfo(),
                        "latitude": lat,
                        "longitude": lon
                    })
                    continue

                # Fallback to Landsat
                year = pd.to_datetime(event_date).year
                if year <= 2021:
                    ls = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
                else:
                    ls = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2").merge(
                        ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
                    )

                ls = (ls.filterBounds(point)
                      .filterDate(start, end)
                      .sort("system:time_start", False))

                if ls.size().getInfo() > 0:
                    img = ee.Image(ls.first())
                    metadata.append({
                        "event_id": event_id,
                        "event_date": event_date,
                        "satellite": "Landsat",
                        "image_date": ee.Date(img.get("system:time_start")).format("YYYY-MM-dd").getInfo(),
                        "latitude": lat,
                        "longitude": lon
                    })
                else:
                    skipped.append({
                        "event_id": event_id,
                        "event_date": event_date,
                        "reason": "No image within previous 5 days"
                    })
            except Exception as e:
                skipped.append({
                    "event_id": event_id,
                    "event_date": event_date,
                    "reason": str(e)
                })

        # Save to CSV
        pd.DataFrame(metadata).to_csv(metadata_path, index=False)
        pd.DataFrame(skipped).to_csv(skipped_path, index=False)
        
        logger.info(f"Saved {len(metadata)} metadata records to {metadata_path}")
        logger.info(f"Saved {len(skipped)} skipped records to {skipped_path}")
        
        return metadata_path, skipped_path


def main():
    parser = argparse.ArgumentParser(description="Collect satellite metadata from GEE.")
    parser.add_argument(
        "--input_csv", 
        type=str, 
        required=True,
        help="Path to the input CSV with event_id, event_start_date, center_lat, center_lon"
    )
    parser.add_argument(
        "--output_dir", 
        type=str, 
        default="data/raw",
        help="Directory to save output CSVs (default: data/raw)"
    )
    parser.add_argument(
        "--project_id", 
        type=str, 
        default="heatwave-flood-prediction",
        help="GEE Project ID"
    )

    args = parser.parse_args()

    collector = SatelliteMetadataCollector(project_id=args.project_id)
    collector.fetch_metadata(input_csv=args.input_csv, output_dir=args.output_dir)


if __name__ == "__main__":
    main()
