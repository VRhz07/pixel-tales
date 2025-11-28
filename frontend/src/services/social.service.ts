import api from './api';

export interface SearchedUser {
  id: number;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  is_friend: boolean;
  request_sent: boolean;
  request_received: boolean;
  story_count: number;
}

export interface Friend {
  id: number;
  name: string;
  avatar: string;
  username: string;
  is_online: boolean;
  latest_story?: string;
  story_count: number;
  last_message_time?: string;
  unread_messages?: number;
}

export interface FriendRequest {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  sender_username: string;
  mutual_friends: number;
  created_at: string;
}

export interface CollaborationInvite {
  id: number;
  session_id: string;
  story_title: string;
  inviter_id: number;
  inviter_name: string;
  inviter_avatar: string;
  created_at: string;
  is_read: boolean;
  is_session_active?: boolean;
  isSessionActive?: boolean;
}

export interface ActivityItem {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  activity_type: 'published' | 'liked' | 'commented' | 'followed' | 'achievement' | 'commented_on_your_story' | 'liked_your_story' | 'saved_your_story';
  story_title?: string;
  story_id?: number;
  achievement_name?: string;
  timestamp: string;
  is_your_story?: boolean; // Indicates if this activity is on YOUR story
  is_read?: boolean; // Indicates if the user has seen this activity
}

export interface FriendProfile {
  id: number;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  story_count: number;
  follower_count: number;
  following_count: number;
  total_reads: number;
  total_likes: number;
  joined_date: string;
  is_online: boolean;
  badges: string[];
  achievement_count: number;
  recent_stories: Array<{
    id: number;
    title: string;
    cover: string;
    likes: number;
  }>;
}

export interface LeaderboardUser {
  id: number;
  name: string;
  avatar: string;
  rank: number;
  story_count: number;
  total_reads: number;
  total_likes: number;
  badges: string[];
  achievement_count: number;
}

class SocialService {
  /**
   * Search for users by name or username
   * If query is empty, returns all available users
   */
  async searchUsers(query: string, offset: number = 0, limit: number = 10, excludeFriends: boolean = true): Promise<{ users: SearchedUser[], total: number, hasMore: boolean }> {
    try {
      // Build query parameters
      const searchParam = query.trim() === '' ? '' : encodeURIComponent(query);
      const endpoint = `/users/search/?q=${searchParam}&offset=${offset}&limit=${limit}&exclude_friends=${excludeFriends}`;
      
      console.log('Searching users with endpoint:', endpoint); // Debug log
      
      // api.get already returns response.data, so we get the data directly
      const data: any = await api.get(endpoint);
      console.log('Search response:', data); // Debug log
      
      // Handle different response structures
      if (data?.users) {
        console.log('Found users in data.users:', data.users.length);
        return {
          users: data.users,
          total: data.total || data.users.length,
          hasMore: data.has_more || false
        };
      } else if (Array.isArray(data)) {
        console.log('Found users in array:', data.length);
        return {
          users: data,
          total: data.length,
          hasMore: false
        };
      }
      
      console.log('No users found in response');
      return { users: [], total: 0, hasMore: false };
    } catch (error) {
      console.error('Error searching users:', error);
      return { users: [], total: 0, hasMore: false }; // Return empty result instead of throwing
    }
  }

  /**
   * Get list of friends
   */
  async getFriends(): Promise<Friend[]> {
    try {
      const data: any = await api.get('/friends/');
      console.log('Friends response:', data); // Debug log
      const friendships = data?.friends || data || [];
      
      if (!Array.isArray(friendships)) {
        console.warn('Friends response is not an array:', friendships);
        return [];
      }
      
      // Transform friendship data to friend list
      const currentUserId = this.getCurrentUserId();
      console.log('Current user ID:', currentUserId, 'Type:', typeof currentUserId);
      console.log('Friendships data:', friendships);
      
      return friendships.map((friendship: any) => {
        console.log('Processing friendship:', friendship);
        console.log('Sender ID:', friendship.sender?.id, 'Type:', typeof friendship.sender?.id);
        console.log('Receiver ID:', friendship.receiver?.id, 'Type:', typeof friendship.receiver?.id);
        
        // Determine which user is the friend (not the current user)
        // Convert both to numbers for comparison
        const senderId = Number(friendship.sender?.id);
        const receiverId = Number(friendship.receiver?.id);
        const currentUserIdNum = Number(currentUserId);
        
        console.log('Comparison:', senderId, '===', currentUserIdNum, '?', senderId === currentUserIdNum);
        
        const friend = senderId === currentUserIdNum 
          ? friendship.receiver 
          : friendship.sender;
        
        console.log('Selected friend:', friend);
        
        return {
          id: friend?.id || 0,
          name: friend?.profile?.display_name || friend?.username || 'Unknown',
          avatar: friend?.profile?.avatar_emoji || '👤', // Use avatar_emoji from profile
          username: friend?.username || '',
          is_online: friend?.profile?.is_online || false,
          story_count: friend?.story_count || 0,
          last_message_time: friendship.last_message_time || undefined,
          unread_messages: friendship.unread_messages > 0 ? friendship.unread_messages : undefined,
        };
      });
    } catch (error) {
      console.error('Error fetching friends:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get pending friend requests
   */
  async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      const data: any = await api.get('/friends/requests/');
      console.log('Friend requests response:', data); // Debug log
      const requests = data?.requests || data || [];
      
      if (!Array.isArray(requests)) {
        console.warn('Friend requests response is not an array:', requests);
        return [];
      }
      
      return requests.map((request: any) => ({
        id: request.id || 0,
        sender_id: request.sender?.id || 0,
        sender_name: request.sender?.profile?.display_name || request.sender?.username || 'Unknown',
        sender_avatar: request.sender?.profile?.avatar_emoji || '👤',
        sender_username: request.sender?.username || '',
        mutual_friends: 0, // TODO: Calculate mutual friends
        created_at: request.date_created || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Send a friend request to a user
   */
  async sendFriendRequest(userId: number): Promise<void> {
    try {
      await api.post('/friends/send-request/', {
        receiver_id: userId,
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: number): Promise<void> {
    try {
      await api.put(`/friends/respond/${requestId}/`, {
        action: 'accept',
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(requestId: number): Promise<void> {
    try {
      await api.put(`/friends/respond/${requestId}/`, {
        action: 'reject',
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }

  /**
   * Unfriend a user
   */
  async unfriendUser(userId: number): Promise<void> {
    try {
      await api.delete(`/friends/unfriend/${userId}/`);
    } catch (error) {
      console.error('Error unfriending user:', error);
      throw error;
    }
  }

  /**
   * Get top storytellers (users with most published stories)
   */
  async getTopStorytellers(): Promise<LeaderboardUser[]> {
    try {
      const data: any = await api.get('/social/leaderboard/?limit=10');
      return data?.leaderboard || [];
    } catch (error) {
      console.error('Error fetching top storytellers:', error);
      return [];
    }
  }

  /**
   * Get activity feed from friends
   */
  async getActivityFeed(limit: number = 20): Promise<ActivityItem[]> {
    try {
      const data: any = await api.get(`/social/activity-feed/?limit=${limit}`);
      return data?.activities || [];
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  }

  /**
   * Get friend suggestions based on mutual friends and interests
   */
  async getFriendSuggestions(limit: number = 10): Promise<SearchedUser[]> {
    try {
      // TODO: Implement backend endpoint for smart suggestions
      // For now, use search with exclude friends
      const result = await this.searchUsers('', 0, limit, true);
      return result.users;
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      return [];
    }
  }

  /**
   * Get leaderboard of top creators
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardUser[]> {
    try {
      const data: any = await api.get(`/social/leaderboard/?limit=${limit}`);
      return data?.leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Get detailed friend profile
   */
  async getFriendProfile(userId: number): Promise<FriendProfile | null> {
    try {
      const data: any = await api.get(`/social/profile/${userId}/`);
      return data?.profile || null;
    } catch (error) {
      console.error('Error fetching friend profile:', error);
      return null;
    }
  }


  /**
   * Get collaboration invites
   * @returns List of collaboration invites
   */
  async getCollaborationInvites(): Promise<CollaborationInvite[]> {
    try {
      const data: any = await api.get('/collaborate/invites/');
      return data?.invitations || [];
    } catch (error) {
      console.error('Error fetching collaboration invites:', error);
      return [];
    }
  }

  /**
   * Respond to collaboration invite
   * @param inviteId - Notification ID
   * @param action - 'accept' or 'decline'
   */
  async respondToCollaborationInvite(inviteId: number, action: 'accept' | 'decline'): Promise<any> {
    try {
      const data: any = await api.post(`/collaborate/invites/${inviteId}/respond/`, { action });
      return data;
    } catch (error) {
      console.error('Error responding to collaboration invite:', error);
      throw error;
    }
  }

  /**
   * Helper to get current user ID from localStorage
   */
  private getCurrentUserId(): number {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.id || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }
}

export const socialService = new SocialService();
