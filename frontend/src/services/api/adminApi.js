import { apiRequest, USE_MOCK } from './apiClient';
import {
  mockAdminDatasets,
  mockAdminModels,
  mockAdminTrainingRuns,
  forecastPerformanceTable,
  ppoPerformanceData
} from './mockData';

export const adminApi = {
  async getDatasets() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return mockAdminDatasets;
    }
    try {
      return await apiRequest('/admin/datasets');
    } catch {
      return mockAdminDatasets;
    }
  },

  async getModels() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return mockAdminModels;
    }
    try {
      return await apiRequest('/admin/models');
    } catch {
      return mockAdminModels;
    }
  },

  async getTrainingRuns() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return mockAdminTrainingRuns;
    }
    try {
      return await apiRequest('/admin/training-runs');
    } catch {
      return mockAdminTrainingRuns;
    }
  },

  async getForecastPerformance() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return {
        benchmarks: forecastPerformanceTable,
        evaluationContext: 'Evaluated on held-out 48-step 24-hour test horizon from Low Carbon London (LCL) dataset.',
        primaryModelMetrics: {
          name: 'Horizon-Specific Multi-Scale Transformer',
          mae: 61.7247,
          rmse: 89.4116,
          mape: '5.1582%',
          smape: '5.0044%',
          r2: 0.9505
        },
        gruBenchmarkMetrics: {
          name: 'GRU Benchmark',
          mae: 53.2501,
          rmse: 76.4766,
          mape: '4.5065%',
          smape: '4.4419%',
          r2: 0.9638
        }
      };
    }
    try {
      return await apiRequest('/admin/forecast-performance');
    } catch {
      return this.getForecastPerformance();
    }
  },

  async getPPOPerformance() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return ppoPerformanceData;
    }
    try {
      return await apiRequest('/admin/ppo-performance');
    } catch {
      return ppoPerformanceData;
    }
  },

  async startForecastTraining(datasetVersionId) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 1000));
      return {
        runId: 'run-' + Date.now(),
        status: 'QUEUED',
        message: `Approved training workflow queued for dataset version ${datasetVersionId}. Model architecture: Horizon-Specific Multi-Scale Transformer.`
      };
    }
    return await apiRequest('/admin/training/forecast', {
      method: 'POST',
      body: JSON.stringify({ datasetVersionId })
    });
  }
};
