import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon, ChatBubbleLeftIcon, UsersIcon, TrophyIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, UserMinusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { socialService, SearchedUser, Friend, FriendRequest } from '../../services/social.service';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useNotificationStore } from '../../stores/notificationStore';
import AnonymousPrompt from '../ui/AnonymousPrompt';
import ChatModal from '../social/ChatModal';

const SocialPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { t } = useI18nStore();
  const { decrementFriendRequests, fetchNotificationCounts } = useNotificationStore();
  const isAnonymous = user?.id === 'anonymous' || !isAuthenticated;
  
  const [isAddFriendsModalOpen, setIsAddFriendsModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [allUsers, setAllUsers] = useState<SearchedUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  // Load friends and friend requests on mount
  useEffect(() => {
    if (!isAnonymous) {
      loadSocialData();
    }
  }, [isAnonymous]);

  // Search users when query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim() && !isAnonymous) {
        handleSearch();
      } else if (isAddFriendsModalOpen && !searchQuery.trim() && allUsers.length > 0) {
        // Show all users when modal is open and search is empty
        setSearchResults(allUsers);
      } else if (!searchQuery.trim() && !isAddFriendsModalOpen) {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isAddFriendsModalOpen, allUsers, isAnonymous]);

  const loadSocialData = async () => {
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        socialService.getFriends(),
        socialService.getFriendRequests(),
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async (offset: number = 0) => {
    setIsLoadingUsers(true);
    if (offset === 0) {
      setSearchResults([]); // Clear previous results only when loading from start
    }
    try {
      // Load 10 non-friend users at a time
      const result = await socialService.searchUsers('', offset, 10, true);
      console.log('Loaded users:', result); // Debug log
      
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
    console.log('Opening Add Friends modal');
    setIsAddFriendsModalOpen(true);
    setSearchQuery(''); // Clear search query
    // Always load fresh user list when modal opens
    loadAllUsers();
  };

  const handleSendFriendRequest = async (userId: number) => {
    try {
      await socialService.sendFriendRequest(userId);
      // Update search results to reflect sent request
      setSearchResults(prev => prev.map(user => 
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
      // Reload data to update friends list
      await loadSocialData();
      // Update notification count
      decrementFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await socialService.rejectFriendRequest(requestId);
      // Remove from friend requests list
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      // Update notification count
      decrementFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request');
    }
  };

  const handleUnfriend = async (friendId: number, friendName: string) => {
    const confirmed = window.confirm(`Are you sure you want to unfriend ${friendName}?`);
    if (!confirmed) return;

    try {
      await socialService.unfriendUser(friendId);
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Error unfriending user:', error);
      alert('Failed to unfriend user');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1: return 'rank-badge rank-badge-first';
      case 2: return 'rank-badge rank-badge-second';
      case 3: return 'rank-badge rank-badge-third';
      default: return 'rank-badge rank-badge-other';
    }
  };

  // Show anonymous prompt if user is not authenticated
  if (isAnonymous) {
    return <AnonymousPrompt feature="Social" message="Create a free account to connect with other creators and make friends!" />;
  }

  if (isLoading) {
    return (
      <div className="social-page-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="social-page-container">
      {/* Friends Section */}
      <div className="social-section-header">
        <div className="social-section-title-row">
          <div className="social-section-left">
            <UsersIcon className="social-section-icon" />
            <h2 className="social-section-title">{t('social.friends')} ({friends.length})</h2>
          </div>
          <button 
            className="add-friends-button"
            onClick={handleOpenAddFriendsModal}
          >
            <UserPlusIcon className="button-icon" />
            {t('social.addFriends')}
          </button>
        </div>
        <p className="social-section-subtitle">{t('social.connectWithCreators')}</p>
      </div>

      <div className="social-list-container">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="social-list-item">
              <div className="social-item-left">
                <div className="online-status-container">
                  <div className="user-avatar">
                    {friend.avatar}
                  </div>
                  <div className={`online-status-indicator ${friend.is_online ? 'online-status-online' : 'online-status-offline'}`}></div>
                </div>
                <div>
                  <div className="user-info-name">{friend.name}</div>
                  <div className="user-info-activity">{friend.story_count} {t('social.storiesPublished')}</div>
                </div>
              </div>
              <div className="social-item-right">
                <button 
                  className="message-button"
                  onClick={() => {
                    setSelectedFriend(friend);
                    setIsChatModalOpen(true);
                  }}
                  title="Send message"
                >
                  <ChatBubbleLeftIcon className="button-icon" />
                </button>
                <button 
                  className="unfriend-button"
                  onClick={() => handleUnfriend(friend.id, friend.name)}
                  title="Unfriend"
                >
                  <UserMinusIcon className="button-icon" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
            {t('social.noFriends')}. Click "{t('social.addFriends')}" to find creators!
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {selectedFriend && (
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setSelectedFriend(null);
          }}
          friendId={selectedFriend.id}
          friendName={selectedFriend.name}
          friendAvatar={selectedFriend.avatar}
        />
      )}

      {/* Friend Requests Section */}
      {friendRequests.length > 0 && (
        <>
          <div className="social-section-header" style={{ marginTop: '3rem' }}>
            <div className="social-section-title-row">
              <div className="social-section-left">
                <UserPlusIcon className="social-section-icon" />
                <h2 className="social-section-title">{t('social.friendRequests')} ({friendRequests.length})</h2>
              </div>
            </div>
            <p className="social-section-subtitle">{t('social.peopleWantToConnect')}</p>
          </div>

          <div className="social-list-container">
            {friendRequests.map((request) => (
              <div key={request.id} className="social-list-item">
                <div className="social-item-left">
                  <div className="user-avatar">
                    {request.sender_avatar}
                  </div>
                  <div>
                    <div className="user-info-name">{request.sender_name}</div>
                    <div className="user-info-activity">
                      {request.mutual_friends > 0 && `$${request.mutual_friends} ${t('social.mutualFriends')} • `}
                      {getTimeAgo(request.created_at)}
                    </div>
                  </div>
                </div>
                <div className="social-item-right">
                  <div className="friend-request-buttons">
                    <button 
                      className="accept-button"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      <CheckIcon className="button-icon" />
                    </button>
                    <button 
                      className="decline-button"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <XMarkIcon className="button-icon" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Friends Modal */}
      {isAddFriendsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddFriendsModalOpen(false)}>
          <div className="glassmorphism-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('social.findFriends')}</h2>
              <button 
                className="modal-close-button"
                onClick={() => setIsAddFriendsModalOpen(false)}
              >
                <XMarkIcon className="modal-close-icon" />
              </button>
            </div>
            
            <div className="modal-search-container">
              <div className="modal-search-input-wrapper">
                <MagnifyingGlassIcon className="modal-search-icon" />
                <input
                  type="text"
                  placeholder={t('social.searchPlaceholder')}
                  className="modal-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Refresh button */}
            {!searchQuery && hasMore && (
              <div style={{ 
                padding: '0.75rem 1.5rem', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <button
                  onClick={loadNextUsers}
                  disabled={isLoadingUsers}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: isLoadingUsers ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    opacity: isLoadingUsers ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowPathIcon style={{ width: '1rem', height: '1rem' }} />
                  Load Next 10
                </button>
              </div>
            )}

            <div className="modal-results-container">
              {isLoadingUsers ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  <p>{t('social.loadingUsers')}</p>
                </div>
              ) : isSearching ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                  <p>{t('social.searching')}</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div key={user.id} className="modal-user-item">
                    <div className="modal-user-left">
                      <div className="user-avatar">
                        {user.avatar}
                      </div>
                      <div className="modal-user-info">
                        <div className="modal-user-name">{user.name}</div>
                        <div className="modal-user-bio">{user.bio || `@${user.username}`}</div>
                        <div className="modal-user-bio" style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {user.story_count} {user.story_count === 1 ? t('social.storyPublished') : t('social.storiesPublished')}
                        </div>
                      </div>
                    </div>
                    <div className="modal-user-right">
                      {user.is_friend ? (
                        <button className="modal-add-friend-button" disabled style={{ opacity: 0.5 }}>
                          <CheckIcon className="button-icon" />
                          {t('social.friends')}
                        </button>
                      ) : user.request_sent ? (
                        <button className="modal-add-friend-button" disabled style={{ opacity: 0.5 }}>
                          {t('social.requestSent')}
                        </button>
                      ) : user.request_received ? (
                        <button className="modal-add-friend-button" disabled style={{ opacity: 0.5 }}>
                          {t('social.pending')}
                        </button>
                      ) : (
                        <button 
                          className="modal-add-friend-button"
                          onClick={() => handleSendFriendRequest(user.id)}
                        >
                          <UserPlusIcon className="button-icon" />
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="modal-no-results">
                  <div className="modal-no-results-icon">🔍</div>
                  <div className="modal-no-results-text">
                    {searchQuery 
                      ? `${t('social.noUsersFound')} "${searchQuery}"` 
                      : t('social.noNewUsers')}
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

export default SocialPage;
