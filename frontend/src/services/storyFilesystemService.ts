import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

/**
 * Story Filesystem Service
 * Handles persistent storage of full story data using Capacitor Filesystem
 * This keeps the main store lightweight by only storing metadata
 */

// Import Story type from storyStore
import type { Story, StoryPage } from '../stores/storyStore';

export interface StoryMetadata {
  id: string;
  backendId?: number;
  title: string;
  author?: string;
  authors_names?: string[];
  is_collaborative?: boolean;
  description?: string;
  genre?: string;
  ageGroup?: string;
  illustrationStyle?: string;
  language?: string;
  creationType?: 'manual' | 'ai_assisted';
  coverImageThumbnail?: string; // Small thumbnail for list view
  pageCount: number;
  wordCount: number;
  isPublished: boolean;
  isDraft: boolean;
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  lastAccessed?: Date; // Track when story was last opened
  isOnline?: boolean;
}

// FullStory is just the Story type from storyStore
export type FullStory = Story;

class StoryFilesystemService {
  private readonly STORIES_DIR = 'stories';
  private readonly METADATA_FILE = 'metadata.json';
  private isNative = Capacitor.isNativePlatform();
  
  // In-memory cache for recently accessed stories (max 10 stories)
  private cache: Map<string, FullStory> = new Map();
  private readonly MAX_CACHE_SIZE = 10;
  
  /**
   * Initialize the filesystem service
   */
  async initialize(): Promise<void> {
    if (!this.isNative) {
      console.log('📱 Running on web, using localStorage fallback');
      return;
    }
    
    try {
      // Ensure stories directory exists
      await this.ensureDirectoryExists();
      console.log('✅ Story filesystem service initialized');
    } catch (error) {
      console.error('❌ Error initializing story filesystem service:', error);
    }
  }
  
  /**
   * Ensure the stories directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    if (!this.isNative) return;
    
    try {
      await Filesystem.readdir({
        path: this.STORIES_DIR,
        directory: Directory.Data
      });
    } catch {
      // Directory doesn't exist, create it
      await Filesystem.mkdir({
        path: this.STORIES_DIR,
        directory: Directory.Data,
        recursive: true
      });
      console.log('📁 Created stories directory');
    }
  }
  
  /**
   * Save a full story to filesystem
   */
  async saveStory(story: FullStory, userId: string): Promise<void> {
    if (!this.isNative) {
      // Web fallback: store in localStorage (existing behavior)
      return;
    }
    
    try {
      const fileName = `${userId}_${story.id}.json`;
      const filePath = `${this.STORIES_DIR}/${fileName}`;
      
      // Update last modified
      story.lastModified = new Date();
      
      // Save full story data
      await Filesystem.writeFile({
        path: filePath,
        data: JSON.stringify(story),
        directory: Directory.Data,
        encoding: 'utf8'
      });
      
      // Update cache
      this.addToCache(story);
      
      console.log('💾 Saved story to filesystem:', story.title);
    } catch (error) {
      console.error('❌ Error saving story to filesystem:', error);
      throw error;
    }
  }
  
  /**
   * Load a full story from filesystem
   */
  async loadStory(storyId: string, userId: string): Promise<FullStory | null> {
    if (!this.isNative) {
      // Web fallback: story is already in memory
      return null;
    }
    
    // Check cache first
    if (this.cache.has(storyId)) {
      const cached = this.cache.get(storyId)!;
      // Update last accessed
      cached.lastAccessed = new Date();
      console.log('📦 Loaded story from cache:', cached.title);
      return cached;
    }
    
    try {
      const fileName = `${userId}_${storyId}.json`;
      const filePath = `${this.STORIES_DIR}/${fileName}`;
      
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Data,
        encoding: 'utf8'
      });
      
      const story: FullStory = JSON.parse(result.data as string);
      
      // Update last accessed
      story.lastAccessed = new Date();
      
      // Add to cache
      this.addToCache(story);
      
      console.log('📖 Loaded story from filesystem:', story.title);
      return story;
    } catch (error) {
      console.error('❌ Error loading story from filesystem:', error);
      return null;
    }
  }
  
  /**
   * Delete a story from filesystem
   */
  async deleteStory(storyId: string, userId: string): Promise<void> {
    if (!this.isNative) {
      return;
    }
    
    try {
      const fileName = `${userId}_${storyId}.json`;
      const filePath = `${this.STORIES_DIR}/${fileName}`;
      
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.Data
      });
      
      // Remove from cache
      this.cache.delete(storyId);
      
      console.log('🗑️ Deleted story from filesystem:', storyId);
    } catch (error) {
      console.error('❌ Error deleting story from filesystem:', error);
    }
  }
  
  /**
   * Get all story metadata (lightweight list)
   */
  async getAllMetadata(userId: string): Promise<StoryMetadata[]> {
    if (!this.isNative) {
      return [];
    }
    
    try {
      const result = await Filesystem.readdir({
        path: this.STORIES_DIR,
        directory: Directory.Data
      });
      
      const metadata: StoryMetadata[] = [];
      
      // Read each story file and extract metadata
      for (const file of result.files) {
        if (file.name.startsWith(`${userId}_`) && file.name.endsWith('.json')) {
          try {
            const filePath = `${this.STORIES_DIR}/${file.name}`;
            const content = await Filesystem.readFile({
              path: filePath,
              directory: Directory.Data,
              encoding: 'utf8'
            });
            
            const story: FullStory = JSON.parse(content.data as string);
            
            // Extract only metadata (no pages or full images)
            metadata.push(this.extractMetadata(story));
          } catch (error) {
            console.error(`Error reading story file ${file.name}:`, error);
          }
        }
      }
      
      console.log(`📚 Loaded ${metadata.length} story metadata entries`);
      return metadata;
    } catch (error) {
      console.error('❌ Error loading story metadata:', error);
      return [];
    }
  }
  
  /**
   * Extract metadata from full story
   */
  private extractMetadata(story: FullStory): StoryMetadata {
    return {
      id: story.id,
      backendId: story.backendId,
      title: story.title,
      author: story.author,
      authors_names: story.authors_names,
      is_collaborative: story.is_collaborative,
      description: story.description,
      genre: story.genre,
      ageGroup: story.ageGroup,
      illustrationStyle: story.illustrationStyle,
      language: story.language,
      creationType: story.creationType,
      coverImageThumbnail: this.createThumbnail(story.coverImage),
      pageCount: story.pages.length,
      wordCount: story.wordCount,
      isPublished: story.isPublished,
      isDraft: story.isDraft,
      createdAt: story.createdAt,
      lastModified: story.lastModified,
      tags: story.tags,
      lastAccessed: (story as any).lastAccessed,
      isOnline: (story as any).isOnline
    };
  }
  
  /**
   * Create thumbnail from full cover image
   */
  createThumbnail(coverImage: string | undefined): string | undefined {
    if (!coverImage) return undefined;
    
    // For now, just return the full image
    // TODO: Implement actual thumbnail generation using canvas
    return coverImage;
  }
  
  /**
   * Add story to cache with LRU eviction
   */
  private addToCache(story: FullStory): void {
    // If cache is full, remove least recently accessed story
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Date.now();
      
      for (const [key, value] of this.cache.entries()) {
        const accessTime = value.lastAccessed?.getTime() || 0;
        if (accessTime < oldestTime) {
          oldestTime = accessTime;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log('🧹 Evicted story from cache:', oldestKey);
      }
    }
    
    this.cache.set(story.id, story);
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cleared story cache');
  }
  
  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
  
  /**
   * Migrate existing stories from store to filesystem
   * This is a one-time migration helper
   */
  async migrateStoriesToFilesystem(stories: FullStory[], userId: string): Promise<void> {
    if (!this.isNative) {
      console.log('⏭️ Skipping migration on web platform');
      return;
    }
    
    console.log(`🔄 Migrating ${stories.length} stories to filesystem...`);
    
    let success = 0;
    let failed = 0;
    
    for (const story of stories) {
      try {
        await this.saveStory(story, userId);
        success++;
      } catch (error) {
        console.error(`Failed to migrate story ${story.title}:`, error);
        failed++;
      }
    }
    
    console.log(`✅ Migration complete: ${success} succeeded, ${failed} failed`);
  }
}

export const storyFilesystemService = new StoryFilesystemService();
export default storyFilesystemService;
