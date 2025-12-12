import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/enhanced-social.css';
import { 
  UserPlusIcon, 
  UsersIcon, 
  TrophyIcon, 
  CheckIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  UserMinusIcon, 
  ArrowPathIcon,
  SparklesIcon,
  BoltIcon,
  HeartIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  socialService, 
  SearchedUser, 
  Friend, 
  FriendRequest,
  CollaborationInvite,
  ActivityItem,
  LeaderboardUser,
  FriendProfile
} from '../../services/social.service';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import AnonymousPrompt from '../ui/AnonymousPrompt';
import { AvatarWithBorder } from '../common/AvatarWithBorder';

const EnhancedSocialPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { decrementFriendRequests, fetchNotificationCounts } = useNotificationStore();
  const isAnonymous = user?.id === 'anonymous' || !isAuthenticated;
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'friends' | 'activity' | 'leaderboard'>('friends');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'overall' | 'achievements' | 'likes' | 'published'>('overall');
  
  // Modals
  const [isAddFriendsModalOpen, setIsAddFriendsModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isManageFriendsModalOpen, setIsManageFriendsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FriendProfile | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [allUsers, setAllUsers] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Data
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [collaborationInvites, setCollaborationInvites] = useState<CollaborationInvite[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<SearchedUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  // Load data on mount
  useEffect(() => {
    if (!isAnonymous) {
      loadAllData();
    }
  }, [isAnonymous]);

  // Listen for real-time friend request events
  useEffect(() => {
    const handleFriendRequest = (event: any) => {
      console.log('👥 Friend request event received:', event.detail);
      // Reload friend requests
      socialService.getFriendRequests().then(setFriendRequests).catch(console.error);
      fetchNotificationCounts();
    };

    const handleFriendRequestAccepted = (event: any) => {
      console.log('✅ Friend request accepted event received:', event.detail);
      // Reload all social data
      loadAllData();
    };

    const handleCollaborationInvite = (event: any) => {
      const detail = event.detail;
      console.log('🔔 EnhancedSocialPage received collaboration-invite-received event:', detail);
      console.log('🔄 Reloading friends list to show new collaboration invite');
      
      // Reload friends to show the collaboration invite badge
      socialService.getFriends().then(friendsData => {
        const sortedFriends = sortFriendsByActivity(friendsData);
        setFriends(sortedFriends);
        console.log('✅ Friends list updated with collaboration invite');
      }).catch(console.error);
      
      // Also reload collaboration invites
      socialService.getCollaborationInvites().then(setCollaborationInvites).catch(console.error);
    };

    window.addEventListener('friend-request', handleFriendRequest);
    window.addEventListener('friend-request-accepted', handleFriendRequestAccepted);
    window.addEventListener('collaboration-invite-received', handleCollaborationInvite);
    
    return () => {
      window.removeEventListener('friend-request', handleFriendRequest);
      window.removeEventListener('friend-request-accepted', handleFriendRequestAccepted);
      window.removeEventListener('collaboration-invite-received', handleCollaborationInvite);
    };
  }, [isAnonymous]);

  // Search users when query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() && !isAnonymous) {
        handleSearch();
      } else if (isAddFriendsModalOpen && !searchQuery.trim() && allUsers.length > 0) {
        setSearchResults(allUsers);
      } else if (!searchQuery.trim() && !isAddFriendsModalOpen) {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isAddFriendsModalOpen, allUsers, isAnonymous]);

  const sortFriendsByActivity = (friendsList: Friend[]) => {
    return [...friendsList].sort((a, b) => {
      // First priority: Online status
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      
      // Default: alphabetical by name
      return a.name.localeCompare(b.name);
    });
  };

  const loadAllData = async () => {
    // Try to load from cache first
    const { useCacheStore } = await import('../../stores/cacheStore');
    const cacheStore = useCacheStore.getState();
    
    const cachedFriends = cacheStore.getCache<any[]>('friendsList');
    const cachedRequests = cacheStore.getCache<any[]>('friendRequests');
    const cachedActivity = cacheStore.getCache<any[]>('activityFeed');
    const cachedLeaderboard = cacheStore.getCache<any[]>('leaderboard');
    
    // If we have cached data, use it immediately
    if (cachedFriends) {
      console.log('📦 Using cached friends list');
      const sortedFriends = sortFriendsByActivity(cachedFriends);
      setFriends(sortedFriends);
    }
    if (cachedRequests) {
      console.log('📦 Using cached friend requests');
      setFriendRequests(cachedRequests);
    }
    if (cachedActivity) {
      console.log('📦 Using cached activity feed');
      setActivityFeed(cachedActivity);
    }
    if (cachedLeaderboard) {
      console.log('📦 Using cached leaderboard');
      setLeaderboard(cachedLeaderboard);
    }
    
    // If all cache is valid, set loading to false immediately
    if (cachedFriends && cachedRequests && cachedActivity && cachedLeaderboard) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    
    try {
      // Fetch fresh data in background
      const [friendsData, requestsData, collabInvitesData, activityData, suggestionsData, leaderboardData] = await Promise.all([
        socialService.getFriends(),
        socialService.getFriendRequests(),
        socialService.getCollaborationInvites(),
        socialService.getActivityFeed(),
        socialService.getFriendSuggestions(),
        socialService.getLeaderboard(),
      ]);
      
      // Debug: Log friends data to see if last_message_time is present
      console.log('📋 Friends data from backend:', friendsData);
      console.log('📋 First friend:', friendsData[0]);
      console.log('🎨 Collaboration invites:', collabInvitesData);
      
      // Sort friends by message activity
      const sortedFriends = sortFriendsByActivity(friendsData);
      console.log('✅ Sorted friends:', sortedFriends.map(f => ({ name: f.name, last_message_time: f.last_message_time, unread: f.unread_messages })));
      
      // Mark activities as read based on localStorage
      const readActivities = JSON.parse(localStorage.getItem('readActivities') || '[]');
      const activityDataWithReadStatus = activityData.map(activity => ({
        ...activity,
        is_read: readActivities.includes(activity.id)
      }));
      
      setFriends(sortedFriends);
      setFriendRequests(requestsData);
      setCollaborationInvites(collabInvitesData);
      setActivityFeed(activityDataWithReadStatus);
      setFriendSuggestions(suggestionsData);
      setLeaderboard(leaderboardData);
      
      // Cache the fresh data
      cacheStore.setCache('friendsList', friendsData, 3 * 60 * 1000); // 3 minutes
      cacheStore.setCache('friendRequests', requestsData, 3 * 60 * 1000);
      cacheStore.setCache('activityFeed', activityData, 5 * 60 * 1000); // 5 minutes
      cacheStore.setCache('leaderboard', leaderboardData, 10 * 60 * 1000); // 10 minutes
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async (offset: number = 0) => {
    setIsLoadingUsers(true);
    if (offset === 0) {
      setSearchResults([]);
    }
    try {
      const result = await socialService.searchUsers('', offset, 10, true);
      setSearchResults(result.users);
      setAllUsers(result.users);
      setCurrentOffset(offset);
      setHasMore(result.hasMore);
      setTotalUsers(result.total);
    } catch (error) {
      console.error('Error loading all users:', error);
      setSearchResults([]);
      setAllUsers([]);
      setHasMore(false);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadNextUsers = () => {
    const nextOffset = currentOffset + 10;
    loadAllUsers(nextOffset);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(allUsers);
      return;
    }

    setIsSearching(true);
    try {
      const result = await socialService.searchUsers(searchQuery, 0, 20, false);
      setSearchResults(result.users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenAddFriendsModal = () => {
    setIsAddFriendsModalOpen(true);
    setSearchQuery('');
    loadAllUsers();
  };

  const handleSendFriendRequest = async (userId: number) => {
    try {
      await socialService.sendFriendRequest(userId);
      setSearchResults(prev => prev.map(user => 
        user.id === userId ? { ...user, request_sent: true } : user
      ));
      setFriendSuggestions(prev => prev.map(user => 
        user.id === userId ? { ...user, request_sent: true } : user
      ));
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await socialService.acceptFriendRequest(requestId);
      await loadAllData();
      decrementFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await socialService.rejectFriendRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      decrementFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request');
    }
  };

  const handleAcceptCollabInvite = async (inviteId: number, sessionId: string, storyTitle: string, inviterName?: string, isSessionActive?: boolean) => {
    try {
      await socialService.respondToCollaborationInvite(inviteId, 'accept');
      setCollaborationInvites(prev => prev.filter(inv => inv.id !== inviteId));
      
      // Fetch session data to check if session is already active
      let sessionIsActive = isSessionActive || false;
      
      try {
        // Use the getCollaborationSession API function instead
        const { getCollaborationSession } = await import('../../services/collaborationApi');
        const sessionData = await getCollaborationSession(sessionId);
        console.log('📊 Fetched session data:', sessionData);
        // Session is active if lobby is closed
        sessionIsActive = sessionData.is_lobby_open === false;
        console.log('✅ Session active status:', sessionIsActive, 'is_lobby_open:', sessionData.is_lobby_open);
      } catch (error) {
        console.error('⚠️ Failed to fetch session status, using default:', error);
      }
      
      // Show waiting screen by navigating with special state
      navigate('/collaboration-waiting', {
        state: {
          sessionId: sessionId,
          storyTitle: storyTitle,
          inviterName: inviterName || 'Host',
          isWaiting: true,
          isSessionActive: sessionIsActive
        }
      });
      
      setIsRequestsModalOpen(false);
    } catch (error) {
      console.error('Error accepting collaboration invite:', error);
      alert('Failed to accept invitation');
    }
  };

  const handleDeclineCollabInvite = async (inviteId: number) => {
    try {
      await socialService.respondToCollaborationInvite(inviteId, 'decline');
      setCollaborationInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (error) {
      console.error('Error declining collaboration invite:', error);
      alert('Failed to decline invitation');
    }
  };

  const handleUnfriend = async (friendId: number, friendName: string) => {
    const confirmed = window.confirm(`Remove ${friendName} from friends?`);
    if (!confirmed) return;

    try {
      await socialService.unfriendUser(friendId);
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Error unfriending user:', error);
      alert('Failed to unfriend user');
    }
  };

  const handleViewProfile = async (userId: number) => {
    try {
      const profile = await socialService.getFriendProfile(userId);
      if (profile) {
        setSelectedProfile(profile);
        setIsProfileModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const scrollToFriendsList = () => {
    const friendsSection = document.querySelector('.friends-grid');
    if (friendsSection) {
      friendsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenRequestsModal = () => {
    setIsRequestsModalOpen(true);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'published': return '📚';
      case 'liked': return '❤️';
      case 'commented': return '💬';
      case 'commented_on_your_story': return '💬';
      case 'liked_your_story': return '❤️';
      case 'saved_your_story': return '💾';
      case 'achievement': return '🏆';
      case 'followed': return '👥';
      default: return '✨';
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.activity_type) {
      case 'published':
        return `published "${activity.story_title}"`;
      case 'liked':
        return `liked "${activity.story_title}"`;
      case 'commented':
        return `commented on "${activity.story_title}"`;
      case 'commented_on_your_story':
        return `commented on your story "${activity.story_title}"`;
      case 'liked_your_story':
        return `liked your story "${activity.story_title}"`;
      case 'saved_your_story':
        return `saved your story "${activity.story_title}"`;
      case 'achievement':
        return `earned ${activity.achievement_name}`;
      case 'followed':
        return 'started following someone';
      default:
        return 'did something cool';
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    // Mark activity as read
    markActivityAsRead(activity.id);
    
    // Navigate to story if activity has a story_id
    if (activity.story_id) {
      navigate(`/story/${activity.story_id}`);
    }
  };

  const markActivityAsRead = (activityId: number) => {
    // Update the activity feed to mark this activity as read
    setActivityFeed(prevFeed => 
      prevFeed.map(activity => 
        activity.id === activityId 
          ? { ...activity, is_read: true }
          : activity
      )
    );
    
    // Store in localStorage to persist across sessions
    const readActivities = JSON.parse(localStorage.getItem('readActivities') || '[]');
    if (!readActivities.includes(activityId)) {
      readActivities.push(activityId);
      localStorage.setItem('readActivities', JSON.stringify(readActivities));
    }
  };

  const isActivityClickable = (activity: ActivityItem) => {
    return activity.story_id !== undefined && activity.story_id !== null;
  };

  const getFilteredLeaderboard = () => {
    const sorted = [...leaderboard].sort((a, b) => {
      switch (leaderboardFilter) {
        case 'overall':
          // Weighted scoring system based on quality metrics
          // Published Stories: 10 points each (most important)
          // Achievements: 5 points each
          // Likes: 3 points each
          const scoreA = (a.story_count * 10) + ((a.achievement_count || 0) * 5) + (a.total_likes * 3);
          const scoreB = (b.story_count * 10) + ((b.achievement_count || 0) * 5) + (b.total_likes * 3);
          return scoreB - scoreA;
        case 'achievements':
          // Sort by number of earned achievements
          return (b.achievement_count || 0) - (a.achievement_count || 0);
        case 'likes':
          // Sort by total likes
          return b.total_likes - a.total_likes;
        case 'published':
          // Sort by story count
          return b.story_count - a.story_count;
        default:
          return 0;
      }
    });
    
    // Update ranks based on current filter
    return sorted.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  };

  if (isAnonymous) {
    return <AnonymousPrompt feature="Social" message="Create a free account to connect with other creators and make friends!" />;
  }

  if (isLoading) {
    return (
      <div className="social-page-container">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading your friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="social-page-container">
      {/* Big, Colorful Tab Navigation for Preschoolers */}
      <div className="social-tabs-container">
        <button
          className={`social-tab ${activeTab === 'friends' ? 'social-tab-active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <UsersIcon className="social-tab-icon" />
          <span className="social-tab-text">My Friends</span>
          {friendRequests.length > 0 && <span className="social-tab-badge social-tab-badge-alert">{friendRequests.length}</span>}
        </button>
        
        <button
          className={`social-tab ${activeTab === 'activity' ? 'social-tab-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <SparklesIcon className="social-tab-icon" />
          <span className="social-tab-text">Activity</span>
          {(() => {
            const unreadCount = activityFeed.filter(activity => !activity.is_read).length;
            return unreadCount > 0 && <span className="social-tab-badge social-tab-badge-alert">{unreadCount}</span>;
          })()}
        </button>
        
        <button
          className={`social-tab ${activeTab === 'leaderboard' ? 'social-tab-active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <TrophyIcon className="social-tab-icon" />
          <span className="social-tab-text">Top Stars</span>
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="social-tab-content">
          {/* Friends List */}
          <div className="social-section">
            <div className="social-section-header-with-action">
              <div className="friends-header-actions">
                <button 
                  className="add-friends-btn-large"
                  onClick={handleOpenAddFriendsModal}
                >
                  <UserPlusIcon className="btn-icon-large" />
                  Add
                </button>
                <button 
                  className="requests-btn-large"
                  onClick={handleOpenRequestsModal}
                >
                  <svg className="btn-icon-large" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Requests
                  {friendRequests.length > 0 && (
                    <span className="requests-badge">{friendRequests.length}</span>
                  )}
                </button>
                <button 
                  className="manage-friends-btn-large"
                  onClick={() => setIsManageFriendsModalOpen(true)}
                >
                  <svg className="btn-icon-large" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Manage
                </button>
              </div>
              <div className="friends-header-left">
                <h2 className="social-section-title-large">
                  👥 My Friends ({friends.length})
                </h2>
                <span className="online-count">
                  🟢 {friends.filter(f => f.is_online).length} online
                </span>
              </div>
            </div>
            
            {friends.length > 0 ? (
              <div className="friends-list">
                {friends.map((friend) => {
                  // Check if this friend has sent a collaboration invite
                  const collabInvite = collaborationInvites.find(invite => invite.inviter_id === friend.id);
                  
                  return (
                    <div 
                      key={friend.id} 
                      className="friend-card-horizontal"
                      style={collabInvite ? { 
                        borderLeft: '4px solid #8B5CF6', 
                        backgroundColor: 'rgba(139, 92, 246, 0.05)',
                        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                        alignItems: window.innerWidth < 640 ? 'stretch' : 'center'
                      } : undefined}
                    >
                      <div className="friend-card-left min-w-0 flex-1" onClick={() => !collabInvite && handleViewProfile(friend.id)} style={{ cursor: collabInvite ? 'default' : 'pointer' }}>
                        <div className="friend-avatar-container flex-shrink-0">
                          <div style={{ position: 'relative' }}>
                            <AvatarWithBorder 
                              avatar={friend.avatar}
                              borderId={friend.selected_avatar_border || 'basic'}
                              size={56}
                            />
                            {collabInvite && (
                              <div style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#8B5CF6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                animation: 'pulse 2s infinite',
                                zIndex: 10
                              }}>
                                🎨
                              </div>
                            )}
                          </div>
                          <div className={`online-dot-small ${friend.is_online ? 'online-dot-active' : ''}`}></div>
                        </div>
                        <div className="friend-info min-w-0 flex-1">
                          <div className="friend-name-medium truncate">
                            {friend.name}
                          </div>
                          {collabInvite ? (
                            <div className="text-purple-600 font-semibold text-xs sm:text-sm mt-1 truncate">
                              📚 Collaboration: {collabInvite.story_title}
                            </div>
                          ) : (
                            <div className="friend-stats-small">
                              📚 {friend.story_count} stories
                            </div>
                          )}
                        </div>
                      </div>
                      {collabInvite && (
                        <div className="flex flex-row gap-3 justify-center sm:justify-start ml-0 sm:ml-3 mt-3 sm:mt-0 flex-shrink-0">
                          <button
                            onClick={() => handleAcceptCollabInvite(collabInvite.id, collabInvite.session_id, collabInvite.story_title, collabInvite.inviter_name, collabInvite.is_session_active)}
                            className="px-3 py-2 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 outline-none whitespace-nowrap"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                              e.currentTarget.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.4)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.3)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            onMouseDown={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
                            }}
                            title="Accept Collaboration"
                          >
                            <CheckIcon className="w-5 h-5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleDeclineCollabInvite(collabInvite.id)}
                            className="px-3 py-2 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 outline-none whitespace-nowrap"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                              e.currentTarget.style.boxShadow = '0 6px 12px rgba(239, 68, 68, 0.4)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.3)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            onMouseDown={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                            }}
                            onMouseUp={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
                            }}
                            title="Decline Collaboration"
                          >
                            <XMarkIcon className="w-5 h-5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-large">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">No friends yet!</div>
                <div className="empty-state-text">Click "Add Friends" to find creators</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="social-tab-content">
          <div className="social-section">
            <h2 className="social-section-title-large">
              ✨ What's Happening
            </h2>
            
            {activityFeed.length > 0 ? (
              <div className="activity-feed">
                {activityFeed.map((activity) => {
                  const isYourStory = ['commented_on_your_story', 'liked_your_story', 'saved_your_story'].includes(activity.activity_type);
                  const isUnread = !activity.is_read;
                  return (
                    <div 
                      key={activity.id} 
                      className={`activity-card ${isActivityClickable(activity) ? 'activity-card-clickable' : ''} ${isYourStory ? 'activity-card-highlighted' : ''} ${isUnread ? 'activity-card-unread' : ''}`}
                      onClick={() => isActivityClickable(activity) && handleActivityClick(activity)}
                      role={isActivityClickable(activity) ? 'button' : undefined}
                      tabIndex={isActivityClickable(activity) ? 0 : undefined}
                      onKeyPress={(e) => isActivityClickable(activity) && e.key === 'Enter' && handleActivityClick(activity)}
                    >
                      <div className="activity-icon-large">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="activity-content">
                        <div className="activity-user">
                          <AvatarWithBorder 
                            avatar={activity.user_avatar}
                            borderId={activity.user_avatar_border || 'basic'}
                            size={32}
                            style={{ display: 'inline-flex' }}
                          />
                          <span className="activity-name" style={{ marginLeft: '8px' }}>{activity.user_name}</span>
                        </div>
                        <div className="activity-text">
                          {getActivityText(activity)}
                        </div>
                        <div className="activity-time">{getTimeAgo(activity.timestamp)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-large">
                <div className="empty-state-icon">✨</div>
                <div className="empty-state-title">No activity yet!</div>
                <div className="empty-state-text">Your friends' activities will show here</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="social-tab-content">
          <div className="social-section">
            <h2 className="social-section-title-large">
              🏆 Top Story Creators
            </h2>
            
            {/* Leaderboard Filter Buttons */}
            <div className="leaderboard-filters">
              <button
                className={`leaderboard-filter-btn ${leaderboardFilter === 'overall' ? 'filter-active' : ''}`}
                onClick={() => setLeaderboardFilter('overall')}
              >
                <span className="filter-icon">🌟</span>
                Overall
              </button>
              <button
                className={`leaderboard-filter-btn ${leaderboardFilter === 'published' ? 'filter-active' : ''}`}
                onClick={() => setLeaderboardFilter('published')}
              >
                <span className="filter-icon">📚</span>
                Published
              </button>
              <button
                className={`leaderboard-filter-btn ${leaderboardFilter === 'likes' ? 'filter-active' : ''}`}
                onClick={() => setLeaderboardFilter('likes')}
              >
                <span className="filter-icon">❤️</span>
                Likes
              </button>
              <button
                className={`leaderboard-filter-btn ${leaderboardFilter === 'achievements' ? 'filter-active' : ''}`}
                onClick={() => setLeaderboardFilter('achievements')}
              >
                <span className="filter-icon">🏆</span>
                Achievements
              </button>
            </div>
            
            {leaderboard.length > 0 ? (
              <div className="leaderboard-list">
                {getFilteredLeaderboard().map((user, index) => (
                  <div key={user.id} className="leaderboard-card">
                    <div className="leaderboard-rank">
                      {user.rank === 1 && <div className="rank-medal gold">🥇</div>}
                      {user.rank === 2 && <div className="rank-medal silver">🥈</div>}
                      {user.rank === 3 && <div className="rank-medal bronze">🥉</div>}
                      {user.rank > 3 && <div className="rank-number">#{user.rank}</div>}
                    </div>
                    <AvatarWithBorder 
                      avatar={user.avatar}
                      borderId={user.selected_avatar_border || 'basic'}
                      size={64}
                    />
                    <div className="leaderboard-info">
                      <div className="leaderboard-name">{user.name}</div>
                      <div className="leaderboard-badges">
                        {user.badges.map((badge, i) => (
                          <span key={i} className="badge-emoji">{badge}</span>
                        ))}
                      </div>
                    </div>
                    <div className="leaderboard-stats">
                      {leaderboardFilter === 'overall' && (
                        <>
                          <div className="stat-item">
                            <div className="stat-icon">📚</div>
                            <div className="stat-value">{user.story_count}</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-icon">❤️</div>
                            <div className="stat-value">{user.total_likes}</div>
                          </div>
                          <div className="stat-item">
                            <div className="stat-icon">🏆</div>
                            <div className="stat-value">{user.achievement_count || 0}</div>
                          </div>
                        </>
                      )}
                      {leaderboardFilter === 'published' && (
                        <div className="stat-item">
                          <div className="stat-icon">📚</div>
                          <div className="stat-value">{user.story_count}</div>
                        </div>
                      )}
                      {leaderboardFilter === 'likes' && (
                        <div className="stat-item">
                          <div className="stat-icon">❤️</div>
                          <div className="stat-value">{user.total_likes}</div>
                        </div>
                      )}
                      {leaderboardFilter === 'achievements' && (
                        <div className="stat-item">
                          <div className="stat-icon">🏆</div>
                          <div className="stat-value">{user.achievement_count || 0}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-large">
                <div className="empty-state-icon">🏆</div>
                <div className="empty-state-title">No leaderboard yet!</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Friends Modal */}
      {isManageFriendsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsManageFriendsModalOpen(false)}>
          <div className="add-friends-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-large">
              <h2 className="modal-title-large">⚙️ Manage Friends</h2>
              <button 
                className="modal-close-btn-large"
                onClick={() => setIsManageFriendsModalOpen(false)}
                type="button"
              >
                <XMarkIcon className="close-icon" />
              </button>
            </div>
            
            <div className="modal-content-large">
              {friends.length > 0 ? (
                <div className="manage-friends-list">
                  {friends.map((friend) => (
                    <div key={friend.id} className="manage-friend-card">
                      <div className="manage-friend-info">
                        <div className="friend-avatar-container">
                          <div style={{ position: 'relative' }}>
                            <AvatarWithBorder 
                              avatar={friend.avatar}
                              borderId={friend.selected_avatar_border || 'basic'}
                              size={56}
                            />
                          </div>
                          <div className={`online-dot-small ${friend.is_online ? 'online-dot-active' : ''}`}></div>
                        </div>
                        <div>
                          <div className="manage-friend-name">{friend.name}</div>
                          <div className="manage-friend-username">@{friend.username}</div>
                        </div>
                      </div>
                      <div className="manage-friend-actions">
                        <button 
                          className="manage-action-btn unfriend-btn"
                          onClick={() => handleUnfriend(friend.id, friend.name)}
                          title="Unfriend"
                        >
                          <svg className="action-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                          </svg>
                          Unfriend
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-large">
                  <div className="empty-state-icon">👥</div>
                  <div className="empty-state-title">No friends yet</div>
                  <div className="empty-state-text">Add some friends to get started!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Friend Requests Modal */}
      {isRequestsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRequestsModalOpen(false)}>
          <div className="add-friends-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-large">
              <h2 className="modal-title-large">🎉 Friend Requests</h2>
              <button 
                className="modal-close-btn-large"
                onClick={() => setIsRequestsModalOpen(false)}
                type="button"
              >
                <XMarkIcon className="close-icon" />
              </button>
            </div>
            
            <div className="modal-content-large">
              {friendRequests.length > 0 ? (
                <div className="social-cards-grid">
                  {/* Friend Requests Only - Collaboration invites now appear in Profile > Social > Friends tab */}
                  {friendRequests.map((request) => (
                    <div key={`friend-${request.id}`} className="friend-request-card">
                      <AvatarWithBorder 
                        avatar={request.sender_avatar}
                        borderId={request.selected_avatar_border || 'basic'}
                        size={72}
                      />
                      <div className="friend-request-info">
                        <div className="friend-request-name">{request.sender_name}</div>
                        <div className="friend-request-time">{getTimeAgo(request.created_at)}</div>
                      </div>
                      <div className="friend-request-actions">
                        <button 
                          className="friend-request-accept-btn"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <CheckIcon className="btn-icon" />
                          Yes!
                        </button>
                        <button 
                          className="friend-request-decline-btn"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <XMarkIcon className="btn-icon" />
                          No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-large">
                  <div className="empty-state-icon">🎉</div>
                  <div className="empty-state-title">All caught up!</div>
                  <div className="empty-state-text">No pending requests or invitations</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Profile Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={() => {
          setIsProfileModalOpen(false);
          setSelectedProfile(null);
        }}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn-large"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalOpen(false);
                setSelectedProfile(null);
              }}
              type="button"
            >
              <XMarkIcon className="close-icon" />
            </button>
            
            <div className="profile-header">
              <div className="profile-cover"></div>
              <div className="profile-avatar-container">
                <div style={{ position: 'relative' }}>
                  <AvatarWithBorder 
                    avatar={selectedProfile.avatar}
                    borderId={selectedProfile.selected_avatar_border || 'basic'}
                    size={120}
                  />
                  <div className={`profile-online-indicator ${selectedProfile.is_online ? 'online' : 'offline'}`} style={{ position: 'absolute', bottom: '8px', right: '8px' }}></div>
                </div>
              </div>
            </div>
            
            <div className="profile-info">
              <h2 className="profile-name">{selectedProfile.name}</h2>
              <p className="profile-username">@{selectedProfile.username}</p>
              {selectedProfile.is_online && (
                <div className="profile-status-online">
                  <span className="status-dot"></span>
                  <span>Online now</span>
                </div>
              )}
              {selectedProfile.bio && <p className="profile-bio">{selectedProfile.bio}</p>}
              
              {selectedProfile.badges.length > 0 && (
                <div className="profile-badges">
                  {selectedProfile.badges.map((badge, i) => (
                    <span key={i} className="profile-badge" title="Achievement badge">{badge}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="profile-stats-grid">
              <div className="profile-stat">
                <div className="profile-stat-icon">📚</div>
                <div className="profile-stat-value">{selectedProfile.story_count}</div>
                <div className="profile-stat-label">Stories</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-icon">👀</div>
                <div className="profile-stat-value">{selectedProfile.total_reads}</div>
                <div className="profile-stat-label">Reads</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-icon">❤️</div>
                <div className="profile-stat-value">{selectedProfile.total_likes}</div>
                <div className="profile-stat-label">Likes</div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="profile-actions">
              <button 
                className="profile-action-btn profile-action-view profile-action-full-width"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setSelectedProfile(null);
                  navigate('/public-library');
                }}
                title="View all stories"
              >
                <svg className="action-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                View Stories
              </button>
            </div>
            
            {selectedProfile.recent_stories.length > 0 && (
              <div className="profile-stories">
                <h3 className="profile-stories-title">📚 Recent Stories</h3>
                <div className="profile-stories-grid">
                  {selectedProfile.recent_stories.map((story) => (
                    <div 
                      key={story.id} 
                      className="profile-story-card"
                      onClick={() => {
                        setIsProfileModalOpen(false);
                        setSelectedProfile(null);
                        navigate(`/story/${story.id}`);
                      }}
                      title={`Read "${story.title}"`}
                    >
                      <div className="profile-story-cover">{story.cover}</div>
                      <div className="profile-story-title">{story.title}</div>
                      <div className="profile-story-stats">
                        <span className="profile-story-likes">❤️ {story.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedProfile.recent_stories.length === 0 && (
              <div className="profile-empty-stories">
                <div className="empty-stories-icon">📖</div>
                <div className="empty-stories-text">No stories yet</div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* Add Friends Modal */}
      {isAddFriendsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddFriendsModalOpen(false)}>
          <div className="add-friends-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-large">
              <h2 className="modal-title-large">🔍 Find Friends</h2>
              <button 
                className="modal-close-btn-large"
                onClick={() => setIsAddFriendsModalOpen(false)}
              >
                <XMarkIcon className="close-icon" />
              </button>
            </div>
            
            <div className="modal-search-large">
              <MagnifyingGlassIcon className="search-icon-large" />
              <input
                type="text"
                placeholder="Search for friends..."
                className="search-input-large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {!searchQuery && hasMore && (
              <div className="modal-load-more">
                <button
                  onClick={loadNextUsers}
                  disabled={isLoadingUsers}
                  className="load-more-btn"
                >
                  <ArrowPathIcon className="btn-icon" />
                  Load More Friends
                </button>
              </div>
            )}

            <div className="modal-results-large">
              {isLoadingUsers ? (
                <div className="loading-state-large">
                  <div className="loading-icon">⏳</div>
                  <p>Finding friends...</p>
                </div>
              ) : isSearching ? (
                <div className="loading-state-large">
                  <div className="loading-icon">🔍</div>
                  <p>Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="search-results-grid">
                  {searchResults.map((user) => (
                    <div key={user.id} className="search-result-card">
                      <AvatarWithBorder 
                        avatar={user.avatar}
                        borderId={user.selected_avatar_border || 'basic'}
                        size={48}
                      />
                      <div className="search-result-info">
                        <div className="search-result-name">{user.name}</div>
                        <div className="search-result-stats">
                          📚 {user.story_count} {user.story_count === 1 ? 'story' : 'stories'}
                        </div>
                      </div>
                      <div className="search-result-action">
                        {user.is_friend ? (
                          <button className="search-btn-disabled">
                            <CheckIcon className="btn-icon" />
                            Friends
                          </button>
                        ) : user.request_sent ? (
                          <button className="search-btn-disabled">
                            Sent!
                          </button>
                        ) : (
                          <button 
                            className="search-btn-add"
                            onClick={() => handleSendFriendRequest(user.id)}
                          >
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-large">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">
                    {searchQuery ? `No users found` : 'No more users'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSocialPage;
