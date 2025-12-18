import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useCapacitorBackButton } from './hooks/useCapacitorBackButton';
import { useBackgroundMusic } from './hooks/useBackgroundMusic';
import { useEffect, useState } from 'react';
import BottomNav from './components/navigation/BottomNav';
import HomePage from './components/pages/HomePage';
import LibraryPage from './components/pages/LibraryPage';
import ProfilePage from './components/pages/ProfilePage';
import EnhancedSocialPage from './components/pages/EnhancedSocialPage';
import MessagingPage from './components/pages/MessagingPage';
import SettingsPage from './components/pages/SettingsPage';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AnonymousRoute from './components/auth/AnonymousRoute';
import ParentRoute from './components/auth/ParentRoute';
import OfflineStoriesPage from './pages/OfflineStoriesPage';
import OnlineStoriesPage from './pages/OnlineStoriesPage';
import CharactersLibraryPage from './pages/CharactersLibraryPage';
import YourWorksPage from './pages/YourWorksPage';
import ManualStoryCreationPage from './pages/ManualStoryCreationPage';
import CanvasDrawingPage from './pages/CanvasDrawingPage';
import CoverImageCanvasPage from './pages/CoverImageCanvasPage';
import StoryReaderPage from './pages/StoryReaderPage';
import PublicLibraryPage from './pages/PublicLibraryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CollaborationWaitingPage from './pages/CollaborationWaitingPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import ParentSettingsPage from './pages/ParentSettingsPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherSettingsPage from './pages/TeacherSettingsPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import GamesPage from './pages/GamesPage';
import StoryGamesPage from './pages/StoryGamesPage';
import GamePlayPage from './pages/GamePlayPage';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { storage } from './utils/storage';
import { CollaborationInvitationsContainer, CollaborationInvite } from './components/collaboration/CollaborationInvitation';
import CollaborationInviteNotification from './components/collaboration/CollaborationInviteNotification';
import CollaborationWaitingScreen from './components/collaboration/CollaborationWaitingScreen';
import ToastNotification from './components/ui/ToastNotification';
import { notificationWebSocket } from './services/notificationWebSocket';
import { updateOnlineStatus } from './hooks/useOnlineStatus';
import { useSocialStore } from './stores/socialStore';
import { useNotificationStore } from './stores/notificationStore';
import { AnimatePresence } from 'framer-motion';
import { ToastProvider, useToastContext } from './contexts/ToastContext';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const { initializeTheme, isDarkMode } = useThemeStore();
  const { addCollaborationInviteToFriend } = useSocialStore();
  const { fetchNotificationCounts, incrementCollaborationInvites } = useNotificationStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [collaborationInvites, setCollaborationInvites] = useState<CollaborationInvite[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [currentInviteNotification, setCurrentInviteNotification] = useState<CollaborationInvite | null>(null);
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [waitingScreenData, setWaitingScreenData] = useState<{sessionId: string, storyTitle: string, inviterName: string} | null>(null);
  const { toasts, removeToast, showOnlineToast, showOfflineToast, showInviteToast } = useToastContext();
  const [notificationReconnectAttempt, setNotificationReconnectAttempt] = useState(0);
  
  // Handle Android back button in Capacitor
  useCapacitorBackButton();
  
  // Enable background music for child accounts
  useBackgroundMusic();
  
  // Initialize authentication and theme on mount
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 App initializing...');
      
      // Wait a tiny bit for Capacitor storage to be ready on mobile
      // Reduced from 100ms to 50ms for faster startup
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Skip user auth check if on admin page (admin has separate auth)
      if (location.pathname !== '/admin') {
        console.log('🚀 Checking authentication...');
        const isAuth = await checkAuth();
        console.log('🚀 Authentication check complete, isAuth:', isAuth);
        
        // If authenticated and on auth page or root, redirect based on account state
        if (isAuth && (location.pathname === '/auth' || location.pathname === '/')) {
          // Check if user was viewing as parent or child
          const { useAccountSwitchStore } = await import('./stores/accountSwitchStore');
          const accountState = useAccountSwitchStore.getState();
          const { useAuthStore } = await import('./stores/authStore');
          const userType = useAuthStore.getState().user?.user_type;
          
          console.log('🔐 Account state:', {
            activeAccountType: accountState.activeAccountType,
            userType: userType,
            hasParentSession: !!storage.getItemSync('parent_session')
          });
          
          // Determine where to navigate based on account state
          if (accountState.activeAccountType === 'parent' || userType === 'parent' || userType === 'teacher') {
            // Was in parent view or is parent/teacher account
            const hasParentSession = storage.getItemSync('parent_session');
            if (hasParentSession) {
              // Parent/Teacher was viewing a child account
              console.log('🚀 Parent/Teacher was viewing as child, redirecting to home (child view)...');
              navigate('/home', { replace: true });
            } else {
              // Parent or Teacher in their own account
              if (userType === 'teacher') {
                console.log('🚀 Teacher account, redirecting to teacher dashboard...');
                navigate('/teacher-dashboard', { replace: true });
              } else {
                console.log('🚀 Parent account, redirecting to parent dashboard...');
                navigate('/parent-dashboard', { replace: true });
              }
            }
          } else {
            // Regular child account
            console.log('🚀 Child account, redirecting to home...');
            navigate('/home', { replace: true });
          }
        }
      }
      initializeTheme();
      
      // Set initializing to false immediately - don't wait for backend
      setIsInitializing(false);
      console.log('🚀 App ready!');
    };
    initialize();
  }, [checkAuth, initializeTheme, location.pathname]);
  
  // Apply dark mode based on user preference and current page
  useEffect(() => {
    const isAuthPage = location.pathname === '/auth';
    
    // Only remove dark mode from auth page (force light mode for auth)
    if (isAuthPage) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('nav-dark');
    } else {
      // On all other pages (including home): respect user's theme preference
      document.documentElement.classList.remove('nav-dark');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [location.pathname, isDarkMode]);
  
  // Immediately remove dark class on mount if on auth page (prevent flash)
  useEffect(() => {
    if (location.pathname === '/auth') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('nav-dark');
    }
  }, []); // Run once on mount

  // Connect to notification WebSocket for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    // Load existing invitations first
    const loadCollaborationInvites = async () => {
      try {
        const token = localStorage.getItem('access_token');
        console.log('🔔 Loading existing collaboration invites...');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invites/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🔔 Loaded existing invitations:', data.invitations);
          const invitations = data.invitations || [];
          
          // Add invitations to friends list instead of showing popups
          invitations.forEach((invite: any) => {
            console.log('🔔 Adding invite to friend:', invite.inviter_id);
            addCollaborationInviteToFriend(invite.inviter_id, invite);
          });
        }
      } catch (err) {
        console.error('🔔 Failed to load collaboration invites:', err);
      }
    };

    loadCollaborationInvites();

    // Set up reconnection state handler for notification WebSocket
    notificationWebSocket.onReconnectStateChange = (reconnecting: boolean, attempt: number) => {
      // Reconnecting toast removed - no longer shown
      setNotificationReconnectAttempt(attempt);
    };

    // Connect to WebSocket for real-time updates
    notificationWebSocket.connect({
      onCollaborationInvite: (message) => {
        console.log('🔔 Collaboration invite received in real-time:', message);
        console.log('🔔 Full message object:', message);
        console.log('🔔 Message.is_session_active:', message.is_session_active);
        console.log('🔔 Message details:', {
          id: message.id,
          session_id: message.session_id,
          sender_id: message.sender_id,
          sender_name: message.sender_name,
          inviter_id: message.inviter_id,
          inviter_name: message.inviter_name,
          story_title: message.story_title,
          is_session_active: message.is_session_active
        });
        
        // Create a proper invite object from the message
        const invite: CollaborationInvite = {
          id: String(message.id || Date.now()),
          session_id: message.session_id,
          sessionId: message.session_id,
          inviter_id: message.sender_id || message.inviter_id,
          inviter_name: message.sender_name || message.inviter_name,
          story_title: message.story_title,
          storyTitle: message.story_title,
          created_at: message.created_at || new Date().toISOString(),
          createdAt: message.created_at || new Date().toISOString(),
          is_session_active: message.is_session_active || false,
          isSessionActive: message.is_session_active || false
        };
        
        console.log('🔔 Created invite object:', invite);
        console.log('🔔 Invite.is_session_active:', invite.is_session_active);
        console.log('🔔 Invite.isSessionActive:', invite.isSessionActive);
        
        // Add invitation to friend's profile instead of showing popup
        console.log('🔔 Adding collaboration invite to friend:', invite.inviter_id);
        addCollaborationInviteToFriend(invite.inviter_id, invite);
        
        // Increment notification count immediately for instant UI feedback
        incrementCollaborationInvites();
        
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Collaboration Invite', {
            body: `${invite.inviter_name} invited you to collaborate on "${invite.story_title}"`,
            icon: '/logo.png',
            tag: 'collaboration-invite'
          });
        }
        
        // Show beautiful in-app notification modal
        setCurrentInviteNotification(invite);
        
        // Show toast notification
        showInviteToast(
          invite.inviter_name,
          invite.story_title,
          () => {
            // When user clicks "View Invite" in toast, redirect to social tab
            navigate('/social');
          }
        );
        
        // Dispatch collaboration invite event for UI updates
        window.dispatchEvent(new CustomEvent('collaboration-invite-received', { 
          detail: { 
            ...message,
            type: 'collaboration_invite' 
          } 
        }));
      },
      onNewMessage: (message) => {
        console.log('🔔 New message received in real-time:', message);
        // Trigger a refresh of the messaging page if it's currently open
        window.dispatchEvent(new CustomEvent('new-message', { detail: message }));
      },
      onFriendRequest: (friendship) => {
        console.log('🔔 Friend request received in real-time:', friendship);
        // Trigger a refresh of the social page
        window.dispatchEvent(new CustomEvent('friend-request', { detail: friendship }));
      },
      onFriendRequestAccepted: (friendship) => {
        console.log('🔔 Friend request accepted in real-time:', friendship);
        // Trigger a refresh of the social page
        window.dispatchEvent(new CustomEvent('friend-request-accepted', { detail: friendship }));
      },
      onFriendOnline: (userId, username) => {
        console.log('🔔 Friend came online:', username);
        console.log('🔔 Showing online toast for:', username);
        setOnlineUsers(prev => new Set([...prev, userId]));
        // Update global status outside of setState
        setTimeout(() => updateOnlineStatus(userId, true), 0);
        
        // Show toast notification
        const toastId = showOnlineToast(username);
        console.log('🔔 Toast created with ID:', toastId);
      },
      onFriendOffline: (userId, username) => {
        console.log('🔔 Friend went offline:', username);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        // Update global status outside of setState
        setTimeout(() => updateOnlineStatus(userId, false), 0);
        
        // Show toast notification
        showOfflineToast(username);
      },
      onConnect: () => {
        console.log('🔔 Connected to notification WebSocket');
      },
      onDisconnect: () => {
        console.log('🔔 Disconnected from notification WebSocket');
      }
    }).catch(err => {
      console.error('🔔 Failed to connect to notification WebSocket:', err);
    });

    // Cleanup on unmount
    return () => {
      notificationWebSocket.disconnect();
    };
  }, [isAuthenticated]);

  // Handle accepting collaboration invitation from notification modal
  const handleAcceptInviteFromNotification = async () => {
    if (!currentInviteNotification) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invites/${currentInviteNotification.id}/respond/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'accept' })
        }
      );

      if (response.ok) {
        // Close notification modal
        setCurrentInviteNotification(null);
        
        // Remove from invitations
        setCollaborationInvites(prev => prev.filter(inv => inv.id !== currentInviteNotification.id));
        
        // Show waiting screen instead of navigating immediately
        setWaitingScreenData({
          sessionId: currentInviteNotification.sessionId,
          storyTitle: currentInviteNotification.storyTitle,
          inviterName: currentInviteNotification.inviter_name
        });
        setShowWaitingScreen(true);
        
        // TODO: Listen for session start event from WebSocket
        // For now, we'll navigate after a delay (this should be replaced with WebSocket event)
        setTimeout(() => {
          setShowWaitingScreen(false);
          const storyId = `collab-${currentInviteNotification.sessionId}`;
          navigate('/create-story-manual', {
            state: {
              sessionId: currentInviteNotification.sessionId,
              storyId: storyId,
              storyTitle: currentInviteNotification.storyTitle,
              isCollaborative: true
            }
          });
        }, 3000); // Temporary: Will be replaced with WebSocket event
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      alert('Failed to accept invitation');
    }
  };

  // Handle declining collaboration invitation from notification modal
  const handleDeclineInviteFromNotification = async () => {
    if (!currentInviteNotification) return;

    try {
      const token = localStorage.getItem('access_token');
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invites/${currentInviteNotification.id}/respond/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'decline' })
        }
      );

      // Close notification modal
      setCurrentInviteNotification(null);
      
      // Remove from invitations
      setCollaborationInvites(prev => prev.filter(inv => inv.id !== currentInviteNotification.id));
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      alert('Failed to decline invitation');
    }
  };

  // Handle accepting collaboration invitation (legacy - still used by other components)
  const handleAcceptInvite = async (invitation: CollaborationInvite) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invites/${invitation.id}/respond/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'accept' })
        }
      );

      if (response.ok) {
        // Remove from invitations
        setCollaborationInvites(prev => prev.filter(inv => inv.id !== invitation.id));
        
        // Navigate to story creation page with collaboration info
        const storyId = `collab-${invitation.sessionId}`;
        navigate('/create-story-manual', {
          state: {
            sessionId: invitation.sessionId,
            storyId: storyId,
            isCollaborative: true
          }
        });
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      alert('Failed to accept invitation');
    }
  };

  // Handle declining collaboration invitation
  const handleDeclineInvite = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invites/${invitationId}/respond/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'decline' })
        }
      );

      // Remove from invitations
      setCollaborationInvites(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      console.error('Failed to decline invitation:', err);
    }
  };
  
  // Show bottom nav only for authenticated users or anonymous users (but not on auth page or canvas drawing)
  // Don't show if user is null (not loaded yet) or on auth/canvas/admin/story-creation/parent/story-reader pages
  // Show bottom nav on pages that should have navigation
  // Special handling: Always show on /games and /games/story/* pages (games are accessible to all)
  const isGamesPage = location.pathname === '/games' || location.pathname.startsWith('/games/story/');
  const showBottomNav = (isGamesPage || (user && (isAuthenticated || user.id === 'anonymous'))) && 
    location.pathname !== '/auth' && 
    location.pathname !== '/canvas-drawing' &&
    location.pathname !== '/cover-canvas' &&
    location.pathname !== '/create-story-manual' &&
    location.pathname !== '/admin' &&
    location.pathname !== '/parent-dashboard' &&
    location.pathname !== '/parent-settings' &&
    location.pathname !== '/teacher-dashboard' &&  // Hide bottom nav on teacher dashboard
    location.pathname !== '/teacher-settings' &&   // Hide bottom nav on teacher settings
    !location.pathname.startsWith('/story/') &&
    !location.pathname.startsWith('/games/play/') &&   // Hide on gameplay page (but keep on /games and /games/story/*)
    location.pathname !== '/';
  
  // Check if current page is home page for wrapper class
  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  // Show loading screen while initializing (AFTER all hooks)
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isHomePage ? 'home-page-wrapper' : ''}`}>
      {/* Notification Reconnecting Toast - Removed (was annoying) */}
      
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/home" element={
          <AnonymousRoute>
            <HomePage />
          </AnonymousRoute>
        } />
        <Route path="/social" element={
          <AnonymousRoute requireAuth={true}>
            <EnhancedSocialPage />
          </AnonymousRoute>
        } />
        <Route path="/messages" element={
          <AnonymousRoute requireAuth={true}>
            <MessagingPage />
          </AnonymousRoute>
        } />
        <Route path="/messages/:userId" element={
          <AnonymousRoute requireAuth={true}>
            <MessagingPage />
          </AnonymousRoute>
        } />
        <Route path="/settings" element={
          <AnonymousRoute>
            <SettingsPage />
          </AnonymousRoute>
        } />
        <Route path="/library" element={
          <AnonymousRoute>
            <LibraryPage />
          </AnonymousRoute>
        } />
        <Route path="/public-library" element={
          <AnonymousRoute>
            <PublicLibraryPage />
          </AnonymousRoute>
        } />
        <Route path="/profile" element={
          <AnonymousRoute requireAuth={true}>
            <ProfilePage />
          </AnonymousRoute>
        } />
        <Route path="/offline-stories" element={
          <AnonymousRoute>
            <OfflineStoriesPage />
          </AnonymousRoute>
        } />
        <Route path="/online-stories" element={
          <AnonymousRoute>
            <OnlineStoriesPage />
          </AnonymousRoute>
        } />
        <Route path="/characters-library" element={
          <AnonymousRoute>
            <CharactersLibraryPage />
          </AnonymousRoute>
        } />
        <Route path="/character/create" element={
          <AnonymousRoute>
            <CharactersLibraryPage />
          </AnonymousRoute>
        } />
        <Route path="/characters" element={
          <AnonymousRoute>
            <CharactersLibraryPage />
          </AnonymousRoute>
        } />
        <Route path="/your-works" element={
          <AnonymousRoute requireAuth={true}>
            <YourWorksPage />
          </AnonymousRoute>
        } />
        <Route path="/create-story-manual" element={
          <AnonymousRoute requireAuth={true}>
            <ManualStoryCreationPage />
          </AnonymousRoute>
        } />
        <Route path="/canvas-drawing" element={
          <AnonymousRoute requireAuth={true}>
            <CanvasDrawingPage />
          </AnonymousRoute>
        } />
        <Route path="/cover-canvas" element={
          <AnonymousRoute requireAuth={true}>
            <CoverImageCanvasPage />
          </AnonymousRoute>
        } />
        <Route path="/story/:storyId" element={
          <AnonymousRoute>
            <StoryReaderPage />
          </AnonymousRoute>
        } />
        <Route path="/collaboration-waiting" element={
          <AnonymousRoute requireAuth={true}>
            <CollaborationWaitingPage />
          </AnonymousRoute>
        } />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/parent-dashboard" element={
          <ParentRoute>
            <ParentDashboardPage />
          </ParentRoute>
        } />
        <Route path="/parent-settings" element={
          <ParentRoute>
            <ParentSettingsPage />
          </ParentRoute>
        } />
        <Route path="/teacher-dashboard" element={
          <ParentRoute>
            <TeacherDashboardPage />
          </ParentRoute>
        } />
        <Route path="/teacher-settings" element={
          <ParentRoute>
            <TeacherSettingsPage />
          </ParentRoute>
        } />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/games" element={
          <AnonymousRoute>
            <GamesPage />
          </AnonymousRoute>
        } />
        <Route path="/games/story/:storyId" element={
          <AnonymousRoute>
            <StoryGamesPage />
          </AnonymousRoute>
        } />
        <Route path="/games/play/:gameId" element={
          <AnonymousRoute>
            <GamePlayPage />
          </AnonymousRoute>
        } />
        <Route path="/" element={<AuthPage />} />
      </Routes>
      {showBottomNav && <BottomNav />}
      
      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onClose={removeToast} />
      
      {/* Collaboration Waiting Screen */}
      {showWaitingScreen && waitingScreenData && (
        <CollaborationWaitingScreen
          sessionId={waitingScreenData.sessionId}
          storyTitle={waitingScreenData.storyTitle}
          inviterName={waitingScreenData.inviterName}
        />
      )}
      
      {/* Global Collaboration Invite Notification Modal */}
      <AnimatePresence>
        {currentInviteNotification && (
          <CollaborationInviteNotification
            inviterName={currentInviteNotification.inviter_name}
            storyTitle={currentInviteNotification.story_title}
            onAccept={handleAcceptInviteFromNotification}
            onDecline={handleDeclineInviteFromNotification}
            onClose={() => setCurrentInviteNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}

export default App;
