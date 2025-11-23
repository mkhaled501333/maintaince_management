'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from './api-client';
import { User, LoginRequest, LoginResponse, AuthContextType } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const isAuthenticated = !!user;

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check for existing token on mount (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isHydrated]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      const { user, tokens } = response.data;
      
      // Store tokens (only if hydrated)
      if (isHydrated) {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
      }
      
      // Set user
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Clear tokens and user (only if hydrated)
    if (isHydrated) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    setUser(null);
    
    // Call logout endpoint (optional)
    apiClient.post('/auth/logout').catch(() => {
      // Ignore errors on logout
    });
  };

  const refreshToken = async () => {
    if (!isHydrated) {
      throw new Error('Not hydrated yet');
    }
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      const { access_token, refresh_token: newRefreshToken } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', newRefreshToken);
    } catch (error) {
      // Refresh failed, logout
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isLoading || !isHydrated, // Keep loading until hydrated
    login,
    logout,
    refreshToken,
  };

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
