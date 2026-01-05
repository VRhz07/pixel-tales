/**
 * Story Mode Selection Modal - Choose between Solo or Collaborative story creation
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, User, Users, UserPlus, Check, Loader, Sparkles, Info } from 'lucide-react';
import { socialService } from '../../services/social.service';
import { createCollaborationSession } from '../../services/collaborationApi';
import { collaborationService } from '../../services/collaborationService';
import { apiConfigService } from '../../services/apiConfig.service';
import { useThemeStore } from '../../stores/themeStore';
import { AvatarWithBorder } from '../common/AvatarWithBorder';
import './CollaborationModal.css';

interface Friend {
  id: number;
  username: string;
  avatar?: string;
  selected_avatar_border?: string;
  isOnline?: boolean;
}

interface StoryModeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSoloSelected: () => void;
  onCollabReady: (sessionId: string, storyId: string) => void;
  onCollabModeSelected?: () => void;
  forceCollabSetup?: boolean;
  storyTitle: string;
  onlineUserIds?: Set<number>;
}

export const StoryModeSelectionModal: React.FC<StoryModeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSoloSelected,
  onCollabReady,
  onCollabModeSelected,
  forceCollabSetup = false,
  storyTitle,
  onlineUserIds = new Set()
}) => {
  const { isDarkMode } = useThemeStore();
  const [mode, setMode] = useState<'selection' | 'collab-setup' | 'waiting'>('selection');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [invitedFriends, setInvitedFriends] = useState<Set<number>>(new Set());
  const [acceptedFriends, setAcceptedFriends] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load friends when entering collab setup or when forceCollabSetup is true
  useEffect(() => {
    if (isOpen && forceCollabSetup) {
      setMode('collab-setup');
      loadFriends();
    } else if (!isOpen) {
      // Reset mode when modal closes
      setMode('selection');
      setSessionId(null);
      setInvitedFriends(new Set());
      setAcceptedFriends([]);
      setError(null);
    }
  }, [isOpen, forceCollabSetup]);

  // Load friends when entering collab setup
  useEffect(() => {
    if (mode === 'collab-setup') {
      loadFriends();
    }
  }, [mode]);

  // Update friend online status when onlineUserIds changes
  useEffect(() => {
    if (friends.length > 0) {
      setFriends(prevFriends => 
        prevFriends.map(friend => ({
          ...friend,
          isOnline: onlineUserIds.has(friend.id) || friend.is_online
        }))
      );
    }
  }, [onlineUserIds]);

  // Poll for accepted participants when waiting
  useEffect(() => {
    if (mode === 'waiting' && sessionId) {
      const interval = setInterval(checkParticipants, 2000);
      return () => clearInterval(interval);
    }
  }, [mode, sessionId]);


  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await socialService.getFriends();
      // Map friends with online status from WebSocket
      const friendsWithOnlineStatus = friendsList.map(friend => ({
        ...friend,
        isOnline: onlineUserIds.has(friend.id) || friend.is_online
      }));
      setFriends(friendsWithOnlineStatus as any);
    } catch (err) {
      console.error('Failed to load friends:', err);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const checkParticipants = async () => {
    if (!sessionId) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${apiConfigService.getApiUrl()}/collaborate/${sessionId}/`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const participants = data.session?.participants || [];
        const accepted = participants
          .filter((p: any) => p.user_id !== JSON.parse(localStorage.getItem('user') || '{}').id)
          .map((p: any) => p.username);
        setAcceptedFriends(accepted);
      }
    } catch (err) {
      console.error('Failed to check participants:', err);
    }
  };

  const handleSoloClick = () => {
    onSoloSelected();
    onClose();
  };

  const handleCollabClick = () => {
    // If onCollabModeSelected is provided, use it to show Host/Join modal
    if (onCollabModeSelected) {
      onCollabModeSelected();
      onClose();
    } else {
      // Otherwise, show collab setup directly (old behavior)
      setMode('collab-setup');
    }
  };

  const handleInviteFriend = async (friendId: number) => {
    try {
      // Create session if not created yet
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        setLoading(true);
        const session = await createCollaborationSession({
          canvas_name: storyTitle || 'Collaborative Story',
          max_participants: 5,
          duration_hours: 24
        });
        currentSessionId = session.session_id;
        setSessionId(currentSessionId);
        
        // Connect to WebSocket
        await collaborationService.connect(currentSessionId);
      }

      // Send invitation
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${apiConfigService.getApiUrl()}/collaborate/invite/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: currentSessionId,
            friend_id: friendId,
            story_title: storyTitle
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      setInvitedFriends(prev => new Set([...prev, friendId]));
      setMode('waiting');
    } catch (err) {
      console.error('Failed to invite friend:', err);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCollab = () => {
    if (sessionId) {
      // Generate a unique story ID that will be shared
      const storyId = `collab-${sessionId}`;
      onCollabReady(sessionId, storyId);
      onClose();
    }
  };

  const handleBack = () => {
    if (mode === 'waiting') {
      setMode('collab-setup');
    } else {
      setMode('selection');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && mode === 'selection') {
          onClose();
        }
      }}
    >
      <div 
        className={`modal-content ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '28rem', width: '100%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            {mode !== 'selection' && (
              <button
                onClick={handleBack}
                className={`mr-3 p-2 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Go Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <Users className="modal-icon" />
            <div>
              <h2 className="modal-title">
                {mode === 'selection' && 'Choose Story Mode'}
                {mode === 'collab-setup' && 'Invite Friends'}
                {mode === 'waiting' && 'Waiting for Friends'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'selection' && 'How would you like to create your story?'}
                {mode === 'collab-setup' && 'Select friends to collaborate with'}
                {mode === 'waiting' && 'Invitations sent! Waiting for responses...'}
              </p>
            </div>
          </div>
          {mode === 'selection' && (
            <button onClick={onClose} className="modal-close-button">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Mode Selection */}
          {mode === 'selection' && (
            <div className="space-y-6">
              {/* Solo Mode */}
              <button
                onClick={handleSoloClick}
                className="mode-option-card"
              >
                <div className="mode-option-icon bg-gradient-to-br from-blue-500 to-cyan-500">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="mode-option-content">
                  <h3 className="mode-option-title">Solo Mode</h3>
                  <p className="mode-option-description">Create your story independently</p>
                </div>
              </button>

              {/* Collab Mode */}
              <button
                onClick={handleCollabClick}
                className="mode-option-card"
              >
                <div className="mode-option-icon bg-gradient-to-br from-purple-500 to-pink-500">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="mode-option-content">
                  <h3 className="mode-option-title">Collaboration Mode</h3>
                  <p className="mode-option-description">Create with friends in real-time</p>
                </div>
              </button>
            </div>
          )}

          {/* Collab Setup - Friends List */}
          {mode === 'collab-setup' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No friends yet</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add friends from the Social page first</p>
                </div>
              ) : (
                <>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Select friends to invite to collaborate on this story:
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {friends.map((friend) => (
                      <div key={friend.id} className="friend-card-enhanced">
                        <div className="friend-avatar-container">
                          <AvatarWithBorder
                            avatar={friend.avatar || friend.username?.charAt(0).toUpperCase() || 'U'}
                            borderId={friend.selected_avatar_border || 'basic'}
                            size={48}
                          />
                          <div className={`friend-online-indicator ${friend.isOnline ? 'online' : 'offline'}`}></div>
                        </div>
                        <div className="friend-info">
                          <p className="friend-name">{friend.username}</p>
                          <div className="friend-status">
                            <div className={`friend-status-dot ${friend.isOnline ? 'online' : 'offline'}`}></div>
                            <span className={`friend-status-text ${friend.isOnline ? 'online' : 'offline'}`}>
                              {friend.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInviteFriend(friend.id)}
                          disabled={invitedFriends.has(friend.id)}
                          className={`invite-button ${invitedFriends.has(friend.id) ? 'invited' : ''}`}
                        >
                          {invitedFriends.has(friend.id) ? (
                            <>
                              <Check className="invite-button-icon" />
                              <span className="invite-button-text">Invited</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="invite-button-icon" />
                              <span className="invite-button-text">Invite</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Waiting for Acceptance */}
          {mode === 'waiting' && (
            <div className="space-y-4">
              <div className="waiting-container">
                <div className="waiting-animation">
                  <div className="waiting-spinner"></div>
                  <div className="waiting-pulse"></div>
                </div>
                <h3 className="waiting-title">Waiting for friends...</h3>
                <p className="waiting-description">
                  Invitations sent! Waiting for friends to accept.
                </p>
                <div className="waiting-dots">
                  <div className="waiting-dot"></div>
                  <div className="waiting-dot"></div>
                  <div className="waiting-dot"></div>
                </div>
              </div>

              {acceptedFriends.length > 0 && (
                <div className="accepted-friends-container">
                  <h4 className="accepted-friends-title">
                    <Check className="w-5 h-5" />
                    <span>Accepted ({acceptedFriends.length})</span>
                  </h4>
                  <div>
                    {acceptedFriends.map((username, idx) => (
                      <div key={idx} className="accepted-friend-item">
                        <Check className="accepted-friend-check" />
                        <p className="accepted-friend-name">{username}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleStartCollab}
                disabled={acceptedFriends.length === 0}
                className="start-collab-button"
              >
                <Sparkles className="start-collab-button-icon" />
                <span className="start-collab-button-text">
                  {acceptedFriends.length === 0 
                    ? 'Waiting for participants...' 
                    : `Start Collaboration (${acceptedFriends.length} joined)`}
                </span>
              </button>

              <div className="waiting-hint">
                <Info className="waiting-hint-icon" />
                <span>You can start once at least one friend accepts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

