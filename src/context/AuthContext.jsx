import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase Authentication state observer
    const unsubscribe = authService.subscribeToAuthState((authUser) => {
      setUser(authUser);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const result = await authService.login(email, password);
    setLoading(false);

    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
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
