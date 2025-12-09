import api from './api';

export interface Child {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  is_online: boolean;
  last_seen: string;
  total_stories: number;
  total_reads: number;
  achievements_count: number;
  date_added: string;
}

export interface ChildStatistics {
  stories_read: number;
  stories_read_change: string;
  reading_time: string;
  reading_time_minutes: number;
  reading_time_change: string;
  achievements: number;
  achievements_change: string;
  progress: number;
  stories_created: number;
  stories_this_week: number;
  stories_this_month: number;
  likes_received: number;
  comments_received: number;
  friends_count: number;
}

export interface Activity {
  type: 'story_read' | 'story_created' | 'achievement';
  title: string;
  subtitle: string;
  progress: number;
  timestamp: string;
  rating?: number;
  likes?: number;
  rarity?: string;
}

export interface Goal {
  label: string;
  current: number;
  target: number;
  progress: number;
}

export interface ChildAnalytics {
  daily_reading_time: number[];
  daily_stories_completed: number[];
  milestones: Array<{
    title: string;
    date: string | null;
    icon: string;
    color: string;
    rarity: string;
  }>;
  categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  favorite_genre: string;
  favorite_genre_percentage: number;
  peak_reading_time: string;
  average_rating: number;
  strengths: {
    reading_consistency: number;
    story_completion: number;
    genre_diversity: number;
  };
}

export interface ChildFormData {
  name: string;
  username: string;
  dateOfBirth?: string;
  className?: string;
}

const parentDashboardService = {
  // Get all children for parent
  async getChildren(): Promise<Child[]> {
    try {
      console.log('🔍 Fetching children from /parent/children/...');
      const data = await api.get('/parent/children/');
      
      console.log('=== GET CHILDREN DEBUG ===');
      console.log('API response data:', data);
      console.log('Type of data:', typeof data);
      
      if (!data) {
        console.error('❌ No data received');
        return [];
      }
      
      console.log('Data keys:', Object.keys(data));
      console.log('Has children property?', 'children' in data);
      console.log('Has success property?', 'success' in data);
      
      // Check for {success: true, children: [...]}
      if (data.children && Array.isArray(data.children)) {
        console.log('✅ Found children array with', data.children.length, 'items');
        console.log('Children data:', data.children);
        return data.children;
      }
      
      // Fallback for direct array
      if (Array.isArray(data)) {
        console.log('✅ Data is direct array with', data.length, 'items');
        return data;
      }
      
      console.error('❌ Could not find children in response');
      console.error('Response structure:', JSON.stringify(data, null, 2));
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching children:', error);
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received. Request:', error.request);
      }
      return []; // Return empty array on error
    }
  },

  // Get all students for teacher
  async getStudents(): Promise<Child[]> {
    try {
      const data = await api.get('/teacher/students/');
      console.log('Students API response:', data);
      
      // Handle different response structures
      if (!data) {
        console.warn('No data received');
        return [];
      }
      
      // Check for {success: true, students: [...]}
      if (data.students && Array.isArray(data.students)) {
        return data.students;
      }
      
      // Fallback for direct array
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn('Unexpected response structure, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Error fetching students:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return []; // Return empty array on error
    }
  },

  // Create and add a child profile
  async addChild(childData: ChildFormData): Promise<void> {
    try {
      await api.post('/parent/children/create/', {
        name: childData.name,
        username: childData.username,
        date_of_birth: childData.dateOfBirth,
        class_name: childData.className
      });
    } catch (error: any) {
      console.error('Error creating child profile:', error);
      throw error;
    }
  },

  // Update a child profile
  async updateChild(childId: number, childData: ChildFormData): Promise<void> {
    try {
      await api.put(`/parent/children/${childId}/update/`, {
        name: childData.name,
        username: childData.username,
        dateOfBirth: childData.dateOfBirth,
        className: childData.className
      });
    } catch (error: any) {
      console.error('Error updating child profile:', error);
      throw error;
    }
  },

  // Remove a child
  async removeChild(childId: number): Promise<void> {
    try {
      await api.delete(`/parent/children/${childId}/remove/`);
    } catch (error: any) {
      console.error('Error removing child:', error);
      throw error;
    }
  },

  // Get child statistics
  async getChildStatistics(childId: number): Promise<ChildStatistics> {
    try {
      const data = await api.get(`/parent/children/${childId}/stats/`);
      console.log('Statistics API response:', data);
      
      // api.get already unwraps response.data, so data is the actual response
      if (data && data.statistics) {
        return data.statistics;
      }
      
      // If the response IS the statistics object directly
      if (data && typeof data === 'object' && 'stories_read' in data) {
        return data as ChildStatistics;
      }
      
      console.warn('Unexpected statistics response structure:', data);
      throw new Error('Invalid statistics response');
    } catch (error: any) {
      console.error('Error fetching child statistics:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  // Get child activities
  async getChildActivities(childId: number): Promise<Activity[]> {
    try {
      const data = await api.get(`/parent/children/${childId}/activities/`);
      console.log('Activities API response:', data);
      
      // Handle different response structures
      if (data && data.activities && Array.isArray(data.activities)) {
        return data.activities;
      }
      
      // If response is direct array
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn('No activities found in response');
      return [];
    } catch (error: any) {
      console.error('Error fetching child activities:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return []; // Return empty array on error
    }
  },

  // Get child goals
  async getChildGoals(childId: number): Promise<Goal[]> {
    try {
      const data = await api.get(`/parent/children/${childId}/goals/`);
      console.log('Goals API response:', data);
      
      // Handle different response structures
      if (data && data.goals && Array.isArray(data.goals)) {
        return data.goals;
      }
      
      // If response is direct array
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn('No goals found in response');
      return [];
    } catch (error: any) {
      console.error('Error fetching child goals:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return []; // Return empty array on error
    }
  },

  // Get child analytics (comprehensive data for analytics tab)
  async getChildAnalytics(childId: number): Promise<ChildAnalytics | null> {
    try {
      const data = await api.get(`/parent/children/${childId}/analytics/`);
      console.log('Analytics API response:', data);
      
      // Handle response structure
      if (data && data.analytics) {
        return data.analytics;
      }
      
      // If response IS the analytics object directly
      if (data && 'daily_reading_time' in data) {
        return data as ChildAnalytics;
      }
      
      console.warn('No analytics found in response');
      return null;
    } catch (error: any) {
      console.error('Error fetching child analytics:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return null;
    }
  },

  // Get child stories (all stories created by the child)
  async getChildStories(childId: number): Promise<any[]> {
    try {
      const data = await api.get(`/parent/children/${childId}/stories/`);
      console.log('Child stories API response:', data);
      
      // Handle response structure
      if (data && data.stories && Array.isArray(data.stories)) {
        return data.stories;
      }
      
      // If response is direct array
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn('No stories found in response');
      return [];
    } catch (error: any) {
      console.error('Error fetching child stories:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return [];
    }
  },

  // Switch to child view (allows parent/teacher to view app as child)
  async switchToChildView(childId: number): Promise<any> {
    try {
      const data = await api.post(`/parent/children/${childId}/switch-view/`);
      console.log('Switch to child view response:', data);
      return data;
    } catch (error: any) {
      console.error('Error switching to child view:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  }
};

export default parentDashboardService;
