/**
 * Offers API service
 */
import api from './api';

export const offersApi = {
  /**
   * Get all active offers
   * @param {Object} options
   * @param {string} options.zipCode - Optional zip code for location filtering
   */
  async getAll(options = {}) {
    const params = new URLSearchParams();
    if (options.zipCode) params.append('zipCode', options.zipCode);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/api/offers${query}`);
  },

  /**
   * Get a specific offer
   */
  async get(offerId) {
    return api.get(`/api/offers/${offerId}`);
  }
};

export default offersApi;
