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

  // SECURITY FIX: Check the ACTUAL logged-in user type, not the viewed profile
  const actualUserType = user?.user_type || user?.profile?.user_type;
  
  // CRITICAL: If the actual logged-in user is a child, NEVER allow parent route access
  if (actualUserType === 'child') {
    console.error('❌ SECURITY: Child user attempted to access parent route!', {
      userId: user?.id,
      userName: user?.name,
      userType: actualUserType
    });
    return <Navigate to="/home" replace />;
  }
  
  // If user is not a parent or teacher, redirect to home
  if (actualUserType !== 'parent' && actualUserType !== 'teacher') {
    console.warn('Unauthorized access attempt to parent route by:', actualUserType);
    return <Navigate to="/home" replace />;
  }

  // Extra security: If currently viewing as child, don't allow parent dashboard access
  // This is for when parent switches to child view - they must switch back to access parent dashboard
  if (activeAccountType === 'child') {
    console.warn('Currently viewing as child - redirecting from parent route');
    return <Navigate to="/home" replace />;
  }
  
  // Validate parent_session if it exists
  const parentSession = localStorage.getItem('parent_session');
  if (parentSession) {
    try {
      const sessionData = JSON.parse(parentSession);
      // If there's a parent session, verify it matches the current user
      if (sessionData.parentId && sessionData.parentId !== user?.id) {
        console.error('❌ SECURITY: parent_session mismatch detected!', {
          sessionParentId: sessionData.parentId,
          currentUserId: user?.id
        });
        localStorage.removeItem('parent_session');
        // Continue anyway since actual user is parent/teacher
      }
    } catch (e) {
      // Corrupted session
      localStorage.removeItem('parent_session');
    }
  }

  return <>{children}</>;
};

export default ParentRoute;
