/**
 * Households API service
 */
import api from './api';

export const householdsApi = {
  /**
   * Get current user's household
   */
  async getMyHousehold() {
    return api.get('/api/households/me');
  },

  /**
   * Create a new household
   */
  async create(data) {
    return api.post('/api/households', data);
  },

  /**
   * Update current household
   */
  async update(data) {
    return api.put('/api/households/me', data);
  },

  /**
   * Update household status
   */
  async updateStatus(status) {
    return api.put('/api/households/me/status', status);
  },

  /**
   * Add member to household
   */
  async addMember(member) {
    return api.post('/api/households/me/members', member);
  },

  /**
   * Update household member
   */
  async updateMember(memberId, data) {
    return api.put(`/api/households/me/members/${memberId}`, data);
  },

  /**
   * Remove member from household
   */
  async removeMember(memberId) {
    return api.delete(`/api/households/me/members/${memberId}`);
  }
};

export default householdsApi;
