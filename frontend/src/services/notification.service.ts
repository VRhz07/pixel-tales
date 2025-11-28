import api from './api';

export interface NotificationCounts {
  friend_requests: number;
  unread_messages: number;
  collaboration_invites: number;
  total: number;
}

class NotificationService {
  /**
   * Get notification counts for all categories
   */
  async getNotificationCounts(): Promise<NotificationCounts> {
    try {
      // Get friend requests count
      const friendRequestsData: any = await api.get('/friends/requests/');
      const friendRequestsCount = friendRequestsData?.requests?.length || 0;

      // Get unread messages count
      const conversationsData: any = await api.get('/messages/conversations/');
      const conversations = conversationsData?.conversations || [];
      const unreadMessagesCount = conversations.reduce((total: number, conv: any) => {
        return total + (conv.unread_count || 0);
      }, 0);

      // Get collaboration invites count
      const collabInvitesData: any = await api.get('/collaborate/invites/');
      const collabInvitesCount = collabInvitesData?.invitations?.length || 0;

      return {
        friend_requests: friendRequestsCount,
        unread_messages: unreadMessagesCount,
        collaboration_invites: collabInvitesCount,
        total: friendRequestsCount + unreadMessagesCount + collabInvitesCount,
      };
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      return {
        friend_requests: 0,
        unread_messages: 0,
        collaboration_invites: 0,
        total: 0,
      };
    }
  }

  /**
   * Get friend requests count only
   */
  async getFriendRequestsCount(): Promise<number> {
    try {
      const data: any = await api.get('/friends/requests/');
      return data?.requests?.length || 0;
    } catch (error) {
      console.error('Error fetching friend requests count:', error);
      return 0;
    }
  }

  /**
   * Get unread messages count only
   */
  async getUnreadMessagesCount(): Promise<number> {
    try {
      const data: any = await api.get('/messages/conversations/');
      const conversations = data?.conversations || [];
      return conversations.reduce((total: number, conv: any) => {
        return total + (conv.unread_count || 0);
      }, 0);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
