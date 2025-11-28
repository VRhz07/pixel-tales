import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAccountSwitchStore } from '../../stores/accountSwitchStore';

interface ParentRouteProps {
  children: React.ReactNode;
}

const ParentRoute: React.FC<ParentRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { activeAccountType } = useAccountSwitchStore();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has parent or teacher privileges
  const userType = user?.profile?.user_type || user?.user_type;
  
  // If user is not a parent or teacher, redirect to home
  if (userType !== 'parent' && userType !== 'teacher') {
    console.warn('Unauthorized access attempt to parent route by:', userType);
    return <Navigate to="/home" replace />;
  }

  // Extra security: Check if currently viewing as child
  // This prevents children from accessing parent dashboard even if parent_session exists
  const parentSession = localStorage.getItem('parent_session');
  if (parentSession && activeAccountType === 'child') {
    console.warn('Child account attempted to access parent route');
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ParentRoute;
