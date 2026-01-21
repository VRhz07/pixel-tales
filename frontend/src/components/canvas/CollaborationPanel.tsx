/**
 * Collaboration Panel Component
 * UI for managing collaborative drawing sessions
 */
import React, { useState, useEffect } from 'react';
import { Users, Link as LinkIcon, X, UserPlus, LogOut } from 'lucide-react';
import {
  createCollaborationSession,
  getCollaborationSession,
  endCollaborationSession
} from '../../services/collaborationApi';
import { collaborationService } from '../../services/collaborationService';

interface Participant {
  user_id: number;
  username: string;
  cursor_color: string;
  cursor_position?: { x: number; y: number };
}

interface CollaborationPanelProps {
  onSessionCreated?: (sessionId: string) => void;
  onSessionJoined?: (sessionId: string) => void;
  onSessionEnded?: () => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  onSessionCreated,
  onSessionJoined,
  onSessionEnded
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [canvasName, setCanvasName] = useState('Untitled Canvas');
  const [joinSessionId, setJoinSessionId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for participant updates
    const handleUserJoined = (message: any) => {
      setParticipants(prev => {
        const exists = prev.find(p => p.user_id === message.user_id);
        if (!exists) {
          return [...prev, {
            user_id: message.user_id,
            username: message.username,
            cursor_color: message.cursor_color
          }];
        }
        return prev;
      });
    };

    const handleUserLeft = (message: any) => {
      setParticipants(prev => prev.filter(p => p.user_id !== message.user_id));
    };

    const handleInit = (message: any) => {
      if (message.participants) {
        setParticipants(message.participants);
      }
    };

    collaborationService.on('user_joined', handleUserJoined);
    collaborationService.on('user_left', handleUserLeft);
    collaborationService.on('init', handleInit);

    return () => {
      collaborationService.off('user_joined', handleUserJoined);
      collaborationService.off('user_left', handleUserLeft);
      collaborationService.off('init', handleInit);
    };
  }, []);

  const handleCreateSession = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const session = await createCollaborationSession({
        canvas_name: canvasName,
        max_participants: 5,
        duration_hours: 24
      });

      setSessionId(session.session_id);
      setInviteLink(window.location.origin + session.invite_link);
      setIsHost(true);

      // Connect to WebSocket
      await collaborationService.connect(session.session_id);

      if (onSessionCreated) {
        onSessionCreated(session.session_id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinSessionId.trim()) {
      setError('Please enter a session ID');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const session = await getCollaborationSession(joinSessionId.trim());
      
      if (!session.can_join) {
        setError('Cannot join this session (full or inactive)');
        return;
      }

      setSessionId(session.session_id);
      setIsHost(session.is_host);
      setParticipants(session.participants);

      // Connect to WebSocket
      await collaborationService.connect(session.session_id);

      if (onSessionJoined) {
        onSessionJoined(session.session_id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    try {
      await endCollaborationSession(sessionId);
      collaborationService.disconnect();
      setSessionId(null);
      setInviteLink('');
      setParticipants([]);
      setIsHost(false);

      if (onSessionEnded) {
        onSessionEnded();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLeaveSession = () => {
    collaborationService.disconnect();
    setSessionId(null);
    setInviteLink('');
    setParticipants([]);
    setIsHost(false);

    if (onSessionEnded) {
      onSessionEnded();
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const copySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      alert('Session ID copied to clipboard!');
    }
  };

  return (
    <div className="w-80 max-w-[calc(100vw-2rem)] bg-[#1F2329] rounded-lg shadow-2xl border border-[#404650] overflow-hidden">
      {/* Header */}
      <div className="bg-[#2C3137] px-4 py-3 border-b border-[#404650]">
        <h3 className="font-semibold flex items-center gap-2 text-base text-white">
          <Users className="w-5 h-5 text-[#8B5CF6]" />
          Collaboration
        </h3>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[520px] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {!sessionId ? (
              /* Not in a session */
              <div className="space-y-4">
                {/* Create Session */}
                <div>
                  <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">Create Session</h4>
                  <input
                    type="text"
                    placeholder="Untitled Canvas"
                    value={canvasName}
                    onChange={(e) => setCanvasName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#343A40] border border-[#404650] rounded-lg mb-3 text-white placeholder-[#8B9197] text-sm focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all outline-none"
                  />
                  <button
                    onClick={handleCreateSession}
                    disabled={isCreating}
                    className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isCreating ? 'Creating...' : 'Create & Share'}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#404650]"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-[#1F2329] text-[#8B9197] font-medium text-xs uppercase">OR</span>
                  </div>
                </div>

                {/* Join Session */}
                <div>
                  <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">Join Session</h4>
                  <input
                    type="text"
                    placeholder="enter session ID"
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#343A40] border border-[#404650] rounded-lg mb-3 text-white placeholder-[#8B9197] text-sm focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all outline-none"
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={isCreating}
                    className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isCreating ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            ) : (
              /* In a session */
              <div className="space-y-4">
                {/* Session Info */}
                <div className="bg-[#343A40] p-3 rounded-lg border border-[#404650]">
                  <div className="text-xs text-[#B8BCC2] mb-2 font-medium uppercase tracking-wide">Session ID</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-[#2C3137] text-[#A78BFA] px-3 py-2 rounded border border-[#404650]">
                      {sessionId}
                    </code>
                    <button
                      onClick={copySessionId}
                      className="p-2 hover:bg-[#404650] rounded transition-all"
                      title="Copy session ID"
                    >
                      <LinkIcon className="w-4 h-4 text-[#B8BCC2]" />
                    </button>
                  </div>
                </div>

                {/* Invite Link (host only) */}
                {isHost && inviteLink && (
                  <div className="bg-[#8B5CF6]/10 p-3 rounded-lg border border-[#8B5CF6]/30">
                    <div className="text-xs text-[#A78BFA] font-medium mb-2 uppercase tracking-wide">
                      Share this link with friends
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copy Invite Link
                    </button>
                  </div>
                )}

                {/* Participants */}
                <div>
                  <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">
                    Participants ({participants.length})
                  </h4>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.user_id}
                        className="flex items-center gap-3 p-2.5 bg-[#343A40] rounded-lg border border-[#404650] hover:border-[#8B5CF6]/50 transition-all"
                      >
                        <div
                          className="w-3 h-3 rounded-full border-2 border-[#404650]"
                          style={{ backgroundColor: participant.cursor_color }}
                        />
                        <span className="text-sm text-[#B8BCC2] font-medium">
                          {participant.username}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#404650]">
                  {isHost ? (
                    <button
                      onClick={handleEndSession}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <X className="w-4 h-4" />
                      End Session
                    </button>
                  ) : (
                    <button
                      onClick={handleLeaveSession}
                      className="w-full bg-[#404650] hover:bg-[#4A5160] text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Leave Session
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
    </div>
  );
};

export default React.memo(CollaborationPanel);
