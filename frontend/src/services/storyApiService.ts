/**
 * Story API Service
 * Handles all story-related API calls to Django backend
 */

import { api } from './api';
import { API_ENDPOINTS } from '@/config/constants';
import type { Story, StoryPage } from '../stores/storyStore';

export interface CreateStoryRequest {
  title: string;
  description?: string;
  genre?: string;
  tags?: string[];
  pages: Array<{
    text: string;
    canvasData?: string;
    order: number;
  }>;
  coverImage?: string;
  language?: string; // Story language (en, tl, etc.)
  isDraft: boolean;
  isPublished: boolean;
}

export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  genre?: string;
  tags?: string[];
  pages?: Array<{
    id?: string;
    text: string;
    canvasData?: string;
    order: number;
  }>;
  coverImage?: string;
  language?: string; // Story language (en, tl, etc.)
  isDraft?: boolean;
  isPublished?: boolean;
}

export interface StoryApiResponse {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  genre?: string;
  category?: string;
  tags: string[];
  pages: Array<{
    id: string;
    text: string;
    canvasData?: string;
    order: number;
  }>;
  content?: string;
  canvas_data?: string;
  cover_image?: string;
  coverImage?: string;
  isDraft: boolean;
  is_published: boolean;
  isPublished: boolean;
  createdAt: string;
  date_created: string;
  lastModified: string;
  date_updated: string;
  wordCount: number;
  views?: number;
  likes_count?: number;
  comments_count?: number;
  saves_count?: number;
  saved_count?: number; // Alternative field name used in some responses
  is_saved_by_user?: boolean;
  downloads_count?: number;
  is_liked_by_user?: boolean;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  author_name?: string;
  // Collaborative story fields
  is_collaborative?: boolean;
  authors_names?: string[];
}

class StoryApiService {
  /**
   * Build a safe PATCH payload that omits undefined and blank values
   */
  private buildPatchPayload(data: any): any {
    const payload: any = {};

    const copyIfPresent = (key: string, transform?: (v: any) => any) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = transform ? transform(data[key]) : data[key];
        // Omit undefined and null
        if (value === undefined || value === null) return;
        // Omit empty strings
        if (typeof value === 'string' && value.trim() === '') return;
        payload[key] = value;
      }
    };

    // Common fields
    copyIfPresent('title', (v) => typeof v === 'string' ? v.trim() : v);
    copyIfPresent('summary');
    copyIfPresent('description'); // in case some callers still use description
    copyIfPresent('category');
    copyIfPresent('genres');
    copyIfPresent('language');
    copyIfPresent('creation_type');
    copyIfPresent('is_published');
    copyIfPresent('content');
    copyIfPresent('canvas_data');

    // Cover image: only include if non-empty
    if (Object.prototype.hasOwnProperty.call(data, 'cover_image')) {
      const ci = data['cover_image'];
      if (typeof ci === 'string' && ci.trim().length > 0) {
        payload['cover_image'] = ci;
      }
    }

    // Allow passing through other known structures like pages if used by some endpoints
    copyIfPresent('pages');

    return payload;
  }

  /**
   * Get all stories for the current user
   */
  async getUserStories(): Promise<any[]> {
    try {
      console.log('🔍 Calling API:', API_ENDPOINTS.STORIES.LIST);
      const response = await api.get<any>(API_ENDPOINTS.STORIES.LIST);
      console.log('📦 Full API response:', response);
      
      // Django pagination returns: {count, next, previous, results}
      // Or it might return the array directly
      const stories = response.results || response.stories || response || [];
      console.log('📚 Extracted stories:', stories);
      console.log('📋 Story titles:', stories.map((s: any) => `${s.id}: ${s.title}`));
      
      return stories;
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
  }

  /**
   * Get all published stories from all users (for public library)
   */
  async getPublishedStories(search?: string): Promise<any[]> {
    try {
      // Add public=true parameter to get all published stories from all users
      // Add page_size=100 to load all stories instead of default 12
      let endpoint = `${API_ENDPOINTS.STORIES.LIST}?public=true&page_size=100`;
      if (search) {
        endpoint += `&search=${encodeURIComponent(search)}`;
      }
      
      console.log('🔍 Fetching published stories:', endpoint);
      const response = await api.get<any>(endpoint);
      
      // Django pagination returns: {count, next, previous, results}
      const stories = response.results || response.stories || response || [];
      
      console.log(`📚 Found ${stories.length} published stories from all users`);
      return stories;
    } catch (error) {
      console.error('Error fetching published stories:', error);
      return []; // Return empty array instead of throwing to prevent UI errors
    }
  }

  /**
   * Get a single story by ID
   */
  async getStory(id: string): Promise<StoryApiResponse> {
    try {
      const response = await api.get<any>(API_ENDPOINTS.STORIES.DETAIL(id));
      console.log('📦 Story detail response:', response);
      
      // Backend returns { success: true, story: {...} }
      // Extract the story data from the response
      const storyData = response.story || response;
      console.log('📖 Extracted story data:', storyData);
      console.log('📊 Story interaction counts:', {
        likes_count: storyData.likes_count,
        comments_count: storyData.comments_count,
        views: storyData.views,
        is_liked_by_user: storyData.is_liked_by_user
      });
      
      return storyData;
    } catch (error) {
      console.error(`Error fetching story ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new story
   */
  async createStory(data: CreateStoryRequest): Promise<any> {
    try {
      const response = await api.post<any>(API_ENDPOINTS.STORIES.CREATE, data);
      console.log('✅ Story created successfully:', response);
      return response; // Returns {success, message, story: {...}}
    } catch (error: any) {
      console.error('❌ Error creating story:', error);
      console.log('📋 Validation errors:', error?.details);
      console.log('📋 Full error details:', JSON.stringify(error?.details, null, 2));
      console.log('📋 Full error response:', JSON.stringify(error?.response?.data, null, 2));
      throw error;
    }
  }

  /**
   * Update an existing story
   */
  async updateStory(id: string, data: UpdateStoryRequest): Promise<StoryApiResponse> {
    try {
      // Prefer PATCH for partial updates; build a safe payload that omits blanks
      const payload = this.buildPatchPayload(data);
      const response = await api.patch<StoryApiResponse>(API_ENDPOINTS.STORIES.UPDATE(id), payload);
      return response;
    } catch (error) {
      console.error(`Error updating story ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(id: string): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.STORIES.DELETE(id));
    } catch (error) {
      console.error(`Error deleting story ${id}:`, error);
      throw error;
    }
  }

  /**
   * Publish a story
   */
  async publishStory(id: string): Promise<StoryApiResponse> {
    try {
      const response = await api.post<StoryApiResponse>(API_ENDPOINTS.STORIES.PUBLISH(id));
      return response;
    } catch (error) {
      console.error(`Error publishing story ${id}:`, error);
      throw error;
    }
  }

  /**
   * Unpublish a story (remove from public library)
   */
  async unpublishStory(id: string): Promise<StoryApiResponse> {
    try {
      console.log('🔄 Unpublishing story:', id);
      console.log('📤 Calling endpoint:', API_ENDPOINTS.STORIES.UNPUBLISH(id));
      const response = await api.post<StoryApiResponse>(API_ENDPOINTS.STORIES.UNPUBLISH(id));
      console.log('✅ Unpublish response:', response);
      console.log('📊 Story is_published status:', response.is_published);
      return response;
    } catch (error) {
      console.error(`❌ Error unpublishing story ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user's saved stories
   */
  async getSavedStories(): Promise<any[]> {
    try {
      const response = await api.get<any>('/stories/saved/');
      const rawStories = response.stories || [];
      
      // Map cover_image to coverImage and author fields for consistency
      const processedStories = rawStories.map((story: any) => ({
        ...story,
        coverImage: story.cover_image || story.coverImage, // Map cover_image to coverImage
        author: story.author_name || story.author?.name || story.author || 'Unknown Author', // Handle various author formats
      }));
      
      console.log('📖 Processed saved stories with cover images:', processedStories.map(s => ({
        id: s.id,
        title: s.title,
        hasCover: !!s.coverImage,
        coverPreview: s.coverImage?.substring(0, 50) + '...' || 'No cover'
      })));
      
      return processedStories;
    } catch (error) {
      console.error('Error fetching saved stories:', error);
      return [];
    }
  }

  /**
   * Convert local Story to API format (Django expects different structure)
   */
  convertToApiFormat(story: Story): any {
    // Combine all pages into single content string
    const content = story.pages
      .sort((a, b) => a.order - b.order)
      .map(page => page.text || '') // Ensure empty pages don't cause issues
      .join('\n\n---PAGE BREAK---\n\n')
      .trim() || 'Untitled story content'; // Fallback if all pages are empty
    
    // Combine all canvas data into single JSON string
    // Include cover image as a special entry with order: -1
    const canvasPages = story.pages.map(page => ({
      id: page.id,
      order: page.order,
      canvasData: page.canvasData,
    }));
    
    // Add cover image as first entry in canvas_data if it exists
    if (story.coverImage) {
      canvasPages.unshift({
        id: 'cover',
        order: -1, // Special order for cover
        canvasData: story.coverImage,
      });
    }
    
    const canvasData = JSON.stringify(canvasPages);
    
    // Map genre to Django category choices
    const categoryMap: Record<string, string> = {
      'Adventure': 'adventure',
      'Fantasy': 'fantasy',
      'Mystery': 'mystery',
      'Science Fiction': 'sci_fi',
      'Sci-Fi': 'scifi',
      'sciFi': 'scifi', // Handle AI modal genre ID
      'Fairy Tale': 'fairy_tale',
      'Educational': 'educational',
      'Animal Stories': 'animal',
      'Action': 'action',
      'Friendship': 'friendship',
      'friendship': 'friendship', // Handle lowercase
      'Comedy': 'comedy',
      'comedy': 'comedy', // Handle lowercase
      'action': 'action', // Handle lowercase
    };
    
    // Handle multiple genres from tags array
    let genres: string[] = [];
    let category = 'other';
    
    if (story.tags && story.tags.length > 0) {
      // Map all tags to backend genre IDs
      genres = story.tags.map(tag => categoryMap[tag] || tag.toLowerCase()).filter(Boolean);
      // Use first genre as primary category for backward compatibility
      category = genres[0] || 'other';
    } else if (story.genre) {
      // Fallback to single genre field
      category = categoryMap[story.genre] || 'other';
      genres = [category];
    }
    
    // Validate and clean cover image URL
    let coverImageUrl = '';
    if (story.coverImage && story.coverImage.trim()) {
      const trimmedUrl = story.coverImage.trim();
      
      // Accept both HTTP URLs (from AI) and data URLs (from manual canvas)
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        // HTTP/HTTPS URL - validate it
        try {
          new URL(trimmedUrl);
          coverImageUrl = trimmedUrl;
          console.log('✅ Valid HTTP cover image URL detected, length:', trimmedUrl.length);
        } catch (e) {
          console.warn('⚠️ Invalid URL format (failed URL parsing):', trimmedUrl.substring(0, 100));
        }
      } else if (trimmedUrl.startsWith('data:image/')) {
        // Data URL from canvas - accept it directly
        coverImageUrl = trimmedUrl;
        console.log('✅ Valid data URL cover image detected, length:', trimmedUrl.length);
      } else {
        console.warn('⚠️ Cover image is not a valid URL or data URL:', trimmedUrl.substring(0, 100));
      }
    } else {
      console.log('ℹ️ No cover image provided for this story');
    }
    
    console.log('📝 Converting story to API format:', {
      title: story.title,
      tags: story.tags,
      genre: story.genre,
      mappedGenres: genres,
      category: category,
      coverImageLength: coverImageUrl.length,
      coverImagePreview: coverImageUrl.substring(0, 80)
    });
    
    const apiData: any = {
      title: story.title,
      content: content,
      canvas_data: canvasData,
      summary: story.description || '',
      category: category,
      genres: genres, // Send genres array
      language: story.language || 'en', // Default to English if not set
      creation_type: story.creationType || 'manual', // Track creation method for achievements
      is_published: story.isPublished || false,
    };
    
    // Only include cover_image field if we have a valid URL
    // Completely omit the field if no valid URL (don't send empty string)
    if (coverImageUrl && coverImageUrl.length > 0) {
      apiData.cover_image = coverImageUrl;
      console.log('✅ Including cover_image in API request');
    } else {
      console.log('⚠️ Omitting cover_image field from API request (no valid URL)');
    }
    
    console.log('📤 Final API data being sent:', {
      title: apiData.title,
      category: apiData.category,
      genres: apiData.genres,
      language: apiData.language,
      is_published: apiData.is_published,
      has_cover_image: !!apiData.cover_image,
      cover_image_length: apiData.cover_image ? apiData.cover_image.length : 0,
      cover_image_preview: apiData.cover_image ? apiData.cover_image.substring(0, 100) + '...' : 'NOT INCLUDED',
      content_length: apiData.content.length,
      canvas_data_length: apiData.canvas_data.length
    });
    
    return apiData;
  }

  /**
   * Convert API response to local Story format (Django format)
   */
  convertFromApiFormat(apiStory: any): Story {
    console.log('🔄 Converting API story:', apiStory.id, apiStory.title);
    console.log('📦 Raw canvas_data:', apiStory.canvas_data?.substring(0, 100));
    console.log('📝 Raw content:', apiStory.content?.substring(0, 100));
    console.log('🖼️ Cover image:', apiStory.cover_image);
    console.log('👥 Authors names:', apiStory.authors_names);
    console.log('🤝 Is collaborative:', apiStory.is_collaborative);
    
    // Parse canvas data to extract pages
    let pages: StoryPage[] = [];
    
    try {
      let canvasPages = JSON.parse(apiStory.canvas_data || '[]');
      
      // CRITICAL FIX: Ensure canvasPages is always an array
      if (!Array.isArray(canvasPages)) {
        console.warn('⚠️ canvas_data is not an array, defaulting to empty array');
        canvasPages = [];
      }
      
      const contentPages = (apiStory.content || '').split('\n\n---PAGE BREAK---\n\n');
      
      console.log('📄 Parsed canvas pages:', canvasPages.length);
      console.log('📄 Content pages:', contentPages.length);
      
      // Filter out the cover page (id: 'cover' or order: -1) before mapping
      const actualPages = canvasPages.filter((cp: any) => cp.id !== 'cover' && cp.order !== -1);
      
      pages = actualPages.map((canvasPage: any, index: number) => ({
        id: canvasPage.id || `page-${index}`,
        text: contentPages[index] || '',
        canvasData: canvasPage.canvasData,
        characterIds: [],
        order: canvasPage.order || index,
      }));
      
      console.log('✅ Created pages:', pages.length);
      console.log('📸 Pages with images:', pages.filter(p => p.canvasData).length);
      pages.forEach((page, idx) => {
        if (page.canvasData) {
          console.log(`  Page ${idx + 1}: ${page.canvasData.substring(0, 80)}...`);
        } else {
          console.log(`  Page ${idx + 1}: NO IMAGE`);
        }
      });
      
      // If no pages, create at least one
      if (pages.length === 0) {
        pages = [{
          id: 'page-0',
          text: apiStory.content || '',
          canvasData: undefined,
          characterIds: [],
          order: 0,
        }];
      }
    } catch (error) {
      console.warn('❌ Failed to parse canvas data, creating pages from content only:', error);
      console.error('Canvas data value:', apiStory.canvas_data);
      pages = [{
        id: 'page-0',
        text: apiStory.content || '',
        canvasData: undefined,
        characterIds: [],
        order: 0,
      }];
    }
    
    // Map Django category back to genre
    const genreMap: Record<string, string> = {
      'adventure': 'Adventure',
      'fantasy': 'Fantasy',
      'mystery': 'Mystery',
      'sci_fi': 'Science Fiction',
      'fairy_tale': 'Fairy Tale',
      'educational': 'Educational',
      'animal': 'Animal Stories',
      'other': 'Other',
    };
    
    const wordCount = (apiStory.content || '').split(/\s+/).filter((w: string) => w.length > 0).length;
    
    // Extract cover image from canvas data or use API cover_image
    let coverImage = apiStory.cover_image;
    if (!coverImage) {
      try {
        const canvasPages = JSON.parse(apiStory.canvas_data || '[]');
        const coverPage = canvasPages.find((cp: any) => cp.id === 'cover' || cp.order === -1);
        coverImage = coverPage?.canvasData || pages[0]?.canvasData || undefined;
      } catch {
        coverImage = pages[0]?.canvasData || undefined;
      }
    }
    
    // Convert genres array to readable tags
    const tags = apiStory.genres && Array.isArray(apiStory.genres) 
      ? apiStory.genres.map((g: string) => genreMap[g] || g.charAt(0).toUpperCase() + g.slice(1))
      : [];
    
    const convertedStory = {
      id: apiStory.id?.toString() || '',
      backendId: apiStory.id, // Store Django ID for future updates
      title: apiStory.title,
      author: apiStory.author_name || undefined,
      authors_names: apiStory.authors_names || undefined, // Co-authors for collaborative stories
      is_collaborative: apiStory.is_collaborative || false, // Whether this is a collaborative story
      description: apiStory.summary || '',
      genre: genreMap[apiStory.category] || 'Other',
      tags: tags, // Multiple genres as array
      pages: pages,
      coverImage: coverImage,
      ageGroup: undefined,
      illustrationStyle: undefined,
      creationType: apiStory.creation_type as 'manual' | 'ai_assisted' | undefined, // Preserve creation method
      isDraft: !apiStory.is_published,
      isPublished: apiStory.is_published || false,
      createdAt: new Date(apiStory.date_created),
      lastModified: new Date(apiStory.date_updated),
      wordCount: wordCount,
      language: apiStory.language || 'en', // Preserve language
    };
    
    console.log('✅ Converted story:', convertedStory.id, 'isDraft:', convertedStory.isDraft, 'isPublished:', convertedStory.isPublished);
    return convertedStory;
  }

  /**
   * Sync local stories to backend
   * Useful for migrating localStorage data to backend
   */
  async syncLocalStories(localStories: Story[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const story of localStories) {
      try {
        const apiData = this.convertToApiFormat(story);
        await this.createStory(apiData as CreateStoryRequest);
        success++;
      } catch (error) {
        console.error(`Failed to sync story ${story.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}

// Export singleton instance
export const storyApiService = new StoryApiService();
export default storyApiService;
