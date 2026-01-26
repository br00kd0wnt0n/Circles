/**
 * Supabase Service Layer
 * Replaces Express backend API calls with direct Supabase queries
 */

import { supabase, getMyHousehold, getUser } from '../lib/supabase';

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
        invite_token,
        linked_household:households!linked_household_id (
          name,
          household_status (
            state,
            note,
            time_window,
            updated_at
          ),
          household_members (
            id,
            name,
            role,
            avatar
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
        circles: contactCircles,
        inviteToken: contact.invite_token,
        members: contact.linked_household?.household_members || []
      };
    });
  },

  /**
   * Find a contact by invite token (for signup flow)
   */
  async findByInviteToken(token) {
    if (!supabase || !token) return null;

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        display_name,
        phone,
        owner_household_id,
        linked_household_id,
        linked_household:households!linked_household_id (
          name,
          household_members (
            id,
            name,
            role,
            avatar
          )
        ),
        owner:households!owner_household_id (
          name
        )
      `)
      .eq('invite_token', token)
      .eq('is_app_user', false)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      displayName: data.display_name,
      phone: data.phone,
      linkedHouseholdId: data.linked_household_id,
      shadowHouseholdName: data.linked_household?.name,
      members: data.linked_household?.household_members || [],
      invitedBy: data.owner?.name || 'A friend'
    };
  },

  /**
   * Create a new contact
   * Creates a "shadow household" for non-app-users so they can be added to circles.
   * Generates an invite token for sharing invite links.
   * When the contact joins via invite link or matching phone, their shadow household
   * will be merged with their real household.
   */
  async create({ displayName, phone, members = [] }) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    const user = await getUser();
    if (!user) throw new Error('No authenticated user');

    // Generate unique invite token
    const inviteToken = crypto.randomUUID();

    // Create a shadow household for the contact
    // Note: user_id is required (NOT NULL constraint in production)
    const { data: shadowHousehold, error: shadowError } = await supabase
      .from('households')
      .insert({
        name: displayName,
        zip_code: household.zip_code,
        user_id: user.id
      })
      .select()
      .single();

    if (shadowError) {
      console.error('Failed to create shadow household:', shadowError);
      throw shadowError;
    }

    console.log('[contactsService] Created shadow household:', shadowHousehold.id);

    // Add family members to shadow household if provided
    if (members.length > 0) {
      const membersToInsert = members.map((m, index) => ({
        household_id: shadowHousehold.id,
        name: m.name,
        role: m.role || 'adult',
        avatar: m.avatar || '👤',
        is_primary: index === 0
      }));

      const { error: membersError } = await supabase
        .from('household_members')
        .insert(membersToInsert);

      if (membersError) {
        console.error('Failed to add members to shadow household:', membersError);
        // Non-fatal, continue
      }
    }

    // Create the contact linked to the shadow household
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        owner_household_id: household.id,
        display_name: displayName,
        phone: phone || null,
        linked_household_id: shadowHousehold.id,
        is_app_user: false,
        invite_token: inviteToken
      })
      .select()
      .single();

    if (error) {
      // Clean up shadow household if contact creation fails
      await supabase.from('households').delete().eq('id', shadowHousehold.id);
      throw error;
    }

    return {
      id: data.id,
      displayName: data.display_name,
      phone: data.phone,
      avatar: data.avatar,
      isAppUser: false,
      linkedHouseholdId: data.linked_household_id,
      inviteToken: data.invite_token,
      circles: [],
      members: members
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
   * Create shadow households for existing contacts without linkedHouseholdId
   * This migrates old contacts to support circle membership
   */
  async migrateContactsWithoutHouseholds() {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    const user = await getUser();
    if (!user) throw new Error('No authenticated user');

    // Get contacts without linked_household_id
    const { data: contactsToMigrate, error: fetchError } = await supabase
      .from('contacts')
      .select('id, display_name')
      .eq('owner_household_id', household.id)
      .is('linked_household_id', null);

    if (fetchError) throw fetchError;

    console.log('[contactsService] Contacts to migrate:', contactsToMigrate?.length || 0);

    if (!contactsToMigrate || contactsToMigrate.length === 0) {
      return { migrated: 0 };
    }

    let migrated = 0;
    for (const contact of contactsToMigrate) {
      try {
        // Create shadow household
        // Note: user_id is required (NOT NULL constraint in production)
        const { data: shadowHousehold, error: shadowError } = await supabase
          .from('households')
          .insert({
            name: contact.display_name,
            zip_code: household.zip_code,
            user_id: user.id
          })
          .select()
          .single();

        if (shadowError) {
          console.error('Failed to create shadow household for contact:', contact.id, shadowError);
          continue;
        }

        // Update contact with linked_household_id
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ linked_household_id: shadowHousehold.id })
          .eq('id', contact.id);

        if (updateError) {
          console.error('Failed to update contact:', contact.id, updateError);
          // Clean up shadow household
          await supabase.from('households').delete().eq('id', shadowHousehold.id);
          continue;
        }

        console.log('[contactsService] Migrated contact:', contact.display_name);
        migrated++;
      } catch (err) {
        console.error('Migration error for contact:', contact.id, err);
      }
    }

    return { migrated, total: contactsToMigrate.length };
  },

  /**
   * Delete a contact
   */
  async delete(contactId) {
    if (!supabase) throw new Error('Supabase not configured');

    // First, get the contact to check for shadow household
    const { data: contact } = await supabase
      .from('contacts')
      .select('linked_household_id, is_app_user')
      .eq('id', contactId)
      .single();

    // Delete the contact
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;

    // If contact had a shadow household (non-app-user with linked_household_id), delete it
    if (contact?.linked_household_id && !contact.is_app_user) {
      console.log('[contactsService] Cleaning up shadow household:', contact.linked_household_id);
      await supabase
        .from('households')
        .delete()
        .eq('id', contact.linked_household_id);
    }
  },

  /**
   * Create test friends for development/testing
   * These are "confirmed app users" with realistic data and status
   */
  async createTestFriends() {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    const user = await getUser();
    if (!user) throw new Error('No authenticated user');

    const testFriends = [
      {
        displayName: 'The Johnsons',
        status: 'available',
        note: 'Free this weekend!',
        members: [
          { name: 'Mike', role: 'adult', avatar: '👨' },
          { name: 'Sarah', role: 'adult', avatar: '👩' },
          { name: 'Emma', role: 'child', avatar: '👧' }
        ]
      },
      {
        displayName: 'Patel Family',
        status: 'open',
        note: 'Looking for playdate partners',
        members: [
          { name: 'Raj', role: 'adult', avatar: '👨' },
          { name: 'Priya', role: 'adult', avatar: '👩' },
          { name: 'Arun', role: 'child', avatar: '👦' },
          { name: 'Maya', role: 'child', avatar: '👧' }
        ]
      },
      {
        displayName: 'Chen Household',
        status: 'busy',
        note: 'Traveling until next week',
        members: [
          { name: 'David', role: 'adult', avatar: '👨' },
          { name: 'Lisa', role: 'adult', avatar: '👩' }
        ]
      },
      {
        displayName: 'Garcia + Kids',
        status: 'available',
        note: null,
        members: [
          { name: 'Maria', role: 'adult', avatar: '👩' },
          { name: 'Carlos', role: 'child', avatar: '👦' },
          { name: 'Sofia', role: 'child', avatar: '👧' }
        ]
      },
      {
        displayName: 'The Williams',
        status: 'open',
        note: 'Always up for coffee',
        members: [
          { name: 'James', role: 'adult', avatar: '👨' },
          { name: 'Olivia', role: 'adult', avatar: '👩' },
          { name: 'Max', role: 'pet', avatar: '🐕' }
        ]
      }
    ];

    const created = [];

    for (const friend of testFriends) {
      try {
        // Create a "real" household for this test friend (simulating they're an app user)
        // Note: user_id is required (NOT NULL constraint in production)
        const { data: friendHousehold, error: householdError } = await supabase
          .from('households')
          .insert({
            name: friend.displayName,
            zip_code: household.zip_code,
            user_id: user.id
          })
          .select()
          .single();

        if (householdError) {
          console.error('Failed to create test friend household:', householdError);
          continue;
        }

        // Add family members
        if (friend.members.length > 0) {
          const membersToInsert = friend.members.map((m, index) => ({
            household_id: friendHousehold.id,
            name: m.name,
            role: m.role,
            avatar: m.avatar,
            is_primary: index === 0
          }));

          await supabase.from('household_members').insert(membersToInsert);
        }

        // Create status for the household
        await supabase
          .from('household_status')
          .insert({
            household_id: friendHousehold.id,
            state: friend.status,
            note: friend.note,
            time_window: null
          });

        // Create the contact linking to this household (marked as app user)
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            owner_household_id: household.id,
            display_name: friend.displayName,
            linked_household_id: friendHousehold.id,
            is_app_user: true,  // Key: they're confirmed app users
            invite_token: null  // No invite needed - they're already "on the app"
          })
          .select()
          .single();

        if (contactError) {
          console.error('Failed to create test friend contact:', contactError);
          // Clean up the household we created
          await supabase.from('households').delete().eq('id', friendHousehold.id);
          continue;
        }

        created.push({
          id: contact.id,
          displayName: contact.display_name,
          linkedHouseholdId: friendHousehold.id,
          isAppUser: true,
          status: { state: friend.status, note: friend.note },
          members: friend.members
        });

        console.log('[createTestFriends] Created:', friend.displayName);
      } catch (err) {
        console.error('Error creating test friend:', friend.displayName, err);
      }
    }

    console.log('[createTestFriends] Total created:', created.length);
    return { created, count: created.length };
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
    console.log('[circlesService.update] called:', { circleId, updates });

    // Update circle details
    if (updates.name || updates.color) {
      const updateData = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.color) updateData.color = updates.color;

      const { error } = await supabase
        .from('circles')
        .update(updateData)
        .eq('id', circleId);

      if (error) {
        console.error('[circlesService.update] circle update error:', error);
        throw error;
      }
      console.log('[circlesService.update] circle details updated');
    }

    // Update members if provided
    if (updates.memberIds) {
      console.log('[circlesService.update] updating members, newIds:', updates.memberIds);

      // Get current members
      const { data: currentMembers, error: fetchError } = await supabase
        .from('circle_members')
        .select('household_id')
        .eq('circle_id', circleId);

      if (fetchError) {
        console.error('[circlesService.update] fetch current members error:', fetchError);
      }

      const currentIds = (currentMembers || []).map(m => m.household_id);
      const newIds = updates.memberIds;
      console.log('[circlesService.update] currentIds:', currentIds, 'newIds:', newIds);

      // Remove members not in new list
      const toRemove = currentIds.filter(id => !newIds.includes(id));
      if (toRemove.length > 0) {
        console.log('[circlesService.update] removing members:', toRemove);
        const { error: removeError } = await supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circleId)
          .in('household_id', toRemove);
        if (removeError) {
          console.error('[circlesService.update] remove error:', removeError);
        }
      }

      // Add new members
      const toAdd = newIds.filter(id => id && !currentIds.includes(id));
      if (toAdd.length > 0) {
        console.log('[circlesService.update] adding members:', toAdd);
        const { error } = await supabase
          .from('circle_members')
          .insert(toAdd.map(householdId => ({
            circle_id: circleId,
            household_id: householdId
          })));
        // Ignore duplicate key errors (409 conflict)
        if (error && error.code !== '23505') {
          console.error('[circlesService.update] insert error:', error);
          throw error;
        }
        if (error) {
          console.log('[circlesService.update] insert duplicate ignored');
        }
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
   * Update my household's status (upsert - creates if doesn't exist)
   */
  async update({ state, note, timeWindow }) {
    if (!supabase) throw new Error('Supabase not configured');

    const household = await getMyHousehold();
    if (!household) throw new Error('No household found');

    // Use upsert to create the row if it doesn't exist
    const { data, error } = await supabase
      .from('household_status')
      .upsert({
        household_id: household.id,
        state,
        note,
        time_window: timeWindow
      }, {
        onConflict: 'household_id'
      })
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
