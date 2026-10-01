import { apiRequest } from './apiClient';

export const adminApi = {
  async getDatasets() {
    return await apiRequest('/admin/datasets');
  },

  async getModels() {
    return await apiRequest('/admin/models');
  },

  async getTrainingRuns() {
    return await apiRequest('/admin/training-runs');
  },

  async getForecastPerformance() {
    return await apiRequest(
      '/admin/forecast-performance'
    );
  },

  async getPPOPerformance() {
    return await apiRequest(
      '/admin/ppo-performance'
    );
  },

  async startForecastTraining(datasetVersionId) {
    return await apiRequest(
      '/admin/training/forecast',
      {
        method: 'POST',
        body: JSON.stringify({
          datasetVersionId
        })
      }
    );
  }
};