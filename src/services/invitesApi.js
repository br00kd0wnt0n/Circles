/**
 * Invites API service
 */
import api from './api';

export const invitesApi = {
  /**
   * Get all invites (sent and received)
   */
  async getAll() {
    return api.get('/api/invites');
  },

  /**
   * Create a new invite
   */
  async create(invite) {
    return api.post('/api/invites', invite);
  },

  /**
   * Respond to an invite
   */
  async respond(inviteId, response) {
    return api.put(`/api/invites/${inviteId}/respond`, { response });
  },

  /**
   * Cancel an invite (creator only)
   */
  async cancel(inviteId) {
    return api.delete(`/api/invites/${inviteId}`);
  }
};

export default invitesApi;
