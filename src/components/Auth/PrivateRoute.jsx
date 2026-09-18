// ============================================================================
// Private Route Component
// ============================================================================
// File: src/components/auth/PrivateRoute.jsx
// Purpose: Protect routes that require authentication
// Status: Production-Ready ✅

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../common/LoadingSpinner';

const PrivateRoute = ({ children, adminOnly = false }) => {
  // Use specific selectors to prevent undefined variable crashes
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // FIXED: Changed from /auth/login to /login to match App.jsx routes
    return <Navigate to="/login" replace />; 
  }

  if (adminOnly && !user?.is_admin) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PrivateRoute;