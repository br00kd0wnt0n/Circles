import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';
import householdsApi from '../services/householdsApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    checkAuth();

    // Listen for logout events from API client
    const handleLogout = () => {
      setUser(null);
      setHousehold(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const checkAuth = async () => {
    if (!authApi.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      setUser(response.user);
      setIsAuthenticated(true);

      if (response.hasHousehold) {
        const householdData = await householdsApi.getMyHousehold();
        setHousehold(householdData);
        setNeedsOnboarding(false);
      } else {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = useCallback(async (phone) => {
    return authApi.requestOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone, code) => {
    const response = await authApi.verifyOtp(phone, code);
    setUser(response.user);
    setIsAuthenticated(true);

    if (response.hasHousehold) {
      const householdData = await householdsApi.getMyHousehold();
      setHousehold(householdData);
      setNeedsOnboarding(false);
    } else {
      setNeedsOnboarding(true);
    }

    return response;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setHousehold(null);
    setIsAuthenticated(false);
    setNeedsOnboarding(false);
  }, []);

  const createHousehold = useCallback(async (data) => {
    const newHousehold = await householdsApi.create(data);
    setHousehold(newHousehold);
    setNeedsOnboarding(false);
    return newHousehold;
  }, []);

  const updateHousehold = useCallback(async (data) => {
    const updated = await householdsApi.update(data);
    setHousehold(updated);
    return updated;
  }, []);

  const updateStatus = useCallback(async (status) => {
    const updated = await householdsApi.updateStatus(status);
    setHousehold(prev => ({
      ...prev,
      status: updated
    }));
    return updated;
  }, []);

  const value = {
    user,
    household,
    isLoading,
    isAuthenticated,
    needsOnboarding,
    requestOtp,
    verifyOtp,
    logout,
    createHousehold,
    updateHousehold,
    updateStatus,
    refreshHousehold: checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
