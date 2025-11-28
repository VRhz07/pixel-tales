/**
 * Profanity Management Service
 * Handles API calls for managing profanity words (admin only)
 */

import axios from 'axios';
import adminAuthService from './adminAuth.service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with admin auth for profanity management
const profanityApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add admin auth header to all requests
profanityApi.interceptors.request.use((config) => {
  const authHeader = adminAuthService.getAuthHeader();
  if (authHeader.Authorization) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

// Create a separate axios instance for public endpoint (no auth needed)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export interface ProfanityWord {
  id: number;
  word: string;
  language: 'en' | 'tl' | 'both';
  language_display: string;
  severity: 'mild' | 'moderate' | 'severe';
  severity_display: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfanityStats {
  total_words: number;
  active_words: number;
  inactive_words: number;
  by_language: {
    english: number;
    tagalog: number;
  };
  by_severity: {
    mild: number;
    moderate: number;
    severe: number;
  };
}

export interface ProfanityListParams {
  search?: string;
  language?: string;
  severity?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

const profanityService = {
  /**
   * Get list of profanity words (admin only)
   */
  async getProfanityWords(params?: ProfanityListParams): Promise<{
    words: ProfanityWord[];
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  }> {
    const response = await profanityApi.get('/admin/profanity/', { params });
    return response.data;
  },

  /**
   * Get profanity statistics (admin only)
   */
  async getProfanityStats(): Promise<ProfanityStats> {
    const response = await profanityApi.get('/admin/profanity/stats/');
    return response.data.stats;
  },

  /**
   * Add a new profanity word (admin only)
   */
  async addProfanityWord(data: {
    word: string;
    language: 'en' | 'tl' | 'both';
    severity: 'mild' | 'moderate' | 'severe';
    is_active?: boolean;
  }): Promise<ProfanityWord> {
    const response = await profanityApi.post('/admin/profanity/add/', data);
    return response.data.word;
  },

  /**
   * Update an existing profanity word (admin only)
   */
  async updateProfanityWord(
    wordId: number,
    data: {
      word?: string;
      language?: 'en' | 'tl' | 'both';
      severity?: 'mild' | 'moderate' | 'severe';
      is_active?: boolean;
    }
  ): Promise<ProfanityWord> {
    const response = await profanityApi.put(`/admin/profanity/${wordId}/update/`, data);
    return response.data.word;
  },

  /**
   * Delete a profanity word (admin only)
   */
  async deleteProfanityWord(wordId: number): Promise<void> {
    await profanityApi.delete(`/admin/profanity/${wordId}/delete/`);
  },

  /**
   * Bulk add profanity words (admin only)
   */
  async bulkAddProfanityWords(data: {
    words: string[];
    language: 'en' | 'tl' | 'both';
    severity: 'mild' | 'moderate' | 'severe';
  }): Promise<{
    added_count: number;
    skipped_count: number;
    added: string[];
    skipped: string[];
  }> {
    const response = await profanityApi.post('/admin/profanity/bulk-add/', data);
    return response.data;
  },

  /**
   * Get active profanity words for filtering (public)
   */
  async getActiveProfanityWords(language?: string): Promise<string[]> {
    const response = await publicApi.get('/profanity/active/', {
      params: { language },
    });
    return response.data.words;
  },
};

export default profanityService;
