/**
 * Offline Storage Service using IndexedDB
 * Stores stories with images for offline reading without localStorage quota limits
 */

const DB_NAME = 'PixelTalesOffline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-stories';

interface OfflineStory {
  id: string;
  story: any; // Full story object with images
  savedAt: Date;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('savedAt', 'savedAt', { unique: false });
          console.log('📦 Created offline stories object store');
        }
      };
    });
  }

  /**
   * Ensure DB is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  /**
   * Save a story for offline reading
   */
  async saveStory(storyId: string, story: any): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const offlineStory: OfflineStory = {
        id: storyId,
        story: story,
        savedAt: new Date()
      };
      
      const request = store.put(offlineStory);
      
      request.onsuccess = () => {
        console.log('✅ Story saved to IndexedDB:', story.title);
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to save story to IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a story from offline storage
   */
  async getStory(storyId: string): Promise<any | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(storyId);
      
      request.onsuccess = () => {
        const result = request.result as OfflineStory | undefined;
        resolve(result ? result.story : null);
      };
      
      request.onerror = () => {
        console.error('❌ Failed to get story from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove a story from offline storage
   */
  async removeStory(storyId: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(storyId);
      
      request.onsuccess = () => {
        console.log('✅ Story removed from IndexedDB');
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to remove story from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all offline stories
   */
  async getAllStories(): Promise<any[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result as OfflineStory[];
        resolve(results.map(r => r.story));
      };
      
      request.onerror = () => {
        console.error('❌ Failed to get all stories from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if a story is saved offline
   */
  async isStorySaved(storyId: string): Promise<boolean> {
    try {
      const story = await this.getStory(storyId);
      return story !== null;
    } catch (error) {
      console.error('❌ Failed to check if story is saved:', error);
      return false;
    }
  }

  /**
   * Get storage usage estimate
   */
  async getStorageUsage(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (error) {
        console.error('❌ Failed to get storage estimate:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Clear all offline stories
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('✅ All offline stories cleared');
        resolve();
      };
      
      request.onerror = () => {
        console.error('❌ Failed to clear offline stories:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();

// Initialize on module load
offlineStorageService.init().catch(err => {
  console.error('❌ Failed to initialize offline storage:', err);
});
