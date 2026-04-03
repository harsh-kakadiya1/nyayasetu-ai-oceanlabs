import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API_ENDPOINTS from '@/lib/api';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('[AuthContext] Checking authentication status...');
      const response = await fetch(API_ENDPOINTS.auth.me, {
        credentials: 'include',
      });
      console.log(`[AuthContext] Auth check response status: ${response.status}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log(`[AuthContext] User authenticated: ${userData.username}`);
        setUser(userData);
      } else {
        console.log('[AuthContext] User not authenticated - manual login required');
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log(`[AuthContext] Attempting login for user: ${username}`);
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      console.log(`[AuthContext] Login response status: ${response.status}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log(`[AuthContext] Login successful for user: ${userData.username}`);
        setUser(userData);
        return true;
      } else {
        const errorData = await response.text();
        console.error(`[AuthContext] Login failed: ${response.status} - ${errorData}`);
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return false;
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(API_ENDPOINTS.auth.logout, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        checkAuth,
        isLoading,
      }}
    >
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