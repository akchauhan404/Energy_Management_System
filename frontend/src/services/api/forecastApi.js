import { apiRequest, USE_MOCK } from './apiClient';
import { generateMockForecastPoints, mockForecastExplanations } from './mockData';

const MOCK_FORECAST_KEY = 'energy_ai_mock_forecast';

export const forecastApi = {
  async getLatestForecast() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      const stored = localStorage.getItem(MOCK_FORECAST_KEY);
      if (stored) return JSON.parse(stored);

      const points = generateMockForecastPoints();
      const energies = points.map(p => p.predicted_energy_kwh);
      const total = energies.reduce((a, b) => a + b, 0);
      const avg = total / points.length;
      const peak = Math.max(...energies);

      const forecast = {
        id: 'fc-mock-latest',
        model_name: 'Horizon-Specific Multi-Scale Transformer',
        model_version: 'v2.2.0',
        created_at: new Date().toISOString(),
        start_time: points[0].timestamp,
        end_time: points[points.length - 1].timestamp,
        horizon_hours: 24,
        sampling_interval_minutes: 30,
        total_points: 48,
        summary: {
          peak_forecast_kwh: parseFloat(peak.toFixed(3)),
          avg_forecast_kwh: parseFloat(avg.toFixed(3)),
          total_forecast_kwh: parseFloat(total.toFixed(3)),
          horizon_text: '24 hours (48 steps)'
        },
        points,
        explanations: mockForecastExplanations
      };

      localStorage.setItem(MOCK_FORECAST_KEY, JSON.stringify(forecast));
      return forecast;
    }

    try {
      return await apiRequest('/forecast');
    } catch {
      return this.getLatestForecast();
    }
  },

  async generateForecast() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 1200));
      // Re-generate fresh forecast with slight random walk variation
      const points = generateMockForecastPoints();
      const energies = points.map(p => p.predicted_energy_kwh);
      const total = energies.reduce((a, b) => a + b, 0);
      const avg = total / points.length;
      const peak = Math.max(...energies);

      const forecast = {
        id: 'fc-' + Date.now(),
        model_name: 'Horizon-Specific Multi-Scale Transformer',
        model_version: 'v2.2.0',
        created_at: new Date().toISOString(),
        start_time: points[0].timestamp,
        end_time: points[points.length - 1].timestamp,
        horizon_hours: 24,
        sampling_interval_minutes: 30,
        total_points: 48,
        summary: {
          peak_forecast_kwh: parseFloat(peak.toFixed(3)),
          avg_forecast_kwh: parseFloat(avg.toFixed(3)),
          total_forecast_kwh: parseFloat(total.toFixed(3)),
          horizon_text: '24 hours (48 steps)'
        },
        points,
        explanations: mockForecastExplanations
      };

      localStorage.setItem(MOCK_FORECAST_KEY, JSON.stringify(forecast));
      return forecast;
    }

    return await apiRequest('/forecast/generate', { method: 'POST' });
  },

  async getExplanation(forecastId) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return {
        forecastId,
        explanations: mockForecastExplanations,
        disclaimer: 'Feature attribution values computed via Captum Integrated Gradients represent model sensitivity and input weight influence; they do not establish direct physical causality.'
      };
    }
    return await apiRequest(`/forecast/${forecastId}/explanation`);
  }
};
