import { apiRequest } from './apiClient';

export const energyDataApi = {
  async getUploads() {
    const response = await apiRequest('/energy-data');

    return response.uploads || [];
  },

  async getLatestRecords() {
    const response = await apiRequest(
      '/energy-data/latest-records'
    );

    return response.records || [];
  },

  // Server-side CSV upload and validation
  async uploadCsv(file) {
    if (!file) {
      throw new Error('CSV file is required.');
    }

    const formData = new FormData();
    formData.append('file', file);

    return await apiRequest(
      '/energy-data/upload',
      {
        method: 'POST',
        body: formData
      }
    );
  },

  async deleteUpload(id) {
    if (!id) {
      throw new Error('Upload ID is required.');
    }

    return await apiRequest(
      `/energy-data/${id}`,
      {
        method: 'DELETE'
      }
    );
  }
};