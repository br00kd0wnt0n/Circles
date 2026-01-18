/**
 * Admin API service
 */
const API_URL = import.meta.env.VITE_API_URL || '';

// Get admin token from localStorage
const getToken = () => localStorage.getItem('admin_token');

// Make authenticated request
async function adminRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const adminApi = {
  // Auth
  async setup(email, password) {
    return adminRequest('/api/admin/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email, password) {
    const data = await adminRequest('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    return data;
  },

  async getMe() {
    return adminRequest('/api/admin/auth/me');
  },

  logout() {
    localStorage.removeItem('admin_token');
  },

  isAuthenticated() {
    return !!getToken();
  },

  // Businesses
  async getBusinesses() {
    return adminRequest('/api/admin/businesses');
  },

  async getBusiness(id) {
    return adminRequest(`/api/admin/businesses/${id}`);
  },

  async createBusiness(data) {
    return adminRequest('/api/admin/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBusiness(id, data) {
    return adminRequest(`/api/admin/businesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBusiness(id) {
    return adminRequest(`/api/admin/businesses/${id}`, {
      method: 'DELETE',
    });
  },

  // Offers
  async getOffers() {
    return adminRequest('/api/admin/offers');
  },

  async getOffer(id) {
    return adminRequest(`/api/admin/offers/${id}`);
  },

  async createOffer(data) {
    return adminRequest('/api/admin/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOffer(id, data) {
    return adminRequest(`/api/admin/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteOffer(id) {
    return adminRequest(`/api/admin/offers/${id}`, {
      method: 'DELETE',
    });
  },

  // Events
  async getEvents() {
    return adminRequest('/api/admin/events');
  },

  async getEvent(id) {
    return adminRequest(`/api/admin/events/${id}`);
  },

  async createEvent(data) {
    return adminRequest('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvent(id, data) {
    return adminRequest(`/api/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(id) {
    return adminRequest(`/api/admin/events/${id}`, {
      method: 'DELETE',
    });
  },
};

export default adminApi;
