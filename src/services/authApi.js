/**
 * Authentication API service
 */
import api from './api';

export const authApi = {
  /**
   * Request OTP code to be sent to phone
   */
  async requestOtp(phone) {
    return api.post('/api/auth/request-otp', { phone });
  },

  /**
   * Verify OTP code and get auth token
   */
  async verifyOtp(phone, code) {
    const response = await api.post('/api/auth/verify-otp', { phone, code });

    if (response.token) {
      api.setToken(response.token);
    }

    return response;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    return api.get('/api/auth/me');
  },

  /**
   * Logout current user
   */
  async logout() {
    try {
      await api.post('/api/auth/logout', {});
    } finally {
      api.setToken(null);
    }
  },

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated() {
    return !!api.getToken();
  }
};

export default authApi;
