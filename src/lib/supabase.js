import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: localStorage,
        storageKey: 'circles-auth'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-application-name': 'circles-app'
        }
      }
    })
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Sign in with phone number (sends OTP)
 */
export async function signInWithPhone(phone) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: 'sms'
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Verify OTP code (phone)
 */
export async function verifyOtp(phone, code) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: 'sms'
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Send magic link to email (passwordless)
 */
export async function signInWithMagicLink(email) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Get current session
 */
export async function getSession() {
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user
 */
export async function getUser() {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign out
 */
export async function signOut() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// ============================================
// HOUSEHOLD HELPERS
// ============================================

/**
 * Get current user's household
 */
export async function getMyHousehold() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_households')
    .select(`
      household_id,
      is_primary,
      households (
        id,
        name,
        zip_code,
        created_at,
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
          avatar,
          is_primary
        )
      )
    `)
    .eq('is_primary', true)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const household = data.households;
  return {
    id: household.id,
    name: household.name,
    zipCode: household.zip_code,
    status: household.household_status?.[0] || { state: 'available', note: null, timeWindow: null },
    members: household.household_members || []
  };
}

/**
 * Create a new household for the current user
 */
export async function createHousehold({ name, zipCode, members = [] }) {
  if (!supabase) throw new Error('Supabase not configured');

  const user = await getUser();
  if (!user) throw new Error('Not authenticated');

  // Create household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name, zip_code: zipCode, user_id: user.id })
    .select()
    .single();

  if (householdError) throw householdError;

  // Link user to household
  const { error: linkError } = await supabase
    .from('user_households')
    .insert({
      user_id: user.id,
      household_id: household.id,
      is_primary: true
    });

  if (linkError) throw linkError;

  // Add members if provided
  if (members.length > 0) {
    const membersToInsert = members.map((m, index) => ({
      household_id: household.id,
      name: m.name,
      role: m.role || 'adult',
      avatar: m.avatar || '👤',
      is_primary: index === 0
    }));

    const { error: membersError } = await supabase
      .from('household_members')
      .insert(membersToInsert);

    if (membersError) throw membersError;
  }

  return getMyHousehold();
}

/**
 * Update household
 */
export async function updateHousehold(updates) {
  if (!supabase) throw new Error('Supabase not configured');

  const household = await getMyHousehold();
  if (!household) throw new Error('No household found');

  const { error } = await supabase
    .from('households')
    .update({
      name: updates.name,
      zip_code: updates.zipCode
    })
    .eq('id', household.id);

  if (error) throw error;
  return getMyHousehold();
}

// ============================================
// REALTIME HELPERS
// ============================================

/**
 * Subscribe to status updates for contacts
 */
export function subscribeToStatusUpdates(householdIds, callback) {
  if (!supabase || !householdIds.length) {
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel('status-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'household_status',
        filter: `household_id=in.(${householdIds.join(',')})`
      },
      (payload) => {
        callback({
          householdId: payload.new.household_id,
          status: {
            state: payload.new.state,
            note: payload.new.note,
            timeWindow: payload.new.time_window,
            updatedAt: payload.new.updated_at
          }
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel)
  };
}

/**
 * Subscribe to new invites
 */
export function subscribeToInvites(householdId, callback) {
  if (!supabase || !householdId) {
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel('invite-updates')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'invite_recipients',
        filter: `household_id=eq.${householdId}`
      },
      async (payload) => {
        // Fetch the full invite details
        const { data: invite } = await supabase
          .from('invites')
          .select('*, households!creator_household_id(name)')
          .eq('id', payload.new.invite_id)
          .single();

        if (invite) {
          callback({
            invite,
            from: invite.households
          });
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel)
  };
}

// ============================================
// SMS HELPERS (via Edge Function)
// ============================================

/**
 * Send SMS notification via Twilio Edge Function
 */
export async function sendSMS({ to, message, type = 'general' }) {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: { to, message, type }
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to send SMS');

  return data;
}

/**
 * Send invite notification SMS
 */
export async function sendInviteNotification({ phone, householdName, activityName, proposedDate }) {
  const dateStr = proposedDate ? new Date(proposedDate).toLocaleDateString() : 'soon';
  const message = `${householdName} invited you to ${activityName || 'hang out'} on ${dateStr}! Open Circles to respond.`;

  return sendSMS({ to: phone, message, type: 'invite' });
}

export default supabase;
