import axios from 'axios';
import { HealthResponse, PredictionRequest, PredictionResponse, DatasetsResponse, MetricsResponse, ArchitectureResponse, PipelineResponse, ModelsResponse } from '@/types/api';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  checkHealth: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get('/health');
    return data;
  },
  predictExistingEvent: async (payload: PredictionRequest): Promise<PredictionResponse> => {
    const { data } = await apiClient.post('/predict-existing-event', payload);
    return data;
  },
  getEvents: async (): Promise<{ total_events: number, event_ids: string[] }> => {
    const { data } = await apiClient.get('/events');
    return data;
  },
  getDatasets: async (): Promise<DatasetsResponse> => {
    const { data } = await apiClient.get('/datasets');
    return data;
  },
  getMetrics: async (): Promise<MetricsResponse> => {
    const { data } = await apiClient.get('/metrics');
    return data;
  },
  getArchitecture: async (): Promise<ArchitectureResponse> => {
    const { data } = await apiClient.get('/architecture');
    return data;
  },
  getPipeline: async (): Promise<PipelineResponse> => {
    const { data } = await apiClient.get('/pipeline');
    return data;
  },
  getModels: async (): Promise<ModelsResponse> => {
    const { data } = await apiClient.get('/models');
    return data;
  }
};
