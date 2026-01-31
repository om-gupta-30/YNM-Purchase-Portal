'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { UserPayload } from '@/types';

interface AuthContextType {
  user: UserPayload | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely get stored auth data
function getStoredAuth(): { token: string | null; user: UserPayload | null } {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }
  
  try {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      return { token: storedToken, user: JSON.parse(storedUser) };
    }
  } catch {
    // Invalid stored data, clear it
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
  
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored.token && stored.user) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setToken(stored.token);
      setUser(stored.user);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('activeUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('sessionActive');
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('activeUser', data.user.username);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('sessionActive', 'true');
        
        return { success: true };
      }

      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, []);

  // Memoized authFetch to prevent re-renders - THIS FIXES THE SLOW RESPONSE ISSUE
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('authToken');
    
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  }, [logout]);

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    authFetch,
  }), [user, token, isLoading, login, logout, authFetch]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Helper hook for API calls with auth - now uses memoized version from context
export function useAuthFetch() {
  const { authFetch } = useAuth();
  return authFetch;
}

