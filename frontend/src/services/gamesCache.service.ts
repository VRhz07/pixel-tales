/**
 * Games Cache Service
 * Handles caching games data for offline play and fast loading
 */

const CACHE_KEY_PREFIX = 'games_cache_';
const CACHE_STORY_GAMES = 'story_games_';
const CACHE_GAME_DATA = 'game_data_';
const PENDING_PROGRESS = 'pending_game_progress';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface PendingProgress {
  gameId: number;
  attemptId: number;
  answers: any[];
  timestamp: number;
}

class GamesCacheService {
  /**
   * Cache games list for a story
   */
  cacheStoryGames(storyId: string | number, games: any[]): void {
    try {
      const cacheData: CachedData<any[]> = {
        data: games,
        timestamp: Date.now()
      };
      localStorage.setItem(
        `${CACHE_KEY_PREFIX}${CACHE_STORY_GAMES}${storyId}`,
        JSON.stringify(cacheData)
      );
      console.log('✅ Cached games for story:', storyId);
    } catch (error) {
      console.error('Error caching story games:', error);
    }
  }

  /**
   * Get cached games for a story
   */
  getCachedStoryGames(storyId: string | number): any[] | null {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${CACHE_STORY_GAMES}${storyId}`);
      if (!cached) return null;

      const cacheData: CachedData<any[]> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
        console.log('⏰ Cache expired for story:', storyId);
        this.clearStoryGamesCache(storyId);
        return null;
      }

      console.log('✅ Retrieved cached games for story:', storyId);
      return cacheData.data;
    } catch (error) {
      console.error('Error retrieving cached story games:', error);
      return null;
    }
  }

  /**
   * Cache individual game data
   */
  cacheGameData(gameId: string | number, gameData: any): void {
    try {
      console.log('💾 Attempting to cache game:', gameId);
      console.log('💾 Game data to cache:', gameData);
      console.log('💾 Questions to cache:', gameData?.questions);
      
      const cacheData: CachedData<any> = {
        data: gameData,
        timestamp: Date.now()
      };
      
      const jsonString = JSON.stringify(cacheData);
      console.log('💾 JSON string length:', jsonString.length);
      console.log('💾 JSON preview:', jsonString.substring(0, 200));
      
      localStorage.setItem(
        `${CACHE_KEY_PREFIX}${CACHE_GAME_DATA}${gameId}`,
        jsonString
      );
      
      // Verify it was stored correctly
      const verification = localStorage.getItem(`${CACHE_KEY_PREFIX}${CACHE_GAME_DATA}${gameId}`);
      const parsed = JSON.parse(verification!);
      console.log('✅ Cached game data:', gameId);
      console.log('✅ Verification - data keys:', Object.keys(parsed.data));
      console.log('✅ Verification - questions count:', parsed.data?.questions?.length);
    } catch (error) {
      console.error('❌ Error caching game data:', error);
    }
  }

  /**
   * Get cached game data
   */
  getCachedGameData(gameId: string | number): any | null {
    try {
      const key = `${CACHE_KEY_PREFIX}${CACHE_GAME_DATA}${gameId}`;
      console.log('🔍 Looking for cached game with key:', key);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        console.log('❌ No cached data found for key:', key);
        return null;
      }

      const cacheData: CachedData<any> = JSON.parse(cached);
      console.log('📦 Raw cached data:', cacheData);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
        console.log('⏰ Game cache expired:', gameId);
        this.clearGameDataCache(gameId);
        return null;
      }

      console.log('✅ Retrieved cached game data for game:', gameId);
      console.log('📋 Data structure:', {
        hasData: !!cacheData.data,
        dataKeys: cacheData.data ? Object.keys(cacheData.data) : [],
        questions: cacheData.data?.questions ? cacheData.data.questions.length : 0
      });
      return cacheData.data;
    } catch (error) {
      console.error('Error retrieving cached game data:', error);
      return null;
    }
  }

  /**
   * Store game progress offline (when no connection)
   */
  storePendingProgress(gameId: number, attemptId: number, answers: any[]): void {
    try {
      const pending = this.getPendingProgress();
      const newProgress: PendingProgress = {
        gameId,
        attemptId,
        answers,
        timestamp: Date.now()
      };
      
      // Replace existing progress for this attempt or add new
      const filtered = pending.filter(p => p.attemptId !== attemptId);
      filtered.push(newProgress);
      
      localStorage.setItem(PENDING_PROGRESS, JSON.stringify(filtered));
      console.log('💾 Stored pending progress offline:', attemptId);
    } catch (error) {
      console.error('Error storing pending progress:', error);
    }
  }

  /**
   * Get all pending progress items
   */
  getPendingProgress(): PendingProgress[] {
    try {
      const pending = localStorage.getItem(PENDING_PROGRESS);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending progress:', error);
      return [];
    }
  }

  /**
   * Remove synced progress
   */
  removePendingProgress(attemptId: number): void {
    try {
      const pending = this.getPendingProgress();
      const filtered = pending.filter(p => p.attemptId !== attemptId);
      localStorage.setItem(PENDING_PROGRESS, JSON.stringify(filtered));
      console.log('✅ Removed synced progress:', attemptId);
    } catch (error) {
      console.error('Error removing pending progress:', error);
    }
  }

  /**
   * Clear story games cache
   */
  clearStoryGamesCache(storyId: string | number): void {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${CACHE_STORY_GAMES}${storyId}`);
      console.log('🗑️ Cleared story games cache:', storyId);
    } catch (error) {
      console.error('Error clearing story games cache:', error);
    }
  }

  /**
   * Clear game data cache
   */
  clearGameDataCache(gameId: string | number): void {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${CACHE_GAME_DATA}${gameId}`);
      console.log('🗑️ Cleared game data cache:', gameId);
    } catch (error) {
      console.error('Error clearing game data cache:', error);
    }
  }

  /**
   * Clear all games cache
   */
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(PENDING_PROGRESS);
      console.log('🗑️ Cleared all games cache');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const gamesCacheService = new GamesCacheService();
export default gamesCacheService;
