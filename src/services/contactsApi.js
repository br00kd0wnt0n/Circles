/**
 * Contacts API service
 */
import api from './api';

export const contactsApi = {
  /**
   * Get all contacts with their status
   */
  async getAll() {
    return api.get('/api/contacts');
  },

  /**
   * Add a new contact
   */
  async create(contact) {
    return api.post('/api/contacts', contact);
  },

  /**
   * Bulk import contacts from phone
   */
  async import(contacts) {
    return api.post('/api/contacts/import', { contacts });
  },

  /**
   * Send app invite to a contact
   */
  async sendAppInvite(contactId) {
    return api.post(`/api/contacts/${contactId}/invite-to-app`);
  },

  /**
   * Update a contact
   */
  async update(contactId, data) {
    return api.put(`/api/contacts/${contactId}`, data);
  },

  /**
   * Delete a contact
   */
  async delete(contactId) {
    return api.delete(`/api/contacts/${contactId}`);
  }
};

export default contactsApi;
