'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { UserEntity, UserRole, AuthResponseDto } from '@/types/api';
import { toast } from 'react-hot-toast';

export interface AuthContextType {
  // User data from backend
  user: UserEntity | null;
  
  // Authentication state
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // User roles and permissions
  role: UserRole | null;
  isAdmin: boolean;
  isClient: boolean;
  isRemplacant: boolean;
  
  // Authentication methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  // Token management
  getAuthToken: () => string | null;
  hasValidToken: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'solugarde_access_token';
const REFRESH_TOKEN_KEY = 'solugarde_refresh_token';
const USER_KEY = 'solugarde_user';
const REMEMBER_ME_KEY = 'solugarde_remember_me';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Derived state
  const isAuthenticated = Boolean(user);
  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isClient = role === 'client';
  const isRemplacant = role === 'remplacant';

  // Token management functions
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    // Prefer sessionStorage if present (non-remembered sessions), else fallback to localStorage
    return (
      sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem(ACCESS_TOKEN_KEY)
    );
  };

  const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return (
      sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
      localStorage.getItem(REFRESH_TOKEN_KEY)
    );
  };

  const setTokens = (accessToken: string, refreshToken: string, rememberMe?: boolean) => {
    if (typeof window === 'undefined') return;
    // Determine storage target
    const remembered = typeof rememberMe === 'boolean'
      ? rememberMe
      : localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    // Persist preference in localStorage so we can apply it after reloads
    localStorage.setItem(REMEMBER_ME_KEY, remembered ? 'true' : 'false');

    const target = remembered ? localStorage : sessionStorage;
    const other = remembered ? sessionStorage : localStorage;

    // Write to target and clean up the other storage to avoid stale values
    target.setItem(ACCESS_TOKEN_KEY, accessToken);
    target.setItem(REFRESH_TOKEN_KEY, refreshToken);
    try {
      other.removeItem(ACCESS_TOKEN_KEY);
      other.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
  };

  const clearTokens = () => {
    if (typeof window === 'undefined') return;
    // Clear from both storage scopes for safety
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {}
    // Clear remember-me preference on logout
    try { localStorage.removeItem(REMEMBER_ME_KEY); } catch {}
  };

  const hasValidToken = (): boolean => {
    const token = getAuthToken();
    if (!token) return false;
    
    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  const saveUserToStorage = (userData: UserEntity) => {
    if (typeof window === 'undefined') return;
    const remembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const target = remembered ? localStorage : sessionStorage;
    const other = remembered ? sessionStorage : localStorage;
    target.setItem(USER_KEY, JSON.stringify(userData));
    try { other.removeItem(USER_KEY); } catch {}
  };

  const getUserFromStorage = (): UserEntity | null => {
    if (typeof window === 'undefined') return null;
    try {
      const userData = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async (): Promise<UserEntity | null> => {
    try {
      const userProfile = await apiClient.getMe();
      saveUserToStorage(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      
      // If token is invalid, clear everything
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        clearTokens();
        return null;
      }
      
      throw error;
    }
  };

  // Refresh tokens
  const refreshTokens = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await apiClient.refreshToken();
      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      saveUserToStorage(response.user);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokens();
      setUser(null);
      return false;
    }
  };

  // Refresh user data
  const refreshUserData = async (): Promise<void> => {
    if (!hasValidToken()) return;
    
    try {
      setIsLoading(true);
      const userProfile = await fetchUserProfile();
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      toast.error('Failed to refresh user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response: AuthResponseDto = await apiClient.login({ email, password });
      
      // Store tokens and user data
      setTokens(response.accessToken, response.refreshToken, rememberMe);
      setUser(response.user);
      saveUserToStorage(response.user);
      
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call backend logout endpoint if we have a valid token
      if (hasValidToken()) {
        try {
          await apiClient.logout();
        } catch (error) {
          console.warn('Backend logout failed (continuing with local logout):', error);
        }
      }
      
      // Clear local storage and state
      clearTokens();
      setUser(null);
      
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local data
      clearTokens();
      setUser(null);
      toast.error('Logout completed');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if we have a valid token
        if (hasValidToken()) {
          // Try to get user from storage first (for faster UI)
          const cachedUser = getUserFromStorage();
          if (cachedUser) {
            setUser(cachedUser);
          }
          
          // Then fetch fresh user data from API
          try {
            const userProfile = await fetchUserProfile();
            setUser(userProfile);
          } catch (error) {
            console.error('Failed to fetch user profile on init:', error);
            
            // Try to refresh tokens
            const refreshed = await refreshTokens();
            if (!refreshed) {
              // If refresh fails, clear everything
              clearTokens();
              setUser(null);
            }
          }
        } else {
          // No valid token, check if we have a refresh token
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            const refreshed = await refreshTokens();
            if (!refreshed) {
              clearTokens();
              setUser(null);
            }
          } else {
            // No tokens at all
            clearTokens();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh tokens when they're about to expire
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiry = () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;
        
        // Refresh if token expires in less than 5 minutes
        if (timeUntilExpiry < 300) {
          refreshTokens();
        }
      } catch (error) {
        console.error('Token parsing error:', error);
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    role,
    isAdmin,
    isClient,
    isRemplacant,
    login,
    logout,
    refreshUserData,
    getAuthToken,
    hasValidToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
