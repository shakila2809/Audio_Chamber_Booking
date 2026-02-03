import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const { user } = await api.getCurrentUser();
          setUser(user);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = useCallback(async (email, password) => {
    try {
      const { user, token } = await api.login(email, password);
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const { user, token } = await api.register(name, email, password);
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  }, []);

  const loginWithMicrosoft = useCallback(async () => {
    try {
      const { authUrl } = await api.getMicrosoftAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Microsoft login error:', error);
    }
  }, []);

  const handleAuthCallback = useCallback(async (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      try {
        const { user } = await api.getCurrentUser();
        setUser(user);
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    }
    return { success: false };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      loginWithMicrosoft,
      handleAuthCallback,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}