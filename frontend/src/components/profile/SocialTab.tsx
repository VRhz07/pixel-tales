import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocialStore, Friend, User, FriendRequest } from '../../stores/socialStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const SocialTab = () => {
  const navigate = useNavigate();
  const { playSound, playSuccess, playButtonClick } = useSoundEffects();
  const {
    friends,
    friendRequests,
    searchResults,
    searchQuery,
    selectedTab,
    setSelectedTab,
    setSearchQuery,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    startChat,
    removeCollaborationInviteFromFriend
  } = useSocialStore();

  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  // Listen for real-time collaboration invite updates
  useEffect(() => {
    const handleCollaborationInvite = (event: any) => {
      const detail = event.detail;
      console.log('🔔 SocialTab received collaboration-invite-received event:', detail);
      console.log('🔄 Force updating SocialTab to show new collaboration invite');
      // Trigger re-render to show updated friends list
      setForceUpdateKey(prev => prev + 1);
    };

    // Listen for the custom event dispatched from App.tsx
    window.addEventListener('collaboration-invite-received', handleCollaborationInvite);

    return () => {
      window.removeEventListener('collaboration-invite-received', handleCollaborationInvite);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const handleAcceptCollabInvite = async (friend: Friend) => {
    if (!friend.collaborationInvite) return;
    
    try {
      playSound('collaboration-invite');
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invites/${friend.collaborationInvite.id}/respond/`,
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
        playSuccess();
        // Remove the invite from the friend
        removeCollaborationInviteFromFriend(Number(friend.id));
        
        // Navigate to waiting screen
        navigate('/collaboration-waiting', {
          state: {
            sessionId: friend.collaborationInvite.session_id,
            storyTitle: friend.collaborationInvite.story_title,
            inviterName: friend.name,
            isWaiting: true
          }
        });
      }
    } catch (err) {
      console.error('Failed to accept collaboration invite:', err);
      playSound('error');
      alert('Failed to accept collaboration invitation');
    }
  };

  const handleDeclineCollabInvite = async (friend: Friend) => {
    if (!friend.collaborationInvite) return;
    
    try {
      playSound('button-cancel');
      const token = localStorage.getItem('access_token');
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collaborate/invites/${friend.collaborationInvite.id}/respond/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'decline' })
        }
      );

      // Remove the invite from the friend
      removeCollaborationInviteFromFriend(Number(friend.id));
    } catch (err) {
      console.error('Failed to decline collaboration invite:', err);
      alert('Failed to decline collaboration invitation');
    }
  };

  const FriendCard = ({ friend }: { friend: Friend }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="settings-card hover:shadow-lg transition-all"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
            {friend.avatar}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(friend.status)} shadow-sm`}></div>
          {friend.collaborationInvite && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs shadow-lg animate-pulse">
              🎨
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-lg truncate">{friend.name}</h3>
              {friend.bio && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{friend.bio}</p>
              )}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {friend.collaborationInvite ? (
                <>
                  <button
                    onClick={() => handleAcceptCollabInvite(friend)}
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors shadow-sm font-medium flex items-center gap-1"
                    title="Accept Collaboration"
                  >
                    <span className="text-sm">✓</span>
                  </button>
                  <button
                    onClick={() => handleDeclineCollabInvite(friend)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors shadow-sm font-medium flex items-center gap-1"
                    title="Decline Collaboration"
                  >
                    <span className="text-sm">✕</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      playSound('message-received');
                      startChat(friend.id);
                    }}
                    className="px-2.5 py-1 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600 transition-colors"
                    title="Start Chat"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => {
                      playButtonClick();
                      setShowRemoveConfirm(friend.id);
                    }}
                    className="px-2.5 py-1 bg-red-100 text-red-600 text-sm rounded-md hover:bg-red-200 transition-colors"
                    title="Remove Friend"
                  >
                    ❌
                  </button>
                </>
              )}
            </div>
          </div>
          
          {friend.collaborationInvite && (
            <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
              <p className="text-xs text-purple-700 font-medium">
                📚 Collaboration: "{friend.collaborationInvite.story_title}"
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center space-x-4 text-gray-500">
              <span>📚 {friend.storiesCount} stories</span>
              <span>👥 {friend.mutualFriends} mutual</span>
            </div>
            <div className="flex items-center space-x-1">
              {friend.isOnline ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium text-sm">Online</span>
                </>
              ) : (
                <span className="text-gray-500 text-sm">{friend.lastSeen || 'Offline'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const UserCard = ({ user }: { user: User }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="settings-card hover:shadow-lg transition-all"
    >
      <div className="flex items-start space-x-4">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
          {user.avatar}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-lg truncate">{user.name}</h3>
              {user.bio && (
                <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
              )}
            </div>
            <button
              onClick={() => {
                playSound('friend-request');
                sendFriendRequest(user.id);
              }}
              disabled={user.requestSent}
              className={`add-friend-btn ${user.requestSent ? 'sent' : 'active'}`}
              style={{
                padding: user.requestSent ? '8px 16px' : '10px 20px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '120px',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                cursor: user.requestSent ? 'not-allowed' : 'pointer',
                background: user.requestSent 
                  ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' 
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: user.requestSent ? '#64748b' : 'white',
                boxShadow: user.requestSent 
                  ? '0 2px 4px rgba(0, 0, 0, 0.05)' 
                  : '0 4px 12px rgba(99, 102, 241, 0.3)',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!user.requestSent) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #5b5ff0, #7c3aed)';
                }
              }}
              onMouseLeave={(e) => {
                if (!user.requestSent) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
                }
              }}
            >
              {user.requestSent ? (
                <>
                  <div className="flex items-center justify-center w-4 h-4 bg-green-500 rounded-full">
                    <span style={{ fontSize: '10px', color: 'white' }}>✓</span>
                  </div>
                  <span>Sent</span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full backdrop-blur-sm">
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>+</span>
                  </div>
                  <span>Add Friend</span>
                </>
              )}
              
              {/* Shimmer effect for active button */}
              {!user.requestSent && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    animation: 'shimmer 2s infinite',
                    pointerEvents: 'none'
                  }}
                />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center space-x-4 text-gray-500">
              <span>📚 {user.storiesCount} stories</span>
              <span>👥 {user.mutualFriends} mutual</span>
            </div>
            <div className="text-gray-500 text-sm">
              Joined {new Date(user.joinedDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const FriendRequestCard = ({ request }: { request: FriendRequest }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="settings-card hover:shadow-lg transition-all"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
            {request.from.avatar}
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs shadow-sm">
            📩
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 text-lg">{request.from.name}</h3>
              {request.message && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-blue-700 italic">"{request.message}"</p>
                </div>
              )}
            </div>
            <div className="flex space-x-4 ml-4">
              <button
                onClick={() => {
                  playSuccess();
                  acceptFriendRequest(request.id);
                }}
                className="friend-request-btn accept"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '85px',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0d9668, #047857)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(16, 185, 129, 0.25)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                }}
              >
                <div className="flex items-center justify-center w-4 h-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                </div>
                <span>Accept</span>
                
                {/* Success shimmer effect */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    animation: 'shimmer 3s infinite',
                    pointerEvents: 'none'
                  }}
                />
              </button>
              
              <button
                onClick={() => {
                  playSound('button-cancel');
                  rejectFriendRequest(request.id);
                }}
                className="friend-request-btn decline"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '85px',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1.5px solid #ef4444',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(254, 242, 242, 0.9))',
                  color: '#dc2626',
                  boxShadow: '0 3px 8px rgba(239, 68, 68, 0.15)',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(254, 242, 242, 0.9))';
                  e.currentTarget.style.color = '#dc2626';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
              >
                <div className="flex items-center justify-center w-4 h-4 bg-red-500/20 rounded-full backdrop-blur-sm">
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>×</span>
                </div>
                <span>Decline</span>
                
                {/* Danger pulse effect */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '0',
                    height: '0',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'dangerPulse 4s ease-out infinite',
                    pointerEvents: 'none'
                  }}
                />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center space-x-4 text-gray-500">
              <span>📚 {request.from.storiesCount} stories</span>
              <span>👥 {request.from.mutualFriends} mutual</span>
            </div>
            <div className="text-gray-500 text-sm">
              {new Date(request.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="px-6 py-8 min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, rgba(219, 234, 254, 0.3) 50%, rgba(238, 242, 255, 0.5) 100%)'
      }}
    >
      {/* Enhanced Tab Navigation */}
      <div className="modern-social-nav mb-6">
        <div className="nav-container">
          {[
            { 
              key: 'friends', 
              icon: '👥',
              label: 'Friends',
              count: friends.length
            },
            { 
              key: 'find-friends', 
              icon: '🔍',
              label: 'Find Friends',
              count: null
            },
            { 
              key: 'requests', 
              icon: '📩',
              label: 'Requests',
              count: friendRequests.length
            }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                playSound('tab-switch');
                setSelectedTab(tab.key as any);
              }}
              className={`nav-tab ${selectedTab === tab.key ? 'active' : ''}`}
            >
              <div className="tab-content">
                <div className="tab-icon">{tab.icon}</div>
                <span className="tab-label">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <div className="tab-badge">{tab.count}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Friends Tab */}
      {selectedTab === 'friends' && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="enhanced-section-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl gradient-text-blue mb-2">
                  My Friends
                </h2>
                <p className="text-gray-600">Connect and chat with your storytelling friends</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">{friends.length}</div>
                <div className="text-sm text-gray-500">
                  {friends.length === 1 ? 'friend' : 'friends'}
                </div>
              </div>
            </div>
          </div>

          {friends.length > 0 ? (
            <div className="grid gap-4">
              {friends.map(friend => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          ) : (
            <div className="enhanced-section-header text-center">
              <div className="text-6xl mb-6">👥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">No friends yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Start connecting with other storytellers and share your creative adventures!</p>
              <button
                onClick={() => {
                  playSound('tab-switch');
                  setSelectedTab('find-friends');
                }}
                className="px-8 py-4 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-lg font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
              >
                Find Friends 🔍
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Find Friends Tab */}
      {selectedTab === 'find-friends' && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="enhanced-section-header">
            <div className="mb-6">
              <h2 className="text-2xl gradient-text-purple mb-2">
                Find Friends
              </h2>
              <p className="text-gray-600">Discover new storytellers and expand your creative network</p>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search for storytellers by name or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-14 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm text-gray-900 placeholder-gray-500"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
                🔍
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {searchResults.length > 0 ? (
              searchResults.map(user => (
                <UserCard key={user.id} user={user} />
              ))
            ) : (
              <div className="enhanced-section-header text-center">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">No users found</h3>
                <p className="text-gray-600 max-w-md mx-auto">Try searching with different keywords or browse our community of storytellers</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Friend Requests Tab */}
      {selectedTab === 'requests' && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="enhanced-section-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl gradient-text-emerald mb-2">
                  Friend Requests
                </h2>
                <p className="text-gray-600">Review and respond to friend requests from other storytellers</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">{friendRequests.length}</div>
                <div className="text-sm text-gray-500">
                  {friendRequests.length === 1 ? 'request' : 'requests'}
                </div>
              </div>
            </div>
          </div>

          {friendRequests.length > 0 ? (
            <div className="grid gap-4">
              {friendRequests.map(request => (
                <FriendRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <div className="enhanced-section-header text-center">
              <div className="text-6xl mb-6">📩</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">No friend requests</h3>
              <p className="text-gray-600 max-w-md mx-auto">When someone wants to be your friend, you'll see their request here! Start connecting by finding new friends.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Remove Friend Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">😢</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Remove Friend?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this friend? You'll need to send a new friend request to reconnect.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    playSound('button-cancel');
                    setShowRemoveConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    playSound('error');
                    removeFriend(showRemoveConfirm);
                    setShowRemoveConfirm(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SocialTab;
