import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, ROLES } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if session exists in localStorage on mount
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    // Simulate brief realistic institutional auth verification
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = authService.login(email, password);
    setLoading(false);

    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        currentRole: user?.role || null,
        activeUser: user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Provide useRole alias for backwards compatibility
export const useRole = () => {
  const auth = useAuth();
  return {
    currentRole: auth.currentRole,
    activeUser: auth.activeUser,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    logout: auth.logout,
  };
};
