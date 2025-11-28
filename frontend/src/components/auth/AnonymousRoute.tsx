import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface AnonymousRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // Some pages might require full authentication
}

const AnonymousRoute: React.FC<AnonymousRouteProps> = ({ children, requireAuth = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // If no user at all, redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If page requires full authentication and user is anonymous, redirect to auth
  if (requireAuth && !isAuthenticated && user.id === 'anonymous') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Allow access for authenticated users or anonymous users (depending on requireAuth)
  return <>{children}</>;
};

export default AnonymousRoute;
