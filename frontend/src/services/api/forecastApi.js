import { apiRequest } from './apiClient';

export const forecastApi = {
  async getLatestForecast() {
    const response = await apiRequest('/forecast');

    return response.forecast;
  },

  async generateForecast() {
    const response = await apiRequest(
      '/forecast/generate',
      {
        method: 'POST'
      }
    );

    return response.forecast;
  },

  async getExplanation(forecastId) {
    const response = await apiRequest(
      `/forecast/${forecastId}/explanation`
    );

    return response;
  }
};