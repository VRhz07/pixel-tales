import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCapacitorStorage } from '@/utils/capacitorStorage';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

interface CacheState {
  // User profile cache (includes avatar border)
  userProfile: CacheEntry<any> | null;
  
  // Friends list cache
  friendsList: CacheEntry<any[]> | null;
  
  // Friend requests cache
  friendRequests: CacheEntry<any[]> | null;
  
  // Published stories cache
  publishedStories: CacheEntry<any[]> | null;
  
  // Achievements cache
  achievements: CacheEntry<any> | null;
  
  // User stats cache
  userStats: CacheEntry<any> | null;
  
  // Activity feed cache
  activityFeed: CacheEntry<any[]> | null;
  
  // Leaderboard cache
  leaderboard: CacheEntry<any[]> | null;
  
  // Actions
  setCache: <T>(key: keyof Omit<CacheState, 'setCache' | 'getCache' | 'clearCache' | 'isCacheValid' | 'clearAllCache'>, data: T, expiresIn?: number) => void;
  getCache: <T>(key: keyof Omit<CacheState, 'setCache' | 'getCache' | 'clearCache' | 'isCacheValid' | 'clearAllCache'>) => T | null;
  isCacheValid: (key: keyof Omit<CacheState, 'setCache' | 'getCache' | 'clearCache' | 'isCacheValid' | 'clearAllCache'>) => boolean;
  clearCache: (key: keyof Omit<CacheState, 'setCache' | 'getCache' | 'clearCache' | 'isCacheValid' | 'clearAllCache'>) => void;
  clearAllCache: () => void;
}

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes default

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      friendsList: null,
      friendRequests: null,
      publishedStories: null,
      achievements: null,
      userStats: null,
      activityFeed: null,
      leaderboard: null,

      setCache: (key, data, expiresIn = DEFAULT_CACHE_TIME) => {
        const cacheEntry: CacheEntry<any> = {
          data,
          timestamp: Date.now(),
          expiresIn,
        };
        
        set({ [key]: cacheEntry });
        console.log(`📦 Cache set for ${key}, expires in ${expiresIn / 1000}s`);
      },

      getCache: (key) => {
        const state = get();
        const cacheEntry = state[key] as CacheEntry<any> | null;
        
        if (!cacheEntry) {
          console.log(`📦 Cache miss for ${key}: no data`);
          return null;
        }

        const now = Date.now();
        const age = now - cacheEntry.timestamp;
        
        if (age > cacheEntry.expiresIn) {
          console.log(`📦 Cache expired for ${key}: ${age / 1000}s old`);
          return null;
        }

        console.log(`📦 Cache hit for ${key}: ${age / 1000}s old`);
        return cacheEntry.data;
      },

      isCacheValid: (key) => {
        const state = get();
        const cacheEntry = state[key] as CacheEntry<any> | null;
        
        if (!cacheEntry) return false;

        const now = Date.now();
        const age = now - cacheEntry.timestamp;
        
        return age <= cacheEntry.expiresIn;
      },

      clearCache: (key) => {
        set({ [key]: null });
        console.log(`📦 Cache cleared for ${key}`);
      },

      clearAllCache: () => {
        set({
          userProfile: null,
          friendsList: null,
          friendRequests: null,
          publishedStories: null,
          achievements: null,
          userStats: null,
          activityFeed: null,
          leaderboard: null,
        });
        console.log('📦 All cache cleared');
      },
    }),
    {
      name: 'app-cache',
      storage: createCapacitorStorage(),
    }
  )
);
