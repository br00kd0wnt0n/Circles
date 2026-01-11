import { useState } from 'react';
import { currentHousehold as defaultHousehold } from '../data/seedData';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export function useAppState() {
  const [myHousehold, setMyHousehold] = useLocalStorage('circles-my-household', defaultHousehold);

  const [myStatus, setMyStatus] = useLocalStorage('circles-my-status', {
    state: 'available',
    timeWindow: null,
    note: null
  });

  // Default example hangout
  const defaultInvites = [
    {
      id: 'example-1',
      title: 'Backyard BBQ',
      activity: 'Grill out and games',
      date: 'Saturday',
      time: '4:00 PM',
      location: 'Our place',
      invitedHouseholds: ['barretts', 'sachs'],
      createdBy: 'downtons',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      responses: {
        'barretts': 'accepted',
        'sachs': 'pending'
      },
      status: 'sent'
    }
  ];

  const [invites, setInvites] = useLocalStorage('circles-invites', defaultInvites);

  const addInvite = (invite) => {
    const newInvite = {
      ...invite,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      responses: invite.invitedHouseholds.reduce((acc, id) => {
        acc[id] = 'pending';
        return acc;
      }, {}),
      status: 'sent'
    };
    setInvites(prev => [newInvite, ...prev]);
    return newInvite;
  };

  const respondToInvite = (inviteId, response) => {
    setInvites(prev => prev.map(invite =>
      invite.id === inviteId
        ? { ...invite, responses: { ...invite.responses, [myHousehold.id]: response } }
        : invite
    ));
  };

  const updateHousehold = (updates) => {
    setMyHousehold(prev => ({ ...prev, ...updates }));
  };

  return {
    myHousehold,
    updateHousehold,
    myStatus,
    setMyStatus,
    invites,
    addInvite,
    respondToInvite
  };
}
