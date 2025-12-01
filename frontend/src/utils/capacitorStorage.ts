/**
 * Custom Zustand persist middleware for Capacitor
 * This ensures state persists correctly on mobile devices
 */
import { StateStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * Create a Capacitor-compatible storage for Zustand persist middleware
 */
export const createCapacitorStorage = (): StateStorage => {
  const isNative = Capacitor.isNativePlatform();

  return {
    getItem: async (name: string): Promise<string | null> => {
      if (isNative) {
        const { value } = await Preferences.get({ key: name });
        return value;
      } else {
        return localStorage.getItem(name);
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      if (isNative) {
        await Preferences.set({ key: name, value });
      } else {
        localStorage.setItem(name, value);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      if (isNative) {
        await Preferences.remove({ key: name });
      } else {
        localStorage.removeItem(name);
      }
    },
  };
};
