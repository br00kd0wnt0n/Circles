/**
 * Circles API service
 */
import api from './api';

export const circlesApi = {
  /**
   * Get all circles
   */
  async getAll() {
    return api.get('/api/circles');
  },

  /**
   * Get a specific circle with members
   */
  async get(circleId) {
    return api.get(`/api/circles/${circleId}`);
  },

  /**
   * Create a new circle
   */
  async create(data) {
    return api.post('/api/circles', data);
  },

  /**
   * Update a circle
   */
  async update(circleId, data) {
    return api.put(`/api/circles/${circleId}`, data);
  },

  /**
   * Delete a circle
   */
  async delete(circleId) {
    return api.delete(`/api/circles/${circleId}`);
  },

  /**
   * Add contact to circle
   */
  async addMember(circleId, contactId) {
    return api.post(`/api/circles/${circleId}/members`, { contactId });
  },

  /**
   * Remove contact from circle
   */
  async removeMember(circleId, contactId) {
    return api.delete(`/api/circles/${circleId}/members/${contactId}`);
  }
};

export default circlesApi;
