export interface HealthResponse {
  status: string;
  version: string;
  model_manager: string;
}

export interface PredictionRequest {
  event_id: string;
}

export interface PredictionResponse {
  "Predicted Class": string;
  "Prediction Index": number;
  "FLASH Probability": number;
  "HEAT Probability": number;
  "Confidence": number;
  "Raw Logits": number[];
  "Inference Time": string;
}

export interface DatasetInfo {
  status: string;
  event_count: number;
}

export interface DatasetsResponse {
  datasets: Record<string, DatasetInfo>;
  csv_directory: string;
}

export interface MetricsResponse {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface ArchitectureResponse {
  project: string;
  loaded_modules: string[];
  execution_order: string;
}

export interface PipelineResponse {
  pipeline_stages: string[];
}

export interface ModelsResponse {
  loaded_models: string[];
  device: string;
  status: string;
}
