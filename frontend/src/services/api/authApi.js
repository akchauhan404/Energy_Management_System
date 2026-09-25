import { apiRequest, setAuthToken, USE_MOCK } from './apiClient';

const MOCK_STORAGE_USER_KEY = 'energy_ai_mock_user';

export const authApi = {
  async login(email, password) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600));
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const isAdmin = email.toLowerCase().includes('admin');
      const user = {
        id: isAdmin ? 'usr-admin-01' : 'usr-demo-01',
        name: isAdmin ? 'System Administrator' : 'Project Researcher',
        email,
        role: isAdmin ? 'ADMIN' : 'USER',
        created_at: new Date('2026-01-15').toISOString()
      };
      const token = 'mock_jwt_token_' + btoa(JSON.stringify(user));
      setAuthToken(token);
      localStorage.setItem(MOCK_STORAGE_USER_KEY, JSON.stringify(user));
      return { user, token };
    }

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setAuthToken(data.token);
      return data;
    } catch (err) {
      // Fallback in mock if backend is down
      if (USE_MOCK) {
        return this.login(email, password);
      }
      throw err;
    }
  },

  async register(name, email, password) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600));
      if (!name || !email || !password) {
        throw new Error('All fields are required');
      }
      const user = {
        id: 'usr-new-' + Date.now(),
        name,
        email,
        role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER',
        created_at: new Date().toISOString()
      };
      const token = 'mock_jwt_token_' + btoa(JSON.stringify(user));
      setAuthToken(token);
      localStorage.setItem(MOCK_STORAGE_USER_KEY, JSON.stringify(user));
      return { user, token };
    }

    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    setAuthToken(data.token);
    return data;
  },

  async getCurrentUser() {
    if (USE_MOCK) {
      const cached = localStorage.getItem(MOCK_STORAGE_USER_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
      // Default initial user
      const defaultUser = {
        id: 'usr-demo-01',
        name: 'Project Researcher',
        email: 'researcher@energy-ai.local',
        role: 'USER',
        created_at: new Date('2026-01-15').toISOString()
      };
      localStorage.setItem(MOCK_STORAGE_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }

    try {
      const data = await apiRequest('/auth/me');
      return data.user;
    } catch (err) {
      const cached = localStorage.getItem(MOCK_STORAGE_USER_KEY);
      if (cached) return JSON.parse(cached);
      throw err;
    }
  },

  logout() {
    setAuthToken(null);
    localStorage.removeItem(MOCK_STORAGE_USER_KEY);
  }
};
