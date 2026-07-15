"""
====================================================
README: Image Download Module (02_Image_Download)
====================================================
Purpose: Creates Google Earth Engine export tasks or downloads images locally from image_metadata.csv.
Inputs: image_metadata.csv
Outputs: GeoTIFF images exported to Google Drive (FloodProject folder) OR downloaded to a local folder.
Dependencies: earthengine-api, geemap, pandas, tqdm
Example usage:
    # Mode 1: Export to Drive
    python -m ml_pipeline.preprocessing.image_download --input_csv data/raw/image_metadata.csv --mode drive
    
    # Mode 2: Download Local
    python -m ml_pipeline.preprocessing.image_download --input_csv data/raw/image_metadata.csv --mode local --local_dir data/raw/images
====================================================
"""
import os
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Optional
import pandas as pd
from tqdm import tqdm

try:
    import ee
    import geemap
except ImportError:
    ee = None
    geemap = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ImageDownloader:
    """
    Creates Google Earth Engine export tasks to download satellite 
    GeoTIFF images to Google Drive, or downloads them directly to a local folder,
    based on event metadata.
    """

    def __init__(self, project_id: str = "heatwave-flood-prediction"):
        if ee is None or geemap is None:
            raise ImportError("The 'earthengine-api' and 'geemap' packages are required.")
            
        self.project_id = project_id
        self._initialize_ee()

    def _initialize_ee(self) -> None:
        try:
            logger.info(f"Initializing Earth Engine with project: {self.project_id}")
            ee.Initialize(project=self.project_id)
        except Exception as e:
            logger.warning(f"Failed to initialize Earth Engine: {e}")
            logger.info("Attempting to authenticate...")
            try:
                logger.error("Please run 'earthengine authenticate' in your terminal before running this script.")
                raise e
            except Exception as auth_e:
                logger.error(f"Authentication failed: {auth_e}")
                raise auth_e

    def _get_image_and_params(self, row: pd.Series, buffer_meters: int, sentinel_scale: int, landsat_scale: int):
        event_id = row.get("event_id")
        sat = row.get("satellite")
        image_date = row.get("image_date")
        lat = row.get("latitude")
        lon = row.get("longitude")

        if not all([event_id, sat, image_date, pd.notnull(lat), pd.notnull(lon)]):
            return None

        point = ee.Geometry.Point([lon, lat])
        region = point.buffer(buffer_meters).bounds()

        start = ee.Date(image_date)
        end = start.advance(1, "day")

        if sat == "Sentinel-2":
            image = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                   .filterBounds(point)
                   .filterDate(start, end)
                   .first())
            scale = sentinel_scale
            folder = "Sentinel"
        else:
            image = (ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
                   .merge(ee.ImageCollection("LANDSAT/LC09/C02/T1_L2"))
                   .filterBounds(point)
                   .filterDate(start, end)
                   .first())
            scale = landsat_scale
            folder = "Landsat"
            
        return image, region, scale, folder, event_id

    def create_drive_export_tasks(
        self, 
        input_csv: str | Path, 
        export_folder: str = "FloodProject", 
        buffer_meters: int = 2500,
        sentinel_scale: int = 10,
        landsat_scale: int = 30
    ) -> None:
        """Mode 1: Generates GEE toDrive export tasks (Original Behavior)."""
        input_csv = Path(input_csv)
        if not input_csv.exists():
            raise FileNotFoundError(f"Input CSV not found: {input_csv}")

        logger.info(f"Reading image metadata from {input_csv}")
        df = pd.read_csv(input_csv)
        
        logger.info(f"Creating Drive export tasks for {len(df)} images...")
        for _, row in tqdm(df.iterrows(), total=len(df)):
            params = self._get_image_and_params(row, buffer_meters, sentinel_scale, landsat_scale)
            if not params:
                logger.warning(f"Skipping row due to missing data: {row}")
                continue
                
            image, region, scale, sub_folder, event_id = params
            full_folder = f"{export_folder}/{sub_folder}"

            try:
                task = ee.batch.Export.image.toDrive(
                    image=image,
                    description=event_id,
                    folder=full_folder,
                    fileNamePrefix=event_id,
                    region=region,
                    scale=scale,
                    maxPixels=1e13,
                    fileFormat="GeoTIFF"
                )
                task.start()
                logger.debug(f"Started Drive export task for: {event_id}")
            except Exception as e:
                logger.error(f"Failed to start export task for {event_id}: {e}")

        logger.info("Finished creating export tasks. Check Google Earth Engine Tasks tab online.")

    def download_local(
        self, 
        input_csv: str | Path, 
        local_dir: str | Path,
        buffer_meters: int = 2500,
        sentinel_scale: int = 10,
        landsat_scale: int = 30
    ) -> None:
        """Mode 2: Downloads images directly to a local folder (Local Backend App Behavior)."""
        input_csv = Path(input_csv)
        local_dir = Path(local_dir)
        local_dir.mkdir(parents=True, exist_ok=True)
        
        if not input_csv.exists():
            raise FileNotFoundError(f"Input CSV not found: {input_csv}")

        logger.info(f"Reading image metadata from {input_csv}")
        df = pd.read_csv(input_csv)
        
        logger.info(f"Downloading images locally to {local_dir}...")
        for _, row in tqdm(df.iterrows(), total=len(df)):
            params = self._get_image_and_params(row, buffer_meters, sentinel_scale, landsat_scale)
            if not params:
                logger.warning(f"Skipping row due to missing data: {row}")
                continue
                
            image, region, scale, sub_folder, event_id = params
            out_folder = local_dir / sub_folder
            out_folder.mkdir(parents=True, exist_ok=True)
            out_path = out_folder / f"{event_id}.tif"
            
            if out_path.exists():
                logger.info(f"File already exists: {out_path}, skipping.")
                continue

            try:
                geemap.ee_export_image(
                    image, 
                    filename=str(out_path), 
                    scale=scale, 
                    region=region, 
                    file_per_band=False
                )
                logger.debug(f"Downloaded local image for: {event_id}")
            except Exception as e:
                logger.error(f"Failed to download local image for {event_id}: {e}")

        logger.info(f"Finished downloading local images to {local_dir}")


def main():
    parser = argparse.ArgumentParser(description="Create GEE export tasks or download locally.")
    parser.add_argument("--input_csv", type=str, required=True, help="Path to input metadata CSV")
    parser.add_argument("--mode", type=str, choices=["drive", "local"], default="drive", help="Download mode")
    parser.add_argument("--project_id", type=str, default=os.getenv("GEE_PROJECT_ID", "heatwave-flood-prediction"), help="GEE Project ID")
    parser.add_argument("--export_folder", type=str, default=os.getenv("GEE_EXPORT_FOLDER", "FloodProject"), help="Google Drive folder (drive mode)")
    parser.add_argument("--local_dir", type=str, default=os.getenv("GEE_LOCAL_DIR", "data/raw/images"), help="Local directory (local mode)")

    args = parser.parse_args()

    try:
        downloader = ImageDownloader(project_id=args.project_id)
        if args.mode == "drive":
            downloader.create_drive_export_tasks(input_csv=args.input_csv, export_folder=args.export_folder)
        elif args.mode == "local":
            downloader.download_local(input_csv=args.input_csv, local_dir=args.local_dir)
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        exit(1)

if __name__ == "__main__":
    main()
