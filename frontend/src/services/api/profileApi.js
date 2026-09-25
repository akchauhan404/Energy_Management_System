import { apiRequest, USE_MOCK } from './apiClient';
import { authApi } from './authApi';

export const profileApi = {
  async getProfile() {
    return await authApi.getCurrentUser();
  },

  async updateProfile(updates) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      const current = await authApi.getCurrentUser();
      const updated = {
        ...current,
        ...updates,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('energy_ai_mock_user', JSON.stringify(updated));
      return updated;
    }
    return await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
};
