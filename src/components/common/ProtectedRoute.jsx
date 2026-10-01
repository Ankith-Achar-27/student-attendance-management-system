import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../services/authService';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Unauthenticated -> redirect to /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role unauthorized -> redirect to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === ROLES.FACULTY) {
      return <Navigate to="/faculty/dashboard" replace />;
    }
    if (user.role === ROLES.STUDENT) {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // 3. Authorized -> render content
  return <Outlet />;
};
