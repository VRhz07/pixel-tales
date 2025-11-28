import { create } from 'zustand';
import { notificationService, NotificationCounts } from '../services/notification.service';

interface NotificationState {
  counts: NotificationCounts;
  isLoading: boolean;
  lastUpdated: Date | null;
  
  // Actions
  fetchNotificationCounts: () => Promise<void>;
  incrementFriendRequests: () => void;
  decrementFriendRequests: () => void;
  incrementCollaborationInvites: () => void;
  decrementCollaborationInvites: () => void;
  setUnreadMessages: (count: number) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  counts: {
    friend_requests: 0,
    unread_messages: 0,
    collaboration_invites: 0,
    total: 0,
  },
  isLoading: false,
  lastUpdated: null,

  fetchNotificationCounts: async () => {
    set({ isLoading: true });
    try {
      const counts = await notificationService.getNotificationCounts();
      set({ 
        counts, 
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      set({ isLoading: false });
    }
  },

  incrementFriendRequests: () => {
    const currentCounts = get().counts;
    set({
      counts: {
        ...currentCounts,
        friend_requests: currentCounts.friend_requests + 1,
        total: currentCounts.total + 1,
      },
    });
  },

  decrementFriendRequests: () => {
    const currentCounts = get().counts;
    set({
      counts: {
        ...currentCounts,
        friend_requests: Math.max(0, currentCounts.friend_requests - 1),
        total: Math.max(0, currentCounts.total - 1),
      },
    });
  },

  incrementCollaborationInvites: () => {
    const currentCounts = get().counts;
    set({
      counts: {
        ...currentCounts,
        collaboration_invites: currentCounts.collaboration_invites + 1,
        total: currentCounts.total + 1,
      },
    });
  },

  decrementCollaborationInvites: () => {
    const currentCounts = get().counts;
    set({
      counts: {
        ...currentCounts,
        collaboration_invites: Math.max(0, currentCounts.collaboration_invites - 1),
        total: Math.max(0, currentCounts.total - 1),
      },
    });
  },

  setUnreadMessages: (count: number) => {
    const currentCounts = get().counts;
    const diff = count - currentCounts.unread_messages;
    set({
      counts: {
        ...currentCounts,
        unread_messages: count,
        total: currentCounts.total + diff,
      },
    });
  },

  clearNotifications: () => {
    set({
      counts: {
        friend_requests: 0,
        unread_messages: 0,
        collaboration_invites: 0,
        total: 0,
      },
    });
  },
}));
