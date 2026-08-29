/**
 * Hybrid Storage System for Zustand
 * Stores large data (images) in IndexedDB and metadata in localStorage
 * Prevents QuotaExceededError by keeping localStorage under quota
 */

const DB_NAME = 'PixelTalesImages';
const DB_VERSION = 2; // Increased version to trigger onupgradeneeded
const IMAGE_STORE = 'story-images';

interface ImageData {
  storyId: string;
  pageId: string;
  imageType: 'page' | 'cover' | 'page_state' | 'page_operations' | 'cover_state' | 'cover_operations';
  data: any; // base64 image data or JSON object
  savedAt: Date;
}

class HybridStorageAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB for image storage
   */
  private async initDB(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB for images:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized for image storage');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          const objectStore = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
          objectStore.createIndex('storyId', 'storyId', { unique: false });
          objectStore.createIndex('pageId', 'pageId', { unique: false });
          console.log('✅ Created image object store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save an image to IndexedDB
   */
  async saveImage(storyId: string, pageId: string, imageType: 'page' | 'cover' | 'page_state' | 'page_operations' | 'cover_state' | 'cover_operations', data: any): Promise<void> {
    await this.initDB();
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([IMAGE_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGE_STORE);
      
      const imageData: ImageData & { id: string } = {
        id: `${storyId}-${pageId}-${imageType}`,
        storyId,
        pageId,
        imageType,
        data,
        savedAt: new Date()
      };

      const request = store.put(imageData);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('❌ Failed to save image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get an image from IndexedDB
   */
  async getImage(storyId: string, pageId: string, imageType: 'page' | 'cover' | 'page_state' | 'page_operations' | 'cover_state' | 'cover_operations'): Promise<any | null> {
    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([IMAGE_STORE], 'readonly');
      const store = transaction.objectStore(IMAGE_STORE);
      const request = store.get(`${storyId}-${pageId}-${imageType}`);

      request.onsuccess = () => {
        const result = request.result as (ImageData & { id: string }) | undefined;
        resolve(result?.data || null);
      };

      request.onerror = () => {
        console.error('❌ Failed to get image:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Delete all images for a story
   */
  async deleteStoryImages(storyId: string): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([IMAGE_STORE], 'readwrite');
      const store = transaction.objectStore(IMAGE_STORE);
      const index = store.index('storyId');
      const request = index.openCursor(IDBKeyRange.only(storyId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.error('❌ Failed to delete story images:', request.error);
        resolve();
      };
    });
  }

  /**
   * Extract images from state before localStorage save
   * Returns state without images and saves images to IndexedDB
   */
  /**
   * Extract images from a single story object and save to IndexedDB
   */
  private async extractSingleStory(story: any): Promise<any> {
    if (!story) return story;
    const newStory = { ...story };

    // Extract cover image
    if (story.coverImage && typeof story.coverImage === 'string' && story.coverImage.startsWith('data:')) {
      await this.saveImage(story.id, 'cover', 'cover', story.coverImage);
      newStory.coverImage = '__INDEXED_DB__'; // Placeholder
    }

    // Extract cover image objects
    if (story.coverImageDrawingState) {
      await this.saveImage(story.id, 'cover', 'cover_state', story.coverImageDrawingState);
      newStory.coverImageDrawingState = '__INDEXED_DB__';
    }
    if (story.coverImageOperations) {
      await this.saveImage(story.id, 'cover', 'cover_operations', story.coverImageOperations);
      newStory.coverImageOperations = '__INDEXED_DB__';
    }

    // Extract page images
    if (story.pages && Array.isArray(story.pages)) {
      newStory.pages = await Promise.all(
        story.pages.map(async (page: any) => {
          const newPage = { ...page };
          
          if (page.canvasData && typeof page.canvasData === 'string' && page.canvasData.startsWith('data:')) {
            await this.saveImage(story.id, page.id, 'page', page.canvasData);
            newPage.canvasData = '__INDEXED_DB__'; // Placeholder
          }
          
          if (page.canvasDrawingState) {
            await this.saveImage(story.id, page.id, 'page_state', page.canvasDrawingState);
            newPage.canvasDrawingState = '__INDEXED_DB__';
          }
          
          if (page.canvasOperations) {
            await this.saveImage(story.id, page.id, 'page_operations', page.canvasOperations);
            newPage.canvasOperations = '__INDEXED_DB__';
          }
          
          return newPage;
        })
      );
    }

    return newStory;
  }

  /**
   * Restore images to a single story object from IndexedDB
   */
  private async restoreSingleStory(story: any): Promise<any> {
    if (!story) return story;
    const newStory = { ...story };

    // Restore cover image
    if (story.coverImage === '__INDEXED_DB__') {
      const coverData = await this.getImage(story.id, 'cover', 'cover');
      newStory.coverImage = coverData || undefined;
    }

    if (story.coverImageDrawingState === '__INDEXED_DB__') {
      const coverState = await this.getImage(story.id, 'cover', 'cover_state');
      newStory.coverImageDrawingState = coverState || undefined;
    }
    
    if (story.coverImageOperations === '__INDEXED_DB__') {
      const coverOps = await this.getImage(story.id, 'cover', 'cover_operations');
      newStory.coverImageOperations = coverOps || undefined;
    }

    // Restore page images
    if (story.pages && Array.isArray(story.pages)) {
      newStory.pages = await Promise.all(
        story.pages.map(async (page: any) => {
          const newPage = { ...page };
          
          if (page.canvasData === '__INDEXED_DB__') {
            const pageData = await this.getImage(story.id, page.id, 'page');
            newPage.canvasData = pageData || undefined;
          }
          
          if (page.canvasDrawingState === '__INDEXED_DB__') {
            const pageState = await this.getImage(story.id, page.id, 'page_state');
            newPage.canvasDrawingState = pageState || undefined;
          }
          
          if (page.canvasOperations === '__INDEXED_DB__') {
            const pageOps = await this.getImage(story.id, page.id, 'page_operations');
            newPage.canvasOperations = pageOps || undefined;
          }
          
          return newPage;
        })
      );
    }

    return newStory;
  }

  /**
   * Extract images from state before localStorage save
   * Returns state without images and saves images to IndexedDB
   */
  async extractImages(state: any): Promise<any> {
    if (!state) return state;

    const newState = { ...state };

    // 1. Extract from currentStory if exists
    if (state.currentStory) {
      newState.currentStory = await this.extractSingleStory(state.currentStory);
    }

    // 2. Extract from userLibraries if exists
    if (state.userLibraries) {
      newState.userLibraries = { ...state.userLibraries };
      for (const userId in state.userLibraries) {
        const library = state.userLibraries[userId];
        if (!library) continue;

        const newLibrary = { ...library };
        
        if (library.stories && Array.isArray(library.stories)) {
          newLibrary.stories = await Promise.all(
            library.stories.map(async (story: any) => this.extractSingleStory(story))
          );
        }

        if (library.offlineStories && Array.isArray(library.offlineStories)) {
          newLibrary.offlineStories = await Promise.all(
            library.offlineStories.map(async (story: any) => this.extractSingleStory(story))
          );
        }

        // Extract character imageData (base64 character images)
        if (library.characters && Array.isArray(library.characters)) {
          newLibrary.characters = await Promise.all(
            library.characters.map(async (character: any) => {
              if (character.imageData && typeof character.imageData === 'string' && character.imageData.startsWith('data:')) {
                await this.saveImage(character.id, 'character', 'cover', character.imageData);
                return { ...character, imageData: '__INDEXED_DB__' };
              }
              return character;
            })
          );
        }

        // Strip coverImageThumbnail from storyMetadata to avoid base64 bloat
        if (library.storyMetadata && Array.isArray(library.storyMetadata)) {
          newLibrary.storyMetadata = library.storyMetadata.map((meta: any) => {
            if (meta.coverImageThumbnail && typeof meta.coverImageThumbnail === 'string' && meta.coverImageThumbnail.startsWith('data:')) {
              return { ...meta, coverImageThumbnail: undefined };
            }
            return meta;
          });
        }

        newState.userLibraries[userId] = newLibrary;
      }
    }

    return newState;
  }

  /**
   * Restore images from IndexedDB after localStorage load
   */
  async restoreImages(state: any): Promise<any> {
    if (!state) return state;

    const newState = { ...state };

    // 1. Restore currentStory if exists
    if (state.currentStory) {
      newState.currentStory = await this.restoreSingleStory(state.currentStory);
    }

    // 2. Restore userLibraries if exists
    if (state.userLibraries) {
      newState.userLibraries = { ...state.userLibraries };
      for (const userId in state.userLibraries) {
        const library = state.userLibraries[userId];
        if (!library) continue;

        const newLibrary = { ...library };
        
        if (library.stories && Array.isArray(library.stories)) {
          newLibrary.stories = await Promise.all(
            library.stories.map(async (story: any) => this.restoreSingleStory(story))
          );
        }

        if (library.offlineStories && Array.isArray(library.offlineStories)) {
          newLibrary.offlineStories = await Promise.all(
            library.offlineStories.map(async (story: any) => this.restoreSingleStory(story))
          );
        }

        // Restore character imageData from IndexedDB
        if (library.characters && Array.isArray(library.characters)) {
          newLibrary.characters = await Promise.all(
            library.characters.map(async (character: any) => {
              if (character.imageData === '__INDEXED_DB__') {
                const data = await this.getImage(character.id, 'character', 'cover');
                return { ...character, imageData: data || undefined };
              }
              return character;
            })
          );
        }

        newState.userLibraries[userId] = newLibrary;
      }
    }

    return newState;
  }

  /**
   * Force extraction of all images from localStorage to IndexedDB
   * Use this when localStorage quota is exceeded
   */
  async forceExtractAllImages(): Promise<void> {
    try {
      console.log('🔄 Force extracting all images from localStorage to IndexedDB...');
      
      // Initialize IndexedDB first (create database if it doesn't exist)
      console.log('🔧 Initializing IndexedDB...');
      await this.initDB();
      
      // Verify database is ready
      if (!this.db) {
        throw new Error('IndexedDB failed to initialize');
      }
      
      // Verify the object store exists
      if (!this.db.objectStoreNames.contains(IMAGE_STORE)) {
        throw new Error(`Object store "${IMAGE_STORE}" not found in database`);
      }
      
      console.log('✅ IndexedDB ready with object store:', IMAGE_STORE);
      
      // Get current state from localStorage
      const storyStoreStr = localStorage.getItem('story-store');
      if (!storyStoreStr) {
        console.log('✅ No story-store in localStorage');
        return;
      }

      const storyStore = JSON.parse(storyStoreStr);
      if (!storyStore.state) {
        console.log('✅ No state in story-store');
        return;
      }

      const originalSize = JSON.stringify(storyStore).length;
      console.log(`📊 Original state size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

      // Extract images
      const extractedState = await this.extractImages(storyStore.state);
      storyStore.state = extractedState;

      const newSize = JSON.stringify(storyStore).length;
      console.log(`📊 New state size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📊 Reduction: ${(((originalSize - newSize) / originalSize) * 100).toFixed(1)}%`);

      // Remove first to free quota, then save the cleaned-up state
      localStorage.removeItem('story-store');
      localStorage.setItem('story-store', JSON.stringify(storyStore));
      
      console.log('✅ Force extraction complete!');
    } catch (error) {
      console.error('❌ Force extraction failed:', error);
      throw error;
    }
  }

  /**
   * Check localStorage size and warn if too large
   */
  checkStorageSize(): { sizeMB: number; needsExtraction: boolean } {
    const storyStoreStr = localStorage.getItem('story-store');
    if (!storyStoreStr) {
      return { sizeMB: 0, needsExtraction: false };
    }

    const sizeMB = storyStoreStr.length / 1024 / 1024;
    const needsExtraction = sizeMB > 3; // Warn if > 3 MB

    if (needsExtraction) {
      console.warn(`⚠️ localStorage size is ${sizeMB.toFixed(2)} MB (should be < 3 MB)`);
      console.warn('⚠️ Image extraction may be needed');
    }

    return { sizeMB, needsExtraction };
  }
}

export const hybridStorage = new HybridStorageAdapter();

// Export helper functions for manual intervention
export const forceExtractImages = () => hybridStorage.forceExtractAllImages();
export const checkStorageSize = () => hybridStorage.checkStorageSize();

/**
 * Create a hybrid storage adapter for zustand/persist
 */
export const createHybridStorage = () => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        // Get from localStorage
        const str = localStorage.getItem(name);
        if (!str) return null;

        // Parse and restore images from IndexedDB
        const state = JSON.parse(str);
        const restoredState = await hybridStorage.restoreImages(state);
        
        return JSON.stringify(restoredState);
      } catch (error) {
        console.error('❌ Error loading from hybrid storage:', error);
        return null;
      }
    },
    
    setItem: async (name: string, value: string | any): Promise<void> => {
      try {
        // Handle both string and object input (zustand sometimes passes objects)
        const state = typeof value === 'string' ? JSON.parse(value) : value;
        
        // Check size before extraction
        const originalSize = JSON.stringify(state).length;
        
        // Analyze what's taking up space
        let totalStories = 0;
        let totalOfflineStories = 0;
        let totalPages = 0;
        let dataUrlCount = 0;
        let placeholderCount = 0;
        
        if (originalSize > 1000000 && state.userLibraries) {
          console.log('🔍 Storage breakdown analysis:');
          
          for (const userId in state.userLibraries) {
            const lib = state.userLibraries[userId];
            if (lib?.stories) {
              totalStories += lib.stories.length;
              lib.stories.forEach((story: any) => {
                if (story.pages) totalPages += story.pages.length;
                if (story.coverImage?.startsWith('data:')) dataUrlCount++;
                if (story.coverImage === '__INDEXED_DB__') placeholderCount++;
                story.pages?.forEach((page: any) => {
                  if (page.canvasData?.startsWith('data:')) dataUrlCount++;
                  if (page.canvasData === '__INDEXED_DB__') placeholderCount++;
                });
              });
            }
            if (lib?.offlineStories) {
              totalOfflineStories += lib.offlineStories.length;
              lib.offlineStories.forEach((story: any) => {
                if (story.pages) totalPages += story.pages.length;
                if (story.coverImage?.startsWith('data:')) dataUrlCount++;
                if (story.coverImage === '__INDEXED_DB__') placeholderCount++;
                story.pages?.forEach((page: any) => {
                  if (page.canvasData?.startsWith('data:')) dataUrlCount++;
                  if (page.canvasData === '__INDEXED_DB__') placeholderCount++;
                });
              });
            }
          }
          
          console.log(`   📚 Total stories: ${totalStories}`);
          console.log(`   💾 Total offline stories: ${totalOfflineStories}`);
          console.log(`   📄 Total pages: ${totalPages}`);
          console.log(`   🖼️ Data URLs found: ${dataUrlCount}`);
          console.log(`   ✅ Already extracted: ${placeholderCount}`);
        }
        
        // Extract images to IndexedDB
        const stateWithoutImages = await hybridStorage.extractImages(state);
        
        const extractedSize = JSON.stringify(stateWithoutImages).length;
        const reductionPercent = ((originalSize - extractedSize) / originalSize) * 100;
        
        // Log extraction results
        if (originalSize > 1000000) { // Only log for states > 1 MB
          console.log(`📊 State extraction: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(extractedSize / 1024 / 1024).toFixed(2)} MB (${reductionPercent.toFixed(1)}% reduction)`);
        }
        
        // Warn if still too large after extraction
        if (extractedSize > 3000000) { // 3 MB
          console.warn(`⚠️ State still large after extraction: ${(extractedSize / 1024 / 1024).toFixed(2)} MB`);
          console.warn('⚠️ Consider reducing number of stories in memory');
          console.warn(`💡 Tip: You have ${totalStories + totalOfflineStories} stories in memory. Consider keeping fewer stories loaded.`);
        }
        
        // Save metadata to localStorage
        localStorage.setItem(name, JSON.stringify(stateWithoutImages));
        
        console.log('✅ Saved to hybrid storage (metadata in localStorage, images in IndexedDB)');
      } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
          console.warn('⚠️ LocalStorage quota exceeded — starting staged recovery...');
          
          // Stage 1: force-extract all stale images and retry
          try {
            await hybridStorage.forceExtractAllImages(); // clears & rewrites story-store
            const retryState = typeof value === 'string' ? JSON.parse(value) : value;
            const retryStateWithoutImages = await hybridStorage.extractImages(retryState);
            localStorage.removeItem(name);
            localStorage.setItem(name, JSON.stringify(retryStateWithoutImages));
            console.log('✅ Stage 1 recovery successful.');
            return; // done
          } catch (_) { /* fall through to stage 2 */ }

          // Stage 2: trim stored stories to the 5 most recent per user and retry
          try {
            console.warn('⚠️ Stage 1 failed — trimming stories to reduce state size...');
            const retryState = typeof value === 'string' ? JSON.parse(value) : value;
            const trimmed = await hybridStorage.extractImages(retryState);
            if (trimmed.userLibraries) {
              for (const uid in trimmed.userLibraries) {
                const lib = trimmed.userLibraries[uid];
                if (lib?.stories?.length > 5) lib.stories = lib.stories.slice(-5);
                if (lib?.offlineStories?.length > 5) lib.offlineStories = lib.offlineStories.slice(-5);
              }
            }
            // Null out currentStory to avoid persisting its full canvas data
            trimmed.currentStory = null;
            localStorage.removeItem(name);
            localStorage.setItem(name, JSON.stringify(trimmed));
            console.log('✅ Stage 2 recovery successful — state trimmed to last 5 stories.');
            return;
          } catch (_) { /* fall through to stage 3 */ }

          // Stage 3: wipe the store entirely — stories will reload from backend
          try {
            console.warn('⚠️ Stage 2 failed — wiping story-store. Stories will reload from backend.');
            localStorage.removeItem(name);
          } catch (wipeError) {
            console.error('❌ All recovery stages failed:', wipeError);
          }
        } else {
          console.error('❌ Error saving to hybrid storage:', error);
          throw error;
        }
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      localStorage.removeItem(name);
    }
  };
};
