import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  const showToast = useCallback(({ title, message, type = 'success', duration, action, onTap, persistent = false }) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    setToast({ title, message, type, action, onTap });

    // Don't auto-dismiss persistent toasts (like invites)
    if (!persistent && type !== 'invite') {
      const id = setTimeout(() => {
        setToast(null);
      }, duration || 3000);
      setTimeoutId(id);
    }
  }, [timeoutId]);

  const dismissToast = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setToast(null);
  }, [timeoutId]);

  // Convenience methods
  const showSuccess = useCallback((title, message) => {
    showToast({ title, message, type: 'success' });
  }, [showToast]);

  const showInvite = useCallback((title, message, onTap) => {
    showToast({ title, message, type: 'invite', onTap, duration: 5000 });
  }, [showToast]);

  const showInfo = useCallback((title, message) => {
    showToast({ title, message, type: 'info' });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{
      toast,
      showToast,
      dismissToast,
      showSuccess,
      showInvite,
      showInfo
    }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
