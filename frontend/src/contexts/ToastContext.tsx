import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/ui/ToastNotification';

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showOnlineToast: (username: string, avatar?: string) => string;
  showOfflineToast: (username: string, avatar?: string) => string;
  showInviteToast: (inviterName: string, storyTitle: string, onAccept?: () => void, avatar?: string) => string;
  showSuccessToast: (title: string, message: string) => string;
  showErrorToast: (title: string, message: string) => string;
  showInfoToast: (title: string, message: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const toastMethods = useToast();
  
  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
