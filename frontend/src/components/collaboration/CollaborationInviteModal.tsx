/**
 * Collaboration Invite Modal - Invite friends to collaborate on a story
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, UserPlus, Users, Link as LinkIcon, Check, Copy, ChevronLeft } from 'lucide-react';
import { socialService } from '../../services/social.service';
import { createCollaborationSession } from '../../services/collaborationApi';
import { collaborationService } from '../../services/collaborationService';
import { apiConfigService } from '../../services/apiConfig.service';
import { AvatarWithBorder } from '../common/AvatarWithBorder';
import './CollaborationModal.css';

interface Friend {
  id: number;
  username: string;
  avatar?: string;
  selected_avatar_border?: string;
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

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (isOpen) loadFriends();
  }, [isOpen]);

  useEffect(() => {
    if (existingSessionId) setSessionId(existingSessionId);
    if (existingJoinCode) setJoinCode(existingJoinCode);
  }, [existingSessionId, existingJoinCode]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await socialService.getFriends();
      setFriends(friendsList as any);
    } catch (err) {
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const session = await createCollaborationSession({
        canvas_name: storyTitle || 'Untitled Story',
        max_participants: 5,
        duration_hours: 24
      });
      setSessionId(session.session_id);
      setJoinCode(session.join_code);
      await collaborationService.connect(session.session_id);
      if (onSessionCreated) onSessionCreated(session.session_id);
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
      let currentSessionId = sessionId;
      if (!currentSessionId) currentSessionId = await handleCreateSession();

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${apiConfigService.getApiUrl()}/collaborate/invite/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          friend_id: friendId,
          story_title: storyTitle,
          is_session_active: isSessionActive
        })
      });
      if (!response.ok) throw new Error('Failed to send invitation');
      setInvitedFriends(prev => new Set([...prev, friendId]));
    } catch (err) {
      setError('Failed to send invitation');
    }
  };

  const copyJoinCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const copySessionId = () => {
    if (sessionId) navigator.clipboard.writeText(sessionId);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="cim-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cim-card" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="cim-header">
          <button className="cim-back-btn" onClick={onClose} title="Go Back">
            <ChevronLeft className="cim-back-icon" />
          </button>
          <div className="cim-header-icon-wrap">
            <Users className="cim-header-icon" aria-hidden="true" />
          </div>
          <div>
            <h2 className="cim-title">Invite Friends</h2>
            <p className="cim-subtitle">Select friends to collaborate with</p>
          </div>
          <button className="cim-close-btn" onClick={onClose} title="Close">
            <X className="cim-close-icon" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="cim-body">
          {error && <div className="cim-error">{error}</div>}

          {/* Join Code */}
          {sessionId && joinCode && (
            <div className="cim-code-section">
              <p className="cim-code-label">Share this code with friends</p>
              <div className="cim-code-row">
                <div className="cim-code-value">{joinCode}</div>
                <button className={`cim-copy-btn ${codeCopied ? 'copied' : ''}`} onClick={copyJoinCode}>
                  {codeCopied ? <><Check className="cim-copy-icon" /> Copied!</> : <><Copy className="cim-copy-icon" /> Copy</>}
                </button>
              </div>
              <div className="cim-session-id-row">
                <span className="cim-session-id-label">Session ID</span>
                <code className="cim-session-id-value">{sessionId}</code>
                <button className="cim-session-copy-btn" onClick={copySessionId} title="Copy session ID">
                  <LinkIcon className="cim-copy-icon" />
                </button>
              </div>
            </div>
          )}

          {/* Friends list */}
          {loading && !sessionId ? (
            <div className="cim-loading">
              <div className="cim-spinner" />
              <span>Loading friends…</span>
            </div>
          ) : friends.length === 0 ? (
            <div className="cim-empty">
              <Users className="cim-empty-icon" />
              <p className="cim-empty-title">No friends yet</p>
              <p className="cim-empty-hint">Add friends from the Social page to collaborate</p>
            </div>
          ) : (
            <div className="cim-friends-section">
              <p className="cim-friends-header-text">Select friends to invite to collaborate on this story:</p>
              <div className="cim-friends-list">
                {friends.map(friend => {
                  const isOnline = onlineUserIds.has(friend.id);
                  const invited = invitedFriends.has(friend.id);

                  return (
                    <div key={friend.id} className="cim-friend-row">
                      {/* Avatar + online dot */}
                      <div className="cim-avatar-wrap">
                        <AvatarWithBorder
                          avatar={friend.avatar || friend.username?.charAt(0).toUpperCase() || 'U'}
                          borderId={friend.selected_avatar_border || 'basic'}
                          size={48}
                        />
                        <div className={`cim-online-dot ${isOnline ? 'online' : 'offline'}`} />
                      </div>

                      {/* Name + status */}
                      <div className="cim-friend-info">
                        <p className="cim-friend-name">{friend.username}</p>
                        <div className="cim-friend-status">
                          <div className={`cim-status-dot ${isOnline ? 'online' : 'offline'}`} />
                          <span className={`cim-status-text ${isOnline ? 'online' : 'offline'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      {/* Invite button */}
                      <button
                        onClick={() => handleInviteFriend(friend.id)}
                        disabled={invited || loading}
                        className={`cim-invite-btn ${invited ? 'invited' : ''}`}
                      >
                        {invited
                          ? <><Check className="cim-btn-icon" /><span>Invited</span></>
                          : <><UserPlus className="cim-btn-icon" /><span>Invite</span></>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="cim-footer">
          <p className="cim-footer-note">
            {sessionId
              ? `${invitedFriends.size} friend${invitedFriends.size !== 1 ? 's' : ''} invited`
              : 'Select friends to invite to collaborate'}
          </p>
          <button className="cim-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
