import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import contactsApi from '../services/contactsApi';
import circlesApi from '../services/circlesApi';
import invitesApi from '../services/invitesApi';
import offersApi from '../services/offersApi';
import eventsApi from '../services/eventsApi';
import statusApi from '../services/statusApi';
import { useSocket, useStatusUpdates, useInviteUpdates } from '../hooks/useSocket';

// Import seed data as fallback for demo mode
import { currentHousehold as seedHousehold, friendHouseholds, circles as seedCircles } from '../data/seedData';

// Check if demo mode is enabled via environment variable
// Default to true for backwards compatibility
const DEMO_MODE_ENABLED = import.meta.env.VITE_DEMO_MODE !== 'false';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { isAuthenticated, household: authHousehold, needsOnboarding, updateHousehold: authUpdateHousehold } = useAuth();

  // Core data state
  const [contacts, setContacts] = useState([]);
  const [circles, setCircles] = useState([]);
  const [invites, setInvites] = useState({ sent: [], received: [] });
  const [offers, setOffers] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Demo mode state (uses seedData when not authenticated AND demo mode is enabled)
  const [demoMode, setDemoMode] = useState(!isAuthenticated && DEMO_MODE_ENABLED);
  const [demoInvites, setDemoInvites] = useState([]);

  // Household data (from auth context or demo if enabled)
  const household = authHousehold || (DEMO_MODE_ENABLED ? seedHousehold : null);

  // Status state
  const [myStatus, setMyStatusState] = useState({
    state: household?.status?.state || 'available',
    note: household?.status?.note || '',
    timeWindow: household?.status?.timeWindow || ''
  });

  // Socket connection
  const { isConnected } = useSocket();

  // Load data on mount or auth change
  useEffect(() => {
    if (isAuthenticated && !needsOnboarding && authHousehold) {
      // User is authenticated and has a household - load real data
      setDemoMode(false);
      loadAllData();
    } else if (isAuthenticated && needsOnboarding) {
      // User is authenticated but needs to create household - show empty state
      setDemoMode(false);
      setIsLoading(false);
      setContacts([]);
      setCircles([]);
      setInvites({ sent: [], received: [] });
    } else if (DEMO_MODE_ENABLED) {
      setDemoMode(true);
      loadDemoData();
    } else {
      // Production mode without auth - show empty state
      setDemoMode(false);
      setIsLoading(false);
      setContacts([]);
      setCircles([]);
      setInvites({ sent: [], received: [] });
      loadPublicData(); // Still load offers/events
    }
  }, [isAuthenticated, needsOnboarding, authHousehold]);

  // Load all data from API
  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);

    // Get zipCode from household for location-based filtering
    const zipCode = authHousehold?.zipCode;

    try {
      const [contactsData, circlesData, invitesData, offersData, eventsData] = await Promise.all([
        contactsApi.getAll(),
        circlesApi.getAll(),
        invitesApi.getAll(),
        offersApi.getAll({ zipCode }),
        eventsApi.getAll({ zipCode })
      ]);

      setContacts(contactsData);
      setCircles(circlesData);
      setInvites(invitesData);
      setOffers(offersData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
      // Fall back to demo mode on error only if demo mode is enabled
      if (DEMO_MODE_ENABLED) {
        loadDemoData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load demo data from seedData
  const loadDemoData = () => {
    // Transform friendHouseholds to contact format
    const demoContacts = friendHouseholds.map(h => ({
      id: h.id,
      displayName: h.householdName,
      avatar: h.members?.[0]?.avatar || '👨',
      isAppUser: true,
      linkedHouseholdId: h.id,
      householdName: h.householdName,
      status: h.status,
      circles: []
    }));

    // Assign contacts to circles based on seedCircles
    const demoCircles = seedCircles.map(c => ({
      ...c,
      memberCount: c.memberIds?.length || 0
    }));

    // Update contacts with their circle assignments
    demoContacts.forEach(contact => {
      const memberCircles = demoCircles.filter(c =>
        c.memberIds?.includes(contact.id)
      );
      contact.circles = memberCircles.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color
      }));
    });

    setContacts(demoContacts);
    setCircles(demoCircles);
    setInvites({ sent: [], received: demoInvites });

    // Load offers/events from API even in demo mode (public endpoints)
    loadPublicData();
    setIsLoading(false);
  };

  // Load public data (offers/events) - works without auth
  const loadPublicData = async () => {
    try {
      const [offersData, eventsData] = await Promise.all([
        offersApi.getAll(),
        eventsApi.getAll()
      ]);
      setOffers(offersData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Failed to load public data:', err);
      // Use empty arrays as fallback
      setOffers([]);
      setEvents([]);
    }
  };

  // Real-time status updates
  useStatusUpdates(useCallback((update) => {
    setContacts(prev => prev.map(contact =>
      contact.linkedHouseholdId === update.householdId
        ? { ...contact, status: update.status }
        : contact
    ));
  }, []));

  // Real-time invite updates
  useInviteUpdates(
    useCallback((newInvite) => {
      if (demoMode) {
        setDemoInvites(prev => [...prev, {
          id: newInvite.invite.id,
          type: 'received',
          ...newInvite.invite,
          creator: newInvite.from,
          myResponse: 'pending'
        }]);
      } else {
        setInvites(prev => ({
          ...prev,
          received: [...prev.received, newInvite]
        }));
      }
    }, [demoMode]),
    useCallback((response) => {
      setInvites(prev => ({
        ...prev,
        sent: prev.sent.map(inv =>
          inv.id === response.inviteId
            ? {
                ...inv,
                recipients: inv.recipients?.map(r =>
                  r.householdId === response.householdId || r.household_id === response.householdId
                    ? { ...r, response: response.response }
                    : r
                )
              }
            : inv
        )
      }));
    }, [])
  );

  // Update my status
  const setMyStatus = useCallback(async (newStatus) => {
    setMyStatusState(newStatus);

    if (!demoMode) {
      try {
        await statusApi.update(newStatus);
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }
  }, [demoMode]);

  // Add invite (demo mode or API)
  const addInvite = useCallback(async (inviteData) => {
    if (demoMode) {
      const newInvite = {
        id: `demo-${Date.now()}`,
        type: 'sent',
        ...inviteData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setInvites(prev => ({
        ...prev,
        sent: [...prev.sent, newInvite]
      }));
      return newInvite;
    }

    try {
      const created = await invitesApi.create(inviteData);
      setInvites(prev => ({
        ...prev,
        sent: [...prev.sent, created]
      }));
      return created;
    } catch (err) {
      console.error('Failed to create invite:', err);
      throw err;
    }
  }, [demoMode]);

  // Respond to invite
  const respondToInvite = useCallback(async (inviteId, response) => {
    if (demoMode) {
      setDemoInvites(prev => prev.map(inv =>
        inv.id === inviteId ? { ...inv, myResponse: response } : inv
      ));
      return;
    }

    try {
      await invitesApi.respond(inviteId, response);
      setInvites(prev => ({
        ...prev,
        received: prev.received.map(inv =>
          inv.id === inviteId ? { ...inv, myResponse: response } : inv
        )
      }));
    } catch (err) {
      console.error('Failed to respond to invite:', err);
      throw err;
    }
  }, [demoMode]);

  // Add a contact
  const addContact = useCallback(async (contactData) => {
    if (demoMode) {
      const newContact = {
        id: `demo-${Date.now()}`,
        displayName: contactData.name || contactData.displayName,
        avatar: '👤',
        isAppUser: false,
        status: null,
        circles: []
      };
      setContacts(prev => [...prev, newContact]);
      return newContact;
    }

    try {
      const created = await contactsApi.create({
        displayName: contactData.name || contactData.displayName,
        phone: contactData.phone || undefined
      });
      setContacts(prev => [...prev, { ...created, circles: [] }]);
      return created;
    } catch (err) {
      console.error('Failed to create contact:', err);
      throw err;
    }
  }, [demoMode]);

  // Add a circle
  const addCircle = useCallback(async (circleData) => {
    if (demoMode) {
      const newCircle = {
        id: `demo-${Date.now()}`,
        name: circleData.name,
        color: circleData.color || '#9CAF88',
        memberCount: 0
      };
      setCircles(prev => [...prev, newCircle]);
      return newCircle;
    }

    try {
      const created = await circlesApi.create(circleData);
      setCircles(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to create circle:', err);
      throw err;
    }
  }, [demoMode]);

  // Update a circle
  const updateCircle = useCallback(async (circleId, updates) => {
    if (demoMode) {
      setCircles(prev => prev.map(c =>
        c.id === circleId ? { ...c, ...updates } : c
      ));
      return;
    }

    try {
      const updated = await circlesApi.update(circleId, updates);
      setCircles(prev => prev.map(c =>
        c.id === circleId ? { ...c, ...updated } : c
      ));
      // If members were updated, refresh contacts
      if (updates.memberIds) {
        const refreshed = await contactsApi.getAll();
        setContacts(refreshed);
      }
      return updated;
    } catch (err) {
      console.error('Failed to update circle:', err);
      throw err;
    }
  }, [demoMode]);

  // Update a contact
  const updateContact = useCallback(async (contactId, updates) => {
    if (demoMode) {
      setContacts(prev => prev.map(c =>
        c.id === contactId ? { ...c, ...updates } : c
      ));
      return;
    }

    try {
      // Handle circle membership updates
      if (updates.addToCircle) {
        await circlesApi.addMember(updates.addToCircle, contactId);
        // Refresh contacts to get updated circle list
        const refreshed = await contactsApi.getAll();
        setContacts(refreshed);
        return;
      }
      if (updates.removeFromCircle) {
        await circlesApi.removeMember(updates.removeFromCircle, contactId);
        // Refresh contacts to get updated circle list
        const refreshed = await contactsApi.getAll();
        setContacts(refreshed);
        return;
      }

      // Regular update
      const updated = await contactsApi.update(contactId, updates);
      setContacts(prev => prev.map(c =>
        c.id === contactId ? { ...c, ...updated } : c
      ));
      return updated;
    } catch (err) {
      console.error('Failed to update contact:', err);
      throw err;
    }
  }, [demoMode]);

  // Delete a contact
  const deleteContact = useCallback(async (contactId) => {
    if (demoMode) {
      setContacts(prev => prev.filter(c => c.id !== contactId));
      return;
    }

    try {
      await contactsApi.delete(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (err) {
      console.error('Failed to delete contact:', err);
      throw err;
    }
  }, [demoMode]);

  // Refresh data
  const refresh = useCallback(() => {
    if (isAuthenticated) {
      loadAllData();
    } else if (DEMO_MODE_ENABLED) {
      loadDemoData();
    } else {
      loadPublicData();
    }
  }, [isAuthenticated]);

  const value = {
    // Data
    household,
    contacts,
    circles,
    invites: demoMode
      ? { sent: invites.sent, received: demoInvites }
      : invites,
    offers,
    events,
    myStatus,

    // State
    isLoading,
    error,
    demoMode,
    isConnected,

    // Actions
    setMyStatus,
    addInvite,
    respondToInvite,
    addContact,
    updateContact,
    deleteContact,
    addCircle,
    updateCircle,
    refresh,

    // For compatibility with existing useAppState
    myHousehold: household,
    updateHousehold: authUpdateHousehold,
    // Transform contacts to match friendHouseholds shape for the UI
    // Use consistent transformation for both demo and API mode
    friendHouseholds: (contacts || []).map(contact => ({
          id: contact.id,
          householdName: contact.displayName || contact.householdName || 'Unknown',
          members: [{
            id: contact.id,
            name: contact.displayName || 'Unknown',
            avatar: contact.avatar || '👤',
            role: 'parent'
          }],
          status: contact.status || { state: 'available', note: null, timeWindow: null },
          circleIds: (contact.circles || []).map(c => c.id),
          // Keep original contact data for reference
          isAppUser: contact.isAppUser,
          linkedHouseholdId: contact.linkedHouseholdId,
          phone: contact.phone
        })),

    // Production mode flag (no demo data)
    isProductionMode: !DEMO_MODE_ENABLED,
    requiresAuth: !DEMO_MODE_ENABLED && !isAuthenticated
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
