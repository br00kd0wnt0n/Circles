/**
 * Status API service
 */
import api from './api';

export const statusApi = {
  /**
   * Get all contacts' status
   */
  async getAll() {
    return api.get('/api/status');
  },

  /**
   * Update current household status
   */
  async update(status) {
    return api.put('/api/status', status);
  },

  /**
   * Save push subscription
   */
  async savePushSubscription(subscription) {
    return api.post('/api/status/subscribe', { subscription });
  },

  /**
   * Remove push subscription
   */
  async removePushSubscription() {
    return api.delete('/api/status/subscribe');
  }
};

export default statusApi;
