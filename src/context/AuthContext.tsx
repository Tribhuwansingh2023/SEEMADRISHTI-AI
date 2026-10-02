import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  loginOperator,
  registerOperator,
  logoutOperator,
  getCurrentOperator,
  updateOperatorProfile,
  UpdateProfilePayload,
  RegisterPayload,
  getAuthToken,
  setAuthToken,
} from '../services/api';

export type PortalMode = 'landing' | 'auth' | 'app';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentPortal: PortalMode;
  setPortal: (portal: PortalMode) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  login: (username: string, password: string) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  logout: (onLoggedOut?: () => void) => Promise<void>;

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPortal, setCurrentPortal] = useState<PortalMode>('landing');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Verify stored session on boot
  useEffect(() => {
    const checkActiveSession = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await getCurrentOperator();
        if (res.success && res.user) {
          setUser(res.user);
          setToken(storedToken);
          // If already logged in, navigate straight to dashboard
          setCurrentPortal('app');
        } else {
          setAuthToken(null);
          setToken(null);
          setUser(null);
          setCurrentPortal('landing');
        }
      } catch (err) {
        console.warn('[AUTH] Offline or token validation warning, clearing stale session:', err);
        setAuthToken(null);
        setToken(null);
        setUser(null);
        setCurrentPortal('landing');
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveSession();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await loginOperator(username, password);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setCurrentPortal('app');
        return res.user;
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await registerOperator(payload);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setCurrentPortal('app');
        return res.user;
      }
      throw new Error(res.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await updateOperatorProfile(payload);
      if (res.success && res.user) {
        setUser(res.user);
        return res.user;
      }
      throw new Error(res.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (onLoggedOut?: () => void) => {
    setIsLoading(true);
    try {
      await logoutOperator();
    } catch {
      // ignore network errors on logout
    } finally {
      sessionStorage.removeItem('seemadrishti_portal_access_granted');
      setUser(null);
      setToken(null);
      setAuthToken(null);
      setCurrentPortal('landing');
      setIsLoading(false);
      // Call the optional callback (e.g. to reset PIN lock and navigate)
      onLoggedOut?.();
    }
  }, []);



  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    currentPortal,
    setPortal: setCurrentPortal,
    isProfileModalOpen,
    setIsProfileModalOpen,
    login,
    register,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
