/**
 * Admin Service
 * Handles all admin-related API calls for managing users and viewing statistics
 * Uses separate admin authentication
 */
import axios from 'axios';
import adminAuthService from './adminAuth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with admin auth
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add admin auth header to all requests
adminApi.interceptors.request.use((config) => {
  const authHeader = adminAuthService.getAuthHeader();
  if (authHeader.Authorization) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

export interface AdminStats {
  users: {
    total: number;
    last_7_days: number;
    last_30_days: number;
    by_type: Record<string, number>;
  };
  stories: {
    total: number;
    published: number;
    drafts: number;
    last_7_days: number;
    last_30_days: number;
    manual: number;
    ai_assisted: number;
  };
  engagement: {
    total_likes: number;
    total_comments: number;
    total_ratings: number;
    average_rating: number;
  };
  characters: {
    total: number;
    last_7_days: number;
  };
  social: {
    friendships: number;
    pending_requests: number;
    messages: number;
  };
  collaboration: {
    total_sessions: number;
    active_sessions: number;
  };
  relationships: {
    parent_child: number;
  };
  achievements: {
    total_earned: number;
  };
  moderation: {
    flagged_stories: number;
    flagged_comments: number;
    flagged_users: number;
  };
  top_authors: Array<{
    author__username: string;
    author__id: number;
    story_count: number;
  }>;
  popular_stories: Array<{
    id: number;
    title: string;
    author__username: string;
    like_count: number;
  }>;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  display_name: string;
  user_type: 'child' | 'parent' | 'teacher';
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_flagged: boolean;
  violation_count: number;
  story_count: number;
  published_story_count: number;
  children: Array<{
    id: number;
    username: string;
    display_name: string;
  }>;
  parents: Array<{
    id: number;
    username: string;
    display_name: string;
  }>;
}

export interface ArchivedUserListItem {
  id: number;
  username: string;
  email: string;
  display_name: string;
  user_type: 'child' | 'parent' | 'teacher';
  date_joined: string;
  archived_at: string;
  archived_by: string | null;
  archive_reason: string;
  story_count: number;
}

export interface UserDetail extends UserListItem {
  bio: string | null;
  date_of_birth: string | null;
  flagged_reason: string;
  last_violation_date: string | null;
  stories: Array<{
    id: number;
    title: string;
    is_published: boolean;
    date_created: string;
    views: number;
    likes: number;
  }>;
  characters: Array<{
    id: number;
    name: string;
    date_created: string;
  }>;
  achievements: Array<{
    name: string;
    earned_at: string;
  }>;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<AdminStats> {
    const response = await adminApi.get('/admin/dashboard/stats/');
    return response.data.stats;
  }

  /**
   * List all users with filtering and pagination
   */
  async listUsers(params?: {
    user_type?: 'child' | 'parent' | 'teacher';
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ users: UserListItem[]; pagination: PaginationInfo }> {
    const response = await adminApi.get('/admin/users/', { params });
    return {
      users: response.data.users,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get detailed information about a specific user
   */
  async getUser(userId: number): Promise<UserDetail> {
    const response = await adminApi.get(`/admin/users/${userId}/`);
    return response.data.user;
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: number,
    data: {
      username?: string;
      email?: string;
      display_name?: string;
      user_type?: 'child' | 'parent' | 'teacher';
      bio?: string;
      is_active?: boolean;
      is_staff?: boolean;
      is_flagged?: boolean;
      flagged_reason?: string;
      violation_count?: number;
    }
  ): Promise<{ success: boolean; message: string; user: Partial<UserListItem> }> {
    const response = await adminApi.put(`/admin/users/${userId}/update/`, data);
    return response.data;
  }

  /**
   * Archive a user account (soft delete)
   */
  async deleteUser(userId: number, reason?: string): Promise<{ success: boolean; message: string }> {
    const response = await adminApi.delete(`/admin/users/${userId}/delete/`, {
      data: { reason: reason || 'Archived by admin' }
    });
    return response.data;
  }

  /**
   * Get archived users list
   */
  async getArchivedUsers(
    page: number = 1,
    pageSize: number = 20,
    search: string = ''
  ): Promise<{
    success: boolean;
    users: ArchivedUserListItem[];
    pagination: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  }> {
    const response = await adminApi.get('/admin/users/archived/', {
      params: { page, page_size: pageSize, search },
    });
    return response.data;
  }

  /**
   * Restore an archived user account
   */
  async restoreUser(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await adminApi.post(`/admin/users/${userId}/restore/`);
    return response.data;
  }

  /**
   * Add a parent-child relationship
   */
  async addParentChildRelationship(
    parentId: number,
    childId: number
  ): Promise<{ success: boolean; message: string }> {
    const response = await adminApi.post('/admin/relationships/add/', {
      parent_id: parentId,
      child_id: childId,
    });
    return response.data;
  }

  /**
   * Remove a parent-child relationship
   */
  async removeParentChildRelationship(
    parentId: number,
    childId: number
  ): Promise<{ success: boolean; message: string }> {
    const response = await adminApi.delete(`/admin/relationships/${parentId}/${childId}/remove/`);
    return response.data;
  }
}

export default new AdminService();
