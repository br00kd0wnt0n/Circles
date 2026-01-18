/**
 * Households API service
 */
import api from './api';

// Transform API response to frontend format
const transformHousehold = (data) => {
  if (!data) return data;
  return {
    ...data,
    householdName: data.name || data.householdName,
  };
};

export const householdsApi = {
  /**
   * Get current user's household
   */
  async getMyHousehold() {
    const data = await api.get('/api/households/me');
    return transformHousehold(data);
  },

  /**
   * Create a new household
   */
  async create(data) {
    const result = await api.post('/api/households', data);
    return transformHousehold(result);
  },

  /**
   * Update current household
   */
  async update(data) {
    const result = await api.put('/api/households/me', data);
    return transformHousehold(result);
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
