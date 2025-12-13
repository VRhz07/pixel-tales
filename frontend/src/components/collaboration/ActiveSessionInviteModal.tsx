import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, UserPlus, Copy, Check } from 'lucide-react';
import { socialService } from '../../services/social.service';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { AvatarWithBorder } from '../common/AvatarWithBorder';

interface Friend {
  id: number;
  username: string;
  avatar?: string;
  selected_avatar_border?: string;
  profile_picture?: string;
}

interface ActiveSessionInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  joinCode: string;
  storyTitle: string;
  onlineUserIds?: Set<number>;
}

export const ActiveSessionInviteModal: React.FC<ActiveSessionInviteModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  joinCode,
  storyTitle,
  onlineUserIds = new Set()
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Set<number>>(new Set());
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Use the global online status hook for real-time presence
  const globalOnlineUsers = useOnlineStatus();

  // Load friends and fetch online status when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
      // The onlineUserIds are passed from parent, but we can log them for debugging
      console.log('🔍 Modal opened with onlineUserIds:', Array.from(onlineUserIds));
    }
  }, [isOpen, onlineUserIds]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const friendsList = await socialService.getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteFriend = async (friendId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invite/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          friend_id: friendId,
          story_title: storyTitle,
          is_session_active: true // Always true for active session invites
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      setInvitedFriends(prev => new Set(prev).add(friendId));
    } catch (error) {
      console.error('Error inviting friend:', error);
      alert('Failed to send invitation');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  console.log('📨 ActiveSessionInviteModal render:', { 
    isOpen, 
    sessionId, 
    joinCode, 
    bodyExists: !!document.body,
    onlineUserIds: Array.from(onlineUserIds),
    globalOnlineUsers: Array.from(globalOnlineUsers),
    friendsCount: friends.length
  });
  
  if (!isOpen) {
    console.log('⏹️ Modal not open, returning null');
    return null;
  }

  console.log('✅ Rendering modal portal to document.body', {
    onlineUserIdsArray: Array.from(onlineUserIds),
    globalOnlineUsersArray: Array.from(globalOnlineUsers),
    friends: friends.map(f => ({ id: f.id, username: f.username, isOnline: globalOnlineUsers.has(f.id) }))
  });

  return ReactDOM.createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000000
      }}
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '28rem',
          width: '100%',
          margin: '0 1rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111827'
          }}>
            Invite Friends to Active Session
          </h2>
          <button
            onClick={onClose}
            style={{
              color: '#9ca3af',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: '0.25rem'
            }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Join Code Section */}
          <div style={{
            backgroundColor: '#faf5ff',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '0.5rem'
            }}>
              Share this code with friends:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{
                flex: 1,
                backgroundColor: 'white',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                fontFamily: 'monospace',
                fontSize: '1.125rem',
                textAlign: 'center',
                color: '#111827',
                border: '1px solid #e5e7eb'
              }}>
                {joinCode}
              </code>
              <button
                onClick={handleCopyCode}
                style={{
                  padding: '0.5rem',
                  backgroundColor: copiedCode ? '#10b981' : '#9333ea',
                  color: 'white',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                title="Copy code"
              >
                {copiedCode ? <Check style={{ width: '1.25rem', height: '1.25rem' }} /> : <Copy style={{ width: '1.25rem', height: '1.25rem' }} />}
              </button>
            </div>
          </div>

          {/* Friends List */}
          <div>
            <h3 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Or invite friends directly:
            </h3>
            <div style={{
              maxHeight: '15rem',
              overflowY: 'auto'
            }}>
              {loading ? (
                <p style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: '1rem'
                }}>Loading friends...</p>
              ) : friends.length === 0 ? (
                <p style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: '1rem'
                }}>No friends to invite</p>
              ) : (
                friends.map(friend => {
                  const isOnline = globalOnlineUsers.has(friend.id);
                  return (
                    <div
                      key={friend.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                          <AvatarWithBorder
                            avatar={friend.avatar || friend.username[0].toUpperCase()}
                            borderId={friend.selected_avatar_border || 'basic'}
                            size={48}
                          />
                          {/* Always show status indicator */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-0.125rem',
                            right: '-0.125rem',
                            width: '0.75rem',
                            height: '0.75rem',
                            backgroundColor: isOnline ? '#10b981' : '#6b7280',
                            border: '2px solid white',
                            borderRadius: '50%',
                            boxShadow: isOnline ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                          }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#111827' }}>
                            {friend.username}
                          </span>
                          {isOnline && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#059669',
                              fontWeight: 500
                            }}>
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleInviteFriend(friend.id)}
                        disabled={invitedFriends.has(friend.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          border: 'none',
                          cursor: invitedFriends.has(friend.id) ? 'not-allowed' : 'pointer',
                          backgroundColor: invitedFriends.has(friend.id) ? '#d1fae5' : '#9333ea',
                          color: invitedFriends.has(friend.id) ? '#065f46' : 'white',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {invitedFriends.has(friend.id) ? 'Invited' : 'Invite'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
