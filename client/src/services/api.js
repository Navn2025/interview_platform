export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('interview_jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  async register(email, password) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed - invalid credentials');
    }
    return res.json();
  },

  // Future authenticated requests can follow this pattern
  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('interview_jwt');
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw new Error(`API GET failed: ${res.status}`);
    }
    return res.json();
  },
  
  async post(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('interview_jwt');
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw new Error(`API POST failed: ${res.status}`);
    }
    return res.json();
  },
  
  async getHistory() {
    try {
      const res = await fetch(`${BASE_URL}/interview`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
};
