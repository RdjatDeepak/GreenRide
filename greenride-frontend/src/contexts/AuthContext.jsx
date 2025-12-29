import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi, getStoredUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing auth token and user data
    const token = localStorage.getItem('authToken');
    const storedUser = getStoredUser();
    
    if (token && storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await loginApi(credentials);
      
      if (result.success) {
        const userData = {
          email: result.data.email,
          roles: result.data.roles,
          name: result.data.name,
        };
        setUser(userData);
        setIsLoading(false);
        return { success: true, user: userData };
      } else {
        setError(result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await registerApi(userData);

      if (result.success) {
        // Set user from registration data directly
        const userInfo = {
          email: userData.email,
          roles: ['ROLE_PASSENGER'], // Default role
          name: userData.name,
        };
        setUser(userInfo);
        setIsLoading(false);
        return { success: true, user: userInfo };
      } else {
        setError(result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    logoutApi();
    setUser(null);
    setError(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      error,
      login, 
      register,
      logout,
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
};
