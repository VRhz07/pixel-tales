import { useState, useCallback } from 'react';
import { Toast } from '../components/ui/ToastNotification';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    console.log('🍞 Removing toast:', id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { ...toast, id };
    
    console.log('🍞 Creating toast:', newToast);
    setToasts((prev) => {
      console.log('🍞 Current toasts:', prev.length, 'Adding new toast');
      return [...prev, newToast];
    });

    // Auto-remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      console.log('🍞 Auto-removing toast:', id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Helper methods for specific toast types
  const showOnlineToast = useCallback((username: string, avatar?: string) => {
    return showToast({
      type: 'online',
      title: `${username} is online`,
      message: `${username} just came online`,
      avatar,
      duration: 4000
    });
  }, [showToast]);

  const showOfflineToast = useCallback((username: string, avatar?: string) => {
    return showToast({
      type: 'offline',
      title: `${username} is offline`,
      message: `${username} went offline`,
      avatar,
      duration: 4000
    });
  }, [showToast]);

  const showInviteToast = useCallback((
    inviterName: string, 
    storyTitle: string, 
    onAccept?: () => void,
    avatar?: string
  ) => {
    return showToast({
      type: 'invite',
      title: 'Collaboration Invite',
      message: `${inviterName} invited you to collaborate on "${storyTitle}"`,
      avatar,
      actionLabel: 'View Invite',
      onAction: onAccept,
      duration: 8000 // Longer duration for invites
    });
  }, [showToast]);

  const showSuccessToast = useCallback((title: string, message: string) => {
    return showToast({
      type: 'success',
      title,
      message,
      duration: 3000
    });
  }, [showToast]);

  const showErrorToast = useCallback((title: string, message: string) => {
    return showToast({
      type: 'error',
      title,
      message,
      duration: 5000
    });
  }, [showToast]);

  const showInfoToast = useCallback((title: string, message: string) => {
    return showToast({
      type: 'info',
      title,
      message,
      duration: 4000
    });
  }, [showToast]);

  const showXPGain = useCallback((xpGained: number, action?: string) => {
    // XP popup will be implemented in the future
    console.log('XP Gain:', xpGained, action);
  }, []);

  const showLevelUp = useCallback((
    newLevel: number,
    unlockedItems?: Array<{
      type: 'avatar' | 'border';
      name: string;
      emoji?: string;
      gradient?: string;
    }>,
    totalXP?: number
  ) => {
    // Level up modal will be implemented in the future
    console.log('Level Up:', newLevel, unlockedItems, totalXP);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts,
    showOnlineToast,
    showOfflineToast,
    showInviteToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showXPGain,
    showLevelUp
  };
};
