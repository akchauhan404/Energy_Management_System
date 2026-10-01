import { apiRequest } from './apiClient';
import { authApi } from './authApi';

export const profileApi = {
  async getProfile() {
    return await authApi.getCurrentUser();
  },

  async updateProfile(updates) {
    return await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
};