/**
 * Supabase Service Layer
 * Replaces Express backend API calls with direct Supabase queries
 */

import { supabase, getMyHousehold } from '../lib/supabase';

// ============================================
// CONTACTS
// ============================================

export const contactsService = {
  /**
   * Get all contacts for current household with their status
   */
  async getAll() {
    if (!supabase) return [];

    const household = await getMyHousehold();
    if (!household) return [];

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        display_name,
        phone,
        avatar,
        is_app_user,
        linked_household_id,
        linked_household:households!linked_household_id (
          name,
          household_status (
            state,
            note,
            time_window,
            updated_at
          )
        )
      `)
      .eq('owner_household_id', household.id)
      .order('display_name');

    if (error) throw error;

    // Get circle memberships for contacts with linked households
    const linkedHouseholdIds = (data || [])
      .filter(c => c.linked_household_id)
      .map(c => c.linked_household_id);

    let circleMemberships = [];
    if (linkedHouseholdIds.length > 0) {
      const { data: cmData } = await supabase
        .from('circle_members')
        .select(`
          household_id,
          circles (
            id,
            name,
            color
          )
        `)
        .in('household_id', linkedHouseholdIds);
      circleMemberships = cmData || [];
    }

    // Transform to match existing frontend format
    return (data || []).map(contact => {
      const contactCircles = circleMemberships
        .filter(cm => cm.household_id === contact.linked_household_id)
        .map(cm => cm.circles)
        .filter(Boolean);

      return {
        id: contact.id,
        displayName: contact.display_name,
        phone: contact.phone,
        avatar: contact.avatar,
        isAppUser: contact.is_app_user,
        linkedHouseholdId: contact.linked_household_id,
        householdName: contact.linked_household?.name,
        status: contact.linked_household?.household_status?.[0] || null,
        circles: contactCircles
      };
    });
  },

  /**
   * Create a new contact
   */
  async create({ displayName, phone }) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    // For now, contacts are created as non-app-users
    // Linking to existing households would require a separate lookup mechanism
    let linkedHouseholdId = null;
    let isAppUser = false;

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        owner_household_id: household.id,
        display_name: displayName,
        phone,
        linked_household_id: linkedHouseholdId,
        is_app_user: isAppUser
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      displayName: data.display_name,
      phone: data.phone,
      avatar: data.avatar,
      isAppUser: data.is_app_user,
      linkedHouseholdId: data.linked_household_id,
      circles: []
    };
  },

  /**
   * Update a contact
   */
  async update(contactId, updates) {
    if (!supabase) throw new Error('Supabase not configured');

    const updateData = {};
    if (updates.displayName) updateData.display_name = updates.displayName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.avatar) updateData.avatar = updates.avatar;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a contact
   */
  async delete(contactId) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
  }
};

// ============================================
// CIRCLES
// ============================================

export const circlesService = {
  /**
   * Get all circles for current household
   */
  async getAll() {
    if (!supabase) return [];

    const household = await getMyHousehold();
    if (!household) return [];

    const { data, error } = await supabase
      .from('circles')
      .select(`
        id,
        name,
        color,
        created_at,
        circle_members (
          household_id
        )
      `)
      .eq('owner_household_id', household.id)
      .order('name');

    if (error) throw error;

    return (data || []).map(circle => ({
      id: circle.id,
      name: circle.name,
      color: circle.color,
      createdAt: circle.created_at,
      memberCount: circle.circle_members?.length || 0,
      memberIds: (circle.circle_members || []).map(cm => cm.household_id)
    }));
  },

  /**
   * Create a new circle
   */
  async create({ name, color }) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    const { data, error } = await supabase
      .from('circles')
      .insert({
        owner_household_id: household.id,
        name,
        color: color || '#9CAF88'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      createdAt: data.created_at,
      memberCount: 0,
      memberIds: []
    };
  },

  /**
   * Update a circle
   */
  async update(circleId, updates) {
    if (!supabase) throw new Error('Supabase not configured');

    // Update circle details
    if (updates.name || updates.color) {
      const updateData = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.color) updateData.color = updates.color;

      const { error } = await supabase
        .from('circles')
        .update(updateData)
        .eq('id', circleId);

      if (error) throw error;
    }

    // Update members if provided
    if (updates.memberIds) {
      // Get current members
      const { data: currentMembers } = await supabase
        .from('circle_members')
        .select('household_id')
        .eq('circle_id', circleId);

      const currentIds = (currentMembers || []).map(m => m.household_id);
      const newIds = updates.memberIds;

      // Remove members not in new list
      const toRemove = currentIds.filter(id => !newIds.includes(id));
      if (toRemove.length > 0) {
        await supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circleId)
          .in('household_id', toRemove);
      }

      // Add new members
      const toAdd = newIds.filter(id => !currentIds.includes(id));
      if (toAdd.length > 0) {
        await supabase
          .from('circle_members')
          .insert(toAdd.map(householdId => ({
            circle_id: circleId,
            household_id: householdId
          })));
      }
    }

    // Return updated circle
    const { data } = await supabase
      .from('circles')
      .select('*, circle_members(household_id)')
      .eq('id', circleId)
      .single();

    return {
      id: data.id,
      name: data.name,
      color: data.color,
      memberCount: data.circle_members?.length || 0,
      memberIds: (data.circle_members || []).map(m => m.household_id)
    };
  },

  /**
   * Delete a circle
   */
  async delete(circleId) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('circles')
      .delete()
      .eq('id', circleId);

    if (error) throw error;
  },

  /**
   * Add a household to a circle
   */
  async addMember(circleId, householdId) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('circle_members')
      .insert({ circle_id: circleId, household_id: householdId });

    if (error && error.code !== '23505') throw error; // Ignore duplicate
  },

  /**
   * Remove a household from a circle
   */
  async removeMember(circleId, householdId) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', circleId)
      .eq('household_id', householdId);

    if (error) throw error;
  }
};

// ============================================
// INVITES
// ============================================

export const invitesService = {
  /**
   * Get all invites (sent and received)
   */
  async getAll() {
    if (!supabase) return { sent: [], received: [] };

    const household = await getMyHousehold();
    if (!household) return { sent: [], received: [] };

    // Get sent invites
    const { data: sentData } = await supabase
      .from('invites')
      .select(`
        id,
        activity,
        date,
        time,
        location,
        message,
        status,
        created_at,
        invite_recipients (
          id,
          household_id,
          response,
          responded_at
        )
      `)
      .eq('creator_household_id', household.id)
      .order('created_at', { ascending: false });

    // Get received invites
    const { data: receivedData } = await supabase
      .from('invite_recipients')
      .select(`
        id,
        response,
        responded_at,
        invites (
          id,
          activity,
          date,
          time,
          location,
          message,
          status,
          created_at,
          creator_household_id,
          households!creator_household_id (
            name
          )
        )
      `)
      .eq('household_id', household.id);

    // Transform sent invites
    const sent = (sentData || []).map(invite => ({
      id: invite.id,
      type: 'sent',
      activityName: invite.activity,
      proposedDate: invite.date,
      proposedTime: invite.time,
      location: invite.location,
      message: invite.message,
      status: invite.status,
      createdAt: invite.created_at,
      recipients: (invite.invite_recipients || []).map(r => ({
        id: r.id,
        householdId: r.household_id,
        response: r.response,
        respondedAt: r.responded_at
      }))
    }));

    // Transform received invites
    const received = (receivedData || []).filter(r => r.invites).map(r => ({
      id: r.invites.id,
      type: 'received',
      activityName: r.invites.activity,
      proposedDate: r.invites.date,
      proposedTime: r.invites.time,
      location: r.invites.location,
      message: r.invites.message,
      status: r.invites.status,
      createdAt: r.invites.created_at,
      myResponse: r.response,
      creator: {
        id: r.invites.creator_household_id,
        name: r.invites.households?.name
      }
    }));

    return { sent, received };
  },

  /**
   * Create a new invite
   */
  async create({ householdIds, activityName, proposedDate, proposedTime, location, message }) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    // Create invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .insert({
        creator_household_id: household.id,
        activity: activityName,
        date: proposedDate,
        time: proposedTime,
        location,
        message
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Add recipients (householdIds directly)
    const recipients = (householdIds || []).map(householdId => ({
      invite_id: invite.id,
      household_id: householdId
    }));

    if (recipients.length > 0) {
      const { error: recipientError } = await supabase
        .from('invite_recipients')
        .insert(recipients);

      if (recipientError) throw recipientError;
    }

    return {
      id: invite.id,
      type: 'sent',
      activityName: invite.activity,
      status: invite.status,
      createdAt: invite.created_at,
      recipients: recipients.map(r => ({
        householdId: r.household_id,
        response: 'pending'
      }))
    };
  },

  /**
   * Respond to an invite
   */
  async respond(inviteId, response) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    const { error } = await supabase
      .from('invite_recipients')
      .update({
        response,
        responded_at: new Date().toISOString()
      })
      .eq('invite_id', inviteId)
      .eq('household_id', household.id);

    if (error) throw error;
  }
};

// ============================================
// STATUS
// ============================================

export const statusService = {
  /**
   * Update my household's status
   */
  async update({ state, note, timeWindow }) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    const { data, error } = await supabase
      .from('household_status')
      .update({
        state,
        note,
        time_window: timeWindow
      })
      .eq('household_id', household.id)
      .select()
      .single();

    if (error) throw error;

    return {
      state: data.state,
      note: data.note,
      timeWindow: data.time_window,
      updatedAt: data.updated_at
    };
  }
};

// ============================================
// HOUSEHOLD MEMBERS
// ============================================

export const membersService = {
  /**
   * Add a member to household
   */
  async add({ name, role, avatar }) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    const { data, error } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        name,
        role: role || 'adult',
        avatar: avatar || '👤'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a member
   */
  async update(memberId, updates) {
    if (!supabase) throw new Error('Supabase not configured');

    const updateData = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.role) updateData.role = updates.role;
    if (updates.avatar) updateData.avatar = updates.avatar;

    const { data, error } = await supabase
      .from('household_members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a member
   */
  async delete(memberId) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }
};

// ============================================
// PUBLIC DATA (Offers & Events)
// ============================================

export const offersService = {
  /**
   * Get active offers
   */
  async getAll({ zipCode } = {}) {
    if (!supabase) return [];

    try {
      // Simple query to avoid column name issues
      let query = supabase
        .from('offers')
        .select('*')
        .eq('is_active', true);

      const { data, error } = await query;

      if (error) {
        console.warn('Offers query failed:', error.message);
        return [];
      }

      return (data || []).map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        promoCode: offer.promo_code,
        validFrom: offer.valid_from,
        validUntil: offer.valid_until,
        color: offer.color,
        imageUrl: offer.image_url,
        business: null
      }));
    } catch (err) {
      console.warn('Offers service error:', err);
      return [];
    }
  }
};

export const eventsService = {
  /**
   * Get upcoming events
   */
  async getAll({ zipCode } = {}) {
    if (!supabase) return [];

    try {
      // Simple query without ordering to avoid column name issues
      let query = supabase
        .from('events')
        .select('*')
        .eq('is_active', true);

      const { data, error } = await query;

      if (error) {
        console.warn('Events query failed:', error.message);
        return [];
      }

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.event_date || event.date,
        time: event.event_time || event.time,
        location: event.location,
        zipCode: event.zip_code,
        color: event.color,
        imageUrl: event.image_url,
        eventUrl: event.event_url,
        business: null
      }));
    } catch (err) {
      console.warn('Events service error:', err);
      return [];
    }
  }
};

// Export all services
export default {
  contacts: contactsService,
  circles: circlesService,
  invites: invitesService,
  status: statusService,
  members: membersService,
  offers: offersService,
  events: eventsService
};
