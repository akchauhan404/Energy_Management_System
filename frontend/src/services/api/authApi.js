import { apiRequest, setAuthToken } from './apiClient';

export const authApi = {
  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setAuthToken(data.token);

    return data;
  },

  async register(name, email, password) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    setAuthToken(data.token);

    return data;
  },

  async getCurrentUser() {
    const data = await apiRequest('/auth/me');

    return data.user;
  },

  logout() {
    setAuthToken(null);
  }
};