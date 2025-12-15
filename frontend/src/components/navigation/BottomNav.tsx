import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useI18nStore } from '../../stores/i18nStore';
import { HomeIcon, BookOpenIcon, UserIcon, UsersIcon, CogIcon } from '@heroicons/react/24/outline';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { Keyboard } from '@capacitor/keyboard';
import { useAndroidNavBarHeight } from '../../hooks/useAndroidNavBarHeight';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { counts, fetchNotificationCounts } = useNotificationStore();
  const { t } = useI18nStore();
  const { playSound } = useSoundEffects();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const androidNavBarHeight = useAndroidNavBarHeight();
  
  const handleLogout = () => {
    signOut();
    navigate('/auth');
  };

  // Hide bottom nav when keyboard is visible
  useEffect(() => {
    let showListener: any;
    let hideListener: any;

    // Only set up keyboard listeners on mobile (Capacitor)
    const setupKeyboardListeners = async () => {
      try {
        showListener = await Keyboard.addListener('keyboardWillShow', () => {
          setIsKeyboardVisible(true);
        });

        hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
        });
      } catch (error) {
        // Keyboard plugin not available on web, ignore
        console.log('Keyboard plugin not available (web environment)');
      }
    };

    setupKeyboardListeners();

    return () => {
      // Safely remove listeners if they exist
      if (showListener?.remove) {
        showListener.remove();
      }
      if (hideListener?.remove) {
        hideListener.remove();
      }
    };
  }, []);

  // Fetch notification counts when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id !== 'anonymous') {
      fetchNotificationCounts();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCounts();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id, fetchNotificationCounts]);

  // Listen for real-time new message events
  useEffect(() => {
    const handleNewMessage = () => {
      // Immediately refresh notification counts when a new message arrives
      if (isAuthenticated && user?.id !== 'anonymous') {
        fetchNotificationCounts();
      }
    };

    window.addEventListener('new-message', handleNewMessage);
    return () => window.removeEventListener('new-message', handleNewMessage);
  }, [isAuthenticated, user?.id, fetchNotificationCounts]);
  
  const getLabelColor = (iconName: string) => {
    switch (iconName) {
      case 'home': return 'text-purple-500';
      case 'games': return 'text-pink-500';
      case 'library': return 'text-blue-500';
      case 'profile': return 'text-green-500';
      case 'social': return 'text-orange-500';
      case 'settings': return 'text-red-500';
      default: return 'text-gray-600';
    }
  };
  
  const getIcon = (iconName: string, isActive: boolean) => {
    // Each icon gets its own unique color when inactive, white when active
    const getIconColor = () => {
      if (isActive) return 'text-white';
      
      switch (iconName) {
        case 'home': return 'text-purple-500';
        case 'games': return 'text-pink-500';
        case 'library': return 'text-blue-500';
        case 'profile': return 'text-green-500';
        case 'social': return 'text-orange-500';
        case 'settings': return 'text-red-500';
        default: return 'text-gray-600';
      }
    };
    
    const className = `${getIconColor()} transition-colors duration-300`;
    
    switch (iconName) {
      case 'home':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        );
      case 'games':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="M21.58,16.09l-1.09-7.66C20.21,6.46,18.52,5,16.53,5H7.47C5.48,5,3.79,6.46,3.51,8.43l-1.09,7.66 C2.2,17.63,3.39,19,4.94,19c0.68,0,1.32-0.27,1.8-0.75L9,16h6l2.25,2.25c0.48,0.48,1.13,0.75,1.8,0.75 C20.61,19,21.8,17.63,21.58,16.09z M11,11H9v2H8v-2H6v-1h2V8h1v2h2V11z M15,10c-0.55,0-1-0.45-1-1c0-0.55,0.45-1,1-1s1,0.45,1,1 C16,9.55,15.55,10,15,10z M17,13c-0.55,0-1-0.45-1-1c0-0.55,0.45-1,1-1s1,0.45,1,1C18,12.55,17.55,13,17,13z"/>
          </svg>
        );
      case 'social':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-3c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v7h3v4H4zm12-7.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3 1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        );
      case 'settings':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        );
      case 'library':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
          </svg>
        );
      case 'profile':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        );
      default:
        return null;
    }
  };
  
  const navItems = [
    { path: '/home', icon: 'home', label: t('nav.home') },
    { path: '/games', icon: 'games', label: 'Games' },
    { path: '/library', icon: 'library', label: t('nav.library') },
    { path: '/social', icon: 'social', label: t('nav.social') },
    { path: '/profile', icon: 'profile', label: t('nav.profile') },
  ];

  return (
    <nav 
      className={`nav-glass ${isKeyboardVisible ? 'translate-y-full' : ''}`}
      style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        display: 'block',
        visibility: 'visible',
        transform: isKeyboardVisible ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 300ms',
        minHeight: '60px',
        height: 'auto',
        padding: `12px 16px ${12 + androidNavBarHeight}px 16px`
      }}
    >
      {/* Navigation Items */}
      <div style={{ padding: 0 }}>
        <div className="flex justify-around items-center max-w-md mx-auto" style={{ minHeight: '48px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            // Show notification badge on Social icon for friend requests, unread messages, AND collaboration invites
            const hasSocialNotification = item.icon === 'social' && (counts.friend_requests > 0 || counts.unread_messages > 0 || counts.collaboration_invites > 0);
            const totalSocialCount = counts.friend_requests + counts.unread_messages + counts.collaboration_invites;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => playSound('tab-switch')}
                className={`nav-item flex flex-col items-center ${
                  isActive ? 'active' : ''
                }`}
              >
                <div className="mb-1 relative">
                  {getIcon(item.icon, isActive)}
                  {hasSocialNotification && (
                    <span className="notification-badge">
                      {totalSocialCount > 9 ? '9+' : totalSocialCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isActive ? 'text-white' : getLabelColor(item.icon)
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
