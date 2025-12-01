/**
 * Cross-platform storage utility
 * Works on both web (localStorage) and mobile (Capacitor Preferences)
 */
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

class StorageService {
  private isNativePlatform: boolean;

  constructor() {
    // Check if running on native mobile platform
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  /**
   * Set a value in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    if (this.isNativePlatform) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  /**
   * Get a value from storage
   */
  async getItem(key: string): Promise<string | null> {
    if (this.isNativePlatform) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  }

  /**
   * Remove a value from storage
   */
  async removeItem(key: string): Promise<void> {
    if (this.isNativePlatform) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    if (this.isNativePlatform) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }

  /**
   * Get all keys from storage
   */
  async keys(): Promise<string[]> {
    if (this.isNativePlatform) {
      const { keys } = await Preferences.keys();
      return keys;
    } else {
      return Object.keys(localStorage);
    }
  }

  /**
   * Synchronous version - just uses localStorage directly
   * Capacitor automatically persists localStorage on mobile
   */
  setItemSync(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItemSync(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItemSync(key: string): void {
    localStorage.removeItem(key);
  }
}

export const storage = new StorageService();
export default storage;
