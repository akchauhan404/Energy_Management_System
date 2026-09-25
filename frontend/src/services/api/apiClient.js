// Centralized API client with JWT attachment and Mock Mode fallback support

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData (e.g. file upload), let the browser set Content-Type
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Token expired or invalid
      setAuthToken(null);
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    // If backend isn't reached and mock mode is permissible, caller fallback handles it
    throw err;
  }
}

export { USE_MOCK };
