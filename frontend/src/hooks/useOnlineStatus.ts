/**
 * Hook to manage and access real-time online user status
 */
import { useState, useEffect } from 'react';
import { notificationWebSocket } from '../services/notificationWebSocket';

let onlineUsersSet = new Set<number>();
let listeners: Array<(users: Set<number>) => void> = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(new Set(onlineUsersSet)));
};

export const useOnlineStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set(onlineUsersSet));

  useEffect(() => {
    // Add this component as a listener
    const listener = (users: Set<number>) => {
      setOnlineUsers(users);
    };
    listeners.push(listener);

    // Clean up on unmount
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return onlineUsers;
};

// Function to update online status (called from App.tsx)
export const updateOnlineStatus = (userId: number, isOnline: boolean) => {
  if (isOnline) {
    onlineUsersSet.add(userId);
  } else {
    onlineUsersSet.delete(userId);
  }
  notifyListeners();
};

// Function to set initial online users
export const setOnlineUsers = (users: Set<number>) => {
  onlineUsersSet = users;
  notifyListeners();
};
