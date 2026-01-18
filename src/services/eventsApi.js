/**
 * Events API service
 */
import api from './api';

export const eventsApi = {
  /**
   * Get upcoming events
   * @param {Object} options
   * @param {string} options.zipCode - Optional zip code for location filtering
   */
  async getAll(options = {}) {
    const params = new URLSearchParams();
    if (options.zipCode) params.append('zipCode', options.zipCode);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/api/events${query}`);
  },

  /**
   * Get events grouped by date for calendar view
   */
  async getCalendar(month, year) {
    const params = month && year ? `?month=${month}&year=${year}` : '';
    return api.get(`/api/events/calendar${params}`);
  },

  /**
   * Get a specific event
   */
  async get(eventId) {
    return api.get(`/api/events/${eventId}`);
  }
};

export default eventsApi;
