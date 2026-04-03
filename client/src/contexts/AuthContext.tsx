import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import API_ENDPOINTS from "@/lib/api";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (username: string) => Promise<{ ok: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
  googleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.me, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      setUser(data);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (username: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        return false;
      }

      const registered = await response.json();
      const loginOk = await login(registered.username, password);
      return loginOk;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(API_ENDPOINTS.auth.logout, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (username: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.auth.profile, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to update profile" }));
        return { ok: false, error: data.error || "Failed to update profile" };
      }

      const updated = await response.json();
      setUser(updated);
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error while updating profile" };
    }
  };

  const googleLogin = () => {
    // Redirect to the Google OAuth endpoint on the backend
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        googleLogin,
        user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
