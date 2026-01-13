/**
 * Offers API service
 */
import api from './api';

export const offersApi = {
  /**
   * Get all active offers
   */
  async getAll() {
    return api.get('/api/offers');
  },

  /**
   * Get a specific offer
   */
  async get(offerId) {
    return api.get(`/api/offers/${offerId}`);
  }
};

export default offersApi;
