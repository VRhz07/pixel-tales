import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserGroupIcon, XMarkIcon, CheckCircleIcon, ClockIcon, PlayIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { collaborationService } from '../../services/collaborationService';

interface Participant {
  user_id: number;
  username: string;
  avatar?: string;
  status: 'pending' | 'joined';
  joinedAt?: string;
  is_active?: boolean;
  current_tool?: string;
  current_page?: number;
}

interface CollaborationLobbyProps {
  sessionId: string;
  storyTitle: string;
  isHost: boolean;
  onStart: () => void;
  onExit: () => void;
  onInviteMore: () => void;
}

const CollaborationLobby: React.FC<CollaborationLobbyProps> = ({
  sessionId,
  storyTitle,
  isHost,
  onStart,
  onExit,
  onInviteMore
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants(true); // Initial load with loading state
    
    // Poll for participants every 3 seconds (reduced frequency to avoid constant refresh)
    const pollInterval = setInterval(() => {
      loadParticipants(false); // Don't show loading state for polls
    }, 3000);
    
    // Listen for participant updates via WebSocket
    const handleParticipantJoined = (event: any) => {
      console.log('👋 Participant joined event:', event.detail);
      const { userId, username } = event.detail;
      setParticipants(prev => {
        const exists = prev.find(p => p.user_id === userId);
        if (exists) {
          return prev.map(p => 
            p.user_id === userId 
              ? { ...p, status: 'joined' as const, joinedAt: new Date().toISOString() }
              : p
          );
        } else {
          // Add new participant
          return [...prev, {
            user_id: userId,
            username: username || 'Unknown',
            status: 'joined' as const,
            joinedAt: new Date().toISOString(),
            is_active: true
          }];
        }
      });
    };

    const handleParticipantLeft = (event: any) => {
      console.log('👋 Participant left event:', event.detail);
      const { userId } = event.detail;
      setParticipants(prev => prev.filter(p => p.user_id !== userId));
    };

    window.addEventListener('collaboration-participant-joined', handleParticipantJoined);
    window.addEventListener('collaboration-participant-left', handleParticipantLeft);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('collaboration-participant-joined', handleParticipantJoined);
      window.removeEventListener('collaboration-participant-left', handleParticipantLeft);
    };
  }, [sessionId]);

  const loadParticipants = async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      console.log('🔍 Loading participants for session:', sessionId);
      const data = await collaborationService.getPresence(sessionId).catch((err) => {
        // If 403, user is not a participant yet (waiting in lobby)
        if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
          console.log('⏳ Not a participant yet, will retry after session starts');
          return { participants: [] };
        }
        throw err;
      });
      console.log('🔍 Presence API response:', data);
      
      // Handle different response formats
      let participantsArray = [];
      if (Array.isArray(data)) {
        participantsArray = data;
      } else if (data?.participants && Array.isArray(data.participants)) {
        participantsArray = data.participants;
      } else if (data?.users && Array.isArray(data.users)) {
        participantsArray = data.users;
      }
      
      console.log('🔍 Participants array:', participantsArray);
      
      const list: Participant[] = participantsArray.map((p: any) => ({
        user_id: p.user_id || p.id,
        username: p.username || p.name || 'Unknown',
        avatar: p.avatar,
        status: p.is_active ? 'joined' : 'pending',
        joinedAt: p.last_seen || p.joined_at || undefined,
        is_active: p.is_active,
        current_tool: p.current_tool,
        current_page: p.current_page,
      }));
      
      console.log('🔍 Processed participants:', list);
      setParticipants(list);
    } catch (err) {
      console.error('❌ Failed to load participants:', err);
      setParticipants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const joinedCount = participants.filter(p => p.status === 'joined').length; // ready (joined)
  const activeCount = participants.length;
  const pendingCount = participants.filter(p => p.status === 'pending').length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'white',
          borderRadius: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '32px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <UserGroupIcon style={{ width: '32px', height: '32px', color: 'white' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                  Collaboration Lobby
                </h2>
              </div>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                {storyTitle}
              </p>
            </div>
            <button
              onClick={onExit}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <XMarkIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {joinedCount}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                Joined
              </div>
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                Pending
              </div>
            </div>
          </div>
        </div>

        {/* Participants List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : participants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <UserGroupIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>No participants yet</p>
              <p style={{ fontSize: '14px' }}>Invite friends to start collaborating</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {participants.map((participant) => (
                  <motion.div
                    key={participant.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: participant.status === 'joined' ? '#f0fdf4' : '#fef3c7',
                      border: participant.status === 'joined' ? '2px solid #86efac' : '2px solid #fcd34d',
                      borderRadius: '12px',
                      transition: 'all 0.3s'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {participant.username.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                        {participant.username}
                        {/* Host badge if applicable (simple heuristic: first joined) */}
                        {participants[0]?.user_id === participant.user_id && (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '12px',
                            color: '#6b7280',
                            background: '#e5e7eb',
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}>Host</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: participant.status === 'joined' ? '#16a34a' : '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px'
                      }}>
                        {participant.status === 'joined' ? (
                          <>
                            <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                            <span>Ready</span>
                          </>
                        ) : (
                          <>
                            <ClockIcon style={{ width: '16px', height: '16px' }} />
                            <span>Waiting...</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Icon */}
                   {isHost && participants[0]?.user_id !== participant.user_id ? (
                     <button
                       onClick={async () => {
                         const ok = window.confirm(`Remove ${participant.username} from the lobby?`);
                         if (!ok) return;
                         try {
                           await collaborationService.kickParticipant(sessionId, participant.user_id);
                           try { (window as any).toast?.success?.(`${participant.username} was removed`); } catch {}
                           // Refresh presence
                           loadParticipants(false);
                         } catch (err) {
                           console.error('Kick failed', err);
                           alert('Failed to remove participant');
                         }
                       }}
                       style={{
                         padding: '8px 12px',
                         background: '#ef4444',
                         color: 'white',
                         border: 'none',
                         borderRadius: '8px',
                         cursor: 'pointer',
                         fontSize: '14px',
                         fontWeight: 600
                       }}
                       title="Remove from lobby"
                     >
                       Kick
                     </button>
                   ) : participant.status === 'joined' ? (
                     <CheckCircleIcon style={{ width: '32px', height: '32px', color: '#16a34a' }} />
                   ) : (
                     <motion.div
                       animate={{ rotate: 360 }}
                       transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                     >
                       <ClockIcon style={{ width: '32px', height: '32px', color: '#d97706' }} />
                     </motion.div>
                   )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          gap: '12px'
        }}>
          {isHost ? (
            <>
              <button
                onClick={onInviteMore}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'white',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  color: '#667eea',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#667eea';
                }}
              >
                <UserPlusIcon style={{ width: '20px', height: '20px' }} />
                Invite More
              </button>
              <button
                onClick={onStart}
                disabled={activeCount < 2}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: activeCount >= 2 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: joinedCount > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: joinedCount > 0 ? 1 : 0.5
                }}
              >
                <PlayIcon style={{ width: '20px', height: '20px' }} />
                Start Collaboration
              </button>
            </>
          ) : (
            <>
              <div style={{ flex: 1, textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                Waiting for host to start...
              </div>
            </>
          )}
        </div>
      </motion.div>

    </div>
  );
};

export default CollaborationLobby;
