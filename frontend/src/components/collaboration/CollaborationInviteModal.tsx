/**
 * Collaboration Invite Modal - Invite friends to collaborate on a story
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, UserPlus, Users, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { socialService } from '../../services/social.service';
import { createCollaborationSession } from '../../services/collaborationApi';
import { collaborationService } from '../../services/collaborationService';
import './CollaborationModal.css';

interface Friend {
  id: number;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

interface CollaborationInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated?: (sessionId: string) => void;
  storyTitle: string;
  onlineUserIds?: Set<number>;
  existingSessionId?: string | null;
  existingJoinCode?: string | null;
  isSessionActive?: boolean;
}

export const CollaborationInviteModal: React.FC<CollaborationInviteModalProps> = ({
  isOpen,
  onClose,
  onSessionCreated,
  storyTitle,
  onlineUserIds = new Set(),
  existingSessionId = null,
  existingJoinCode = null,
  isSessionActive = false
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId);
  const [joinCode, setJoinCode] = useState<string | null>(existingJoinCode);
  const [invitedFriends, setInvitedFriends] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  // Update session info when existingSessionId/existingJoinCode changes
  useEffect(() => {
    if (existingSessionId) {
      setSessionId(existingSessionId);
    }
    if (existingJoinCode) {
      setJoinCode(existingJoinCode);
    }
  }, [existingSessionId, existingJoinCode]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await socialService.getFriends();
      setFriends(friendsList as any);
    } catch (err) {
      console.error('Failed to load friends:', err);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create collaboration session
      const session = await createCollaborationSession({
        canvas_name: storyTitle || 'Untitled Story',
        max_participants: 5,
        duration_hours: 24
      });

      setSessionId(session.session_id);
      setJoinCode(session.join_code);

      // Connect to WebSocket
      await collaborationService.connect(session.session_id);

      if (onSessionCreated) {
        onSessionCreated(session.session_id);
      }

      return session.session_id;
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleInviteFriend = async (friendId: number) => {
    try {
      // Create session if not created yet
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await handleCreateSession();
      }

      // Send invitation via API
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invite/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          friend_id: friendId,
          story_title: storyTitle,
          is_session_active: isSessionActive
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      // Mark friend as invited
      setInvitedFriends(prev => new Set([...prev, friendId]));
    } catch (err) {
      console.error('Failed to invite friend:', err);
      setError('Failed to send invitation');
    }
  };

  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      alert('Session ID copied! Share it with friends.');
    }
  };

  const copyJoinCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (!isOpen) {
    console.log('CollaborationInviteModal: isOpen is false');
    return null;
  }

  console.log('CollaborationInviteModal: Rendering modal!', { isOpen, friends });

  const modalContent = (
    <div 
      className="modal-overlay"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-content dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <Users className="modal-icon" />
            <div>
              <h2 className="modal-title">
                {sessionId ? 'Invite Friends' : 'Start Collaboration'}
              </h2>
              <p className="modal-subtitle">
                {sessionId ? 'Select friends to join your collaboration' : 'Create a session to collaborate'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Session Info (if created) */}
          {sessionId && joinCode && (
            <div className="mb-6">
              {/* Join Code Display */}
              <div className="join-code-display">
                <div className="join-code-label">Share this code with your friends:</div>
                <div className="join-code-value">{joinCode}</div>
                <div className="join-code-actions">
                  <button
                    className={`copy-code-button ${codeCopied ? 'copied' : ''}`}
                    onClick={copyJoinCode}
                  >
                    {codeCopied ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Session ID */}
              <div className="mt-4 p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg">
                <div className="text-xs text-[#A78BFA] font-medium mb-2 uppercase tracking-wide">
                  Session ID
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-[#2C3137] text-[#A78BFA] px-3 py-2 rounded border border-[#404650]">
                    {sessionId}
                  </code>
                  <button
                    onClick={copySessionId}
                    className="p-2 hover:bg-[#404650] rounded transition-colors"
                    title="Copy session ID"
                  >
                    <LinkIcon className="w-4 h-4 text-[#B8BCC2]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Friends List */}
          {loading && !sessionId ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]"></div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#404650] mx-auto mb-3" />
              <p className="text-[#B8BCC2] text-sm mb-2">No friends yet</p>
              <p className="text-[#8B9197] text-xs">
                Add friends from the Social page to collaborate
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#B8BCC2] mb-3 uppercase tracking-wide">
                Your Friends ({friends.length})
              </h3>
              {friends.map((friend) => {
                const isOnline = onlineUserIds.has(friend.id);
                return (
                  <div key={friend.id} className="friend-card-enhanced">
                    <div className="friend-avatar-container">
                      <div className="friend-avatar">
                        {friend.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className={`friend-online-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                    </div>

                    <div className="friend-info">
                      <p className="friend-name">{friend.username}</p>
                      <div className="friend-status">
                        <div className={`friend-status-dot ${isOnline ? 'online' : 'offline'}`}></div>
                        <span className={`friend-status-text ${isOnline ? 'online' : 'offline'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInviteFriend(friend.id)}
                      disabled={invitedFriends.has(friend.id) || loading}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#2C3137] px-6 py-4 border-t border-[#404650] flex justify-between items-center">
          <p className="text-xs text-[#8B9197]">
            {sessionId
              ? `${invitedFriends.size} friend${invitedFriends.size !== 1 ? 's' : ''} invited`
              : 'Select friends to invite to collaborate'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#404650] hover:bg-[#4A5160] text-white rounded-lg font-medium text-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document body level
  return ReactDOM.createPortal(modalContent, document.body);
};

