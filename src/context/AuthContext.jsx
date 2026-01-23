import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  signInWithPhone as supabaseSignIn,
  verifyOtp as supabaseVerifyOtp,
  signInWithEmail as supabaseSignInEmail,
  signUpWithEmail as supabaseSignUpEmail,
  signInWithMagicLink as supabaseMagicLink,
  signOut as supabaseSignOut,
  getSession,
  getUser,
  getMyHousehold,
  createHousehold as supabaseCreateHousehold,
  updateHousehold as supabaseUpdateHousehold,
  onAuthStateChange
} from '../lib/supabase';
import { statusService } from '../services/supabaseService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - running in demo mode');
      setIsLoading(false);
      return;
    }

    // Check initial session
    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setIsAuthenticated(true);
        await loadHousehold();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setHousehold(null);
        setIsAuthenticated(false);
        setNeedsOnboarding(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const initAuth = async () => {
    try {
      const session = await getSession();

      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
        await loadHousehold();
      }
    } catch (error) {
      console.error('Auth init failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHousehold = async () => {
    try {
      const householdData = await getMyHousehold();
      if (householdData) {
        setHousehold(householdData);
        setNeedsOnboarding(false);
      } else {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Failed to load household:', error);
      setNeedsOnboarding(true);
    }
  };

  const requestOtp = useCallback(async (phone) => {
    return supabaseSignIn(phone);
  }, []);

  const verifyOtp = useCallback(async (phone, code) => {
    const data = await supabaseVerifyOtp(phone, code);
    // Auth state change listener will handle setting user/household
    return data;
  }, []);

  // Email auth methods
  const signInEmail = useCallback(async (email, password) => {
    const data = await supabaseSignInEmail(email, password);
    // Auth state change listener will handle setting user/household
    return data;
  }, []);

  const signUpEmail = useCallback(async (email, password) => {
    const data = await supabaseSignUpEmail(email, password);
    // Auth state change listener will handle setting user/household
    return data;
  }, []);

  const sendMagicLink = useCallback(async (email) => {
    const data = await supabaseMagicLink(email);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabaseSignOut();
    // Auth state change listener will handle clearing state
  }, []);

  const createHousehold = useCallback(async (data) => {
    const newHousehold = await supabaseCreateHousehold(data);
    setHousehold(newHousehold);
    setNeedsOnboarding(false);
    return newHousehold;
  }, []);

  const updateHousehold = useCallback(async (data) => {
    const updated = await supabaseUpdateHousehold(data);
    setHousehold(updated);
    return updated;
  }, []);

  const updateStatus = useCallback(async (status) => {
    const updated = await statusService.update(status);
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
    // Phone auth
    requestOtp,
    verifyOtp,
    // Email auth
    signInEmail,
    signUpEmail,
    sendMagicLink,
    // General
    logout,
    createHousehold,
    updateHousehold,
    updateStatus,
    refreshHousehold: loadHousehold
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
