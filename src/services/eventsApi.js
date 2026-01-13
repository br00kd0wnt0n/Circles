/**
 * Events API service
 */
import api from './api';

export const eventsApi = {
  /**
   * Get upcoming events
   */
  async getAll() {
    return api.get('/api/events');
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
