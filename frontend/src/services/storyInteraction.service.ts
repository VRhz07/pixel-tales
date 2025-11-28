/**
 * Story Interaction Service
 * Handles likes, comments, and other story interactions
 */

import { api } from './api';

export interface Comment {
  id: number;
  story: number;
  author: number;
  author_name: string;
  author_avatar?: string;
  text: string;
  date_created: string;
}

class StoryInteractionService {
  /**
   * Toggle like on a story
   */
  async toggleLike(storyId: string): Promise<{ is_liked: boolean; likes_count: number }> {
    try {
      const response = await api.post<any>(`/stories/${storyId}/like/`);
      return {
        is_liked: response.is_liked,
        likes_count: response.likes_count
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Toggle save on a story
   */
  async toggleSave(storyId: string): Promise<{ is_saved: boolean; saves_count: number }> {
    try {
      const response = await api.post<any>(`/stories/${storyId}/save/`);
      return {
        is_saved: response.is_saved,
        saves_count: response.saves_count
      };
    } catch (error) {
      console.error('Error toggling save:', error);
      throw error;
    }
  }

  /**
   * Get comments for a story
   */
  async getComments(storyId: string): Promise<Comment[]> {
    try {
      const response = await api.get<any>(`/stories/${storyId}/comments/`);
      return response.results || response || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * Create a comment on a story
   */
  async createComment(storyId: string, text: string): Promise<Comment> {
    try {
      const response = await api.post<any>(`/stories/${storyId}/comments/create/`, { text });
      return response.comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: number): Promise<void> {
    try {
      await api.delete(`/comments/${commentId}/delete/`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Edit a comment
   */
  async editComment(commentId: number, text: string): Promise<Comment> {
    try {
      const response = await api.put<any>(`/comments/${commentId}/edit/`, { text });
      return response.comment;
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    }
  }

  /**
   * Get interaction statistics for a story
   */
  async getInteractionStats(storyId: string): Promise<{
    likes_count: number;
    comments_count: number;
    views: number;
    saves_count: number;
    is_liked_by_user: boolean;
    is_saved_by_user: boolean;
  } | null> {
    try {
      const response = await api.get<any>(`/stories/${storyId}/stats/`);
      console.log('📊 Stats API response:', response);
      return {
        likes_count: response.likes_count || 0,
        comments_count: response.comments_count || 0,
        views: response.views || 0,
        saves_count: response.saves_count || 0,
        is_liked_by_user: response.is_liked_by_user || false,
        is_saved_by_user: response.is_saved_by_user || false
      };
    } catch (error: any) {
      // If endpoint doesn't exist (404), log it but don't spam console
      if (error?.response?.status === 404) {
        console.warn('⚠️ Stats endpoint not available yet. Using counts from story detail API.');
      } else {
        console.error('❌ Error fetching interaction stats:', error);
      }
      // Return null to indicate stats fetch failed - caller should keep existing values
      return null;
    }
  }
}

// Export singleton instance
export const storyInteractionService = new StoryInteractionService();
export default storyInteractionService;
