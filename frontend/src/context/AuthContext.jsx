import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;
  const navigate = useNavigate();

  // Load user on mount or token change
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

  // Login function (used by both user and admin login pages)
  const login = useCallback(async (email, password) => {
    try {
      const { user, token } = await api.login(email, password);
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      // Redirect based on role
      if (user.role === 'admin' || user.role === 'owner') {
        navigate('/admin');
      } else {
        navigate('/');
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  }, [navigate]);

  // Registration
  const register = useCallback(async (name, email, password) => {
    try {
      const { user, token } = await api.register(name, email, password);
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      // Redirect after registration
      if (user.role === 'admin' || user.role === 'owner') {
        navigate('/admin');
      } else {
        navigate('/');
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  }, [navigate]);

  // Microsoft OAuth login
  const loginWithMicrosoft = useCallback(async () => {
    try {
      const { authUrl } = await api.getMicrosoftAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Microsoft login error:', error);
    }
  }, []);

  // Handle Microsoft OAuth callback
  const handleAuthCallback = useCallback(async (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      try {
        const { user } = await api.getCurrentUser();
        setUser(user);

        // Redirect based on role
        if (user.role === 'admin' || user.role === 'owner') {
          navigate('/admin');
        } else {
          navigate('/');
        }

        return { success: true, user };
      } catch (error) {
        return { success: false };
      }
    }
    return { success: false };
  }, [navigate]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

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
