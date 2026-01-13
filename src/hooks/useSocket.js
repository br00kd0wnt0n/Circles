import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket() {
  const { household, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setIsConnected(true);

      // Join household room if we have one
      if (household?.id) {
        socketRef.current.emit('join:household', household.id);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // Join household room when household changes
  useEffect(() => {
    if (socketRef.current?.connected && household?.id) {
      socketRef.current.emit('join:household', household.id);
    }
  }, [household?.id]);

  // Subscribe to an event
  const subscribe = useCallback((event, callback) => {
    if (!socketRef.current) return () => {};

    // Store callback reference for cleanup
    const existingCallbacks = listenersRef.current.get(event) || [];
    existingCallbacks.push(callback);
    listenersRef.current.set(event, existingCallbacks);

    socketRef.current.on(event, callback);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
      const callbacks = listenersRef.current.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    isConnected,
    subscribe,
    emit
  };
}

/**
 * Hook to subscribe to status updates
 */
export function useStatusUpdates(onStatusUpdate) {
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribe = subscribe('status:update', onStatusUpdate);
    return unsubscribe;
  }, [subscribe, onStatusUpdate]);
}

/**
 * Hook to subscribe to invite events
 */
export function useInviteUpdates(onNewInvite, onInviteResponse) {
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubscribeNew = subscribe('invite:new', onNewInvite);
    const unsubscribeResponse = subscribe('invite:response', onInviteResponse);

    return () => {
      unsubscribeNew();
      unsubscribeResponse();
    };
  }, [subscribe, onNewInvite, onInviteResponse]);
}

export default useSocket;
