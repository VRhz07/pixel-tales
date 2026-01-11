/**
 * Hybrid Storage System for Zustand
 * Stores large data (images) in IndexedDB and metadata in localStorage
 * Prevents QuotaExceededError by keeping localStorage under quota
 */

const DB_NAME = 'PixelTalesImages';
const DB_VERSION = 1;
const IMAGE_STORE = 'story-images';

interface ImageData {
  storyId: string;
  pageId: string;
  imageType: 'page' | 'cover';
  data: string; // base64 image data
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
  async saveImage(storyId: string, pageId: string, imageType: 'page' | 'cover', data: string): Promise<void> {
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
  async getImage(storyId: string, pageId: string, imageType: 'page' | 'cover'): Promise<string | null> {
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
  async extractImages(state: any): Promise<any> {
    if (!state.userLibraries) return state;

    const newState = { ...state };
    newState.userLibraries = { ...state.userLibraries };

    // Process each user's library
    for (const userId in state.userLibraries) {
      const library = state.userLibraries[userId];
      if (!library) continue;

      const newLibrary = { ...library };
      
      // Process stories
      if (library.stories && Array.isArray(library.stories)) {
        newLibrary.stories = await Promise.all(
          library.stories.map(async (story: any) => {
            const newStory = { ...story };

            // Extract cover image
            if (story.coverImage && story.coverImage.startsWith('data:')) {
              await this.saveImage(story.id, 'cover', 'cover', story.coverImage);
              newStory.coverImage = '__INDEXED_DB__'; // Placeholder
            }

            // Extract page images
            if (story.pages && Array.isArray(story.pages)) {
              newStory.pages = await Promise.all(
                story.pages.map(async (page: any) => {
                  const newPage = { ...page };
                  
                  if (page.canvasData && page.canvasData.startsWith('data:')) {
                    await this.saveImage(story.id, page.id, 'page', page.canvasData);
                    newPage.canvasData = '__INDEXED_DB__'; // Placeholder
                  }
                  
                  return newPage;
                })
              );
            }

            return newStory;
          })
        );
      }

      // Process offline stories
      if (library.offlineStories && Array.isArray(library.offlineStories)) {
        newLibrary.offlineStories = await Promise.all(
          library.offlineStories.map(async (story: any) => {
            const newStory = { ...story };

            // Extract cover image
            if (story.coverImage && story.coverImage.startsWith('data:')) {
              await this.saveImage(story.id, 'cover', 'cover', story.coverImage);
              newStory.coverImage = '__INDEXED_DB__';
            }

            // Extract page images
            if (story.pages && Array.isArray(story.pages)) {
              newStory.pages = await Promise.all(
                story.pages.map(async (page: any) => {
                  const newPage = { ...page };
                  
                  if (page.canvasData && page.canvasData.startsWith('data:')) {
                    await this.saveImage(story.id, page.id, 'page', page.canvasData);
                    newPage.canvasData = '__INDEXED_DB__';
                  }
                  
                  return newPage;
                })
              );
            }

            return newStory;
          })
        );
      }

      newState.userLibraries[userId] = newLibrary;
    }

    return newState;
  }

  /**
   * Restore images from IndexedDB after localStorage load
   */
  async restoreImages(state: any): Promise<any> {
    if (!state.userLibraries) return state;

    const newState = { ...state };
    newState.userLibraries = { ...state.userLibraries };

    // Process each user's library
    for (const userId in state.userLibraries) {
      const library = state.userLibraries[userId];
      if (!library) continue;

      const newLibrary = { ...library };
      
      // Process stories
      if (library.stories && Array.isArray(library.stories)) {
        newLibrary.stories = await Promise.all(
          library.stories.map(async (story: any) => {
            const newStory = { ...story };

            // Restore cover image
            if (story.coverImage === '__INDEXED_DB__') {
              const coverData = await this.getImage(story.id, 'cover', 'cover');
              newStory.coverImage = coverData || undefined;
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
                  
                  return newPage;
                })
              );
            }

            return newStory;
          })
        );
      }

      // Process offline stories
      if (library.offlineStories && Array.isArray(library.offlineStories)) {
        newLibrary.offlineStories = await Promise.all(
          library.offlineStories.map(async (story: any) => {
            const newStory = { ...story };

            // Restore cover image
            if (story.coverImage === '__INDEXED_DB__') {
              const coverData = await this.getImage(story.id, 'cover', 'cover');
              newStory.coverImage = coverData || undefined;
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
                  
                  return newPage;
                })
              );
            }

            return newStory;
          })
        );
      }

      newState.userLibraries[userId] = newLibrary;
    }

    return newState;
  }
}

export const hybridStorage = new HybridStorageAdapter();

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
        
        // Extract images to IndexedDB
        const stateWithoutImages = await hybridStorage.extractImages(state);
        
        // Save metadata to localStorage
        localStorage.setItem(name, JSON.stringify(stateWithoutImages));
        
        console.log('✅ Saved to hybrid storage (metadata in localStorage, images in IndexedDB)');
      } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
          console.error('❌ LocalStorage quota exceeded even after extracting images!');
          console.error('State size:', typeof value === 'string' ? value.length : JSON.stringify(value).length, 'bytes');
        } else {
          console.error('❌ Error saving to hybrid storage:', error);
        }
        throw error;
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      localStorage.removeItem(name);
    }
  };
};
