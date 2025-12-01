/**
 * API Response Types
 */

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Paginated Response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  user_type: 'child' | 'parent' | 'teacher';
  subscription_type: 'free' | 'premium' | 'pro';
  is_verified: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  created_at: string;
  experience_points?: number;
  level?: number;
  xp_for_next_level?: number;
  xp_progress?: number;
  xp_progress_percentage?: number;
  profile?: {
    user_type: 'child' | 'parent' | 'teacher';
    display_name?: string;
    bio?: string;
    date_of_birth?: string;
  };
}

export interface UserProfile extends User {
  display_name: string;
  bio?: string;
  date_of_birth?: string;
  total_stories: number;
  total_characters: number;
  total_followers: number;
  total_following: number;
  achievements_count: number;
  creation_streak: number;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  user_type: 'child' | 'parent' | 'teacher';
  date_of_birth?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  access_token: string;
  refresh_token: string;
  message?: string;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

// Story Types
export interface StoryPage {
  id: string;
  page_number: number;
  text: string;
  illustration_url?: string;
  canvas_data?: string;
  characters: string[]; // character IDs
}

export interface Story {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  author_name?: string;
  authors_names?: string[]; // Co-authors for collaborative stories
  is_collaborative?: boolean; // Whether this is a collaborative story
  content: string;
  summary?: string;
  category: string;
  cover_image?: string;
  canvas_data?: string;
  pages?: StoryPage[];
  is_published: boolean;
  is_draft: boolean;
  views: number;
  likes: number;
  comments_count: number;
  average_rating: number;
  date_created: string;
  date_updated: string;
  date_published?: string;
}

export interface CreateStoryRequest {
  title: string;
  content: string;
  summary?: string;
  category: string;
  cover_image?: File;
  canvas_data?: string;
  is_published?: boolean;
}

export interface UpdateStoryRequest extends Partial<CreateStoryRequest> {
  id: string;
}

// Character Types
export interface Character {
  id: string;
  name: string;
  creator: {
    id: string;
    name: string;
  };
  description?: string;
  personality_traits?: string[];
  canvas_data?: string;
  image_url?: string;
  date_created: string;
  used_in_stories: number;
}

export interface CreateCharacterRequest {
  name: string;
  description?: string;
  personality_traits?: string[];
  canvas_data?: string;
  image?: File;
}

// Comment Types
export interface Comment {
  id: string;
  story_id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  date_created: string;
  likes: number;
  is_flagged: boolean;
}

export interface CreateCommentRequest {
  story_id: string;
  text: string;
}

// Rating Types
export interface Rating {
  id: string;
  story_id: string;
  user_id: string;
  value: 1 | 2 | 3 | 4 | 5;
  date_created: string;
}

export interface CreateRatingRequest {
  story_id: string;
  value: 1 | 2 | 3 | 4 | 5;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  target_value?: number;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  progress: number;
  is_unlocked: boolean;
  date_earned?: string;
}

// Notification Types
export interface Notification {
  id: string;
  recipient_id: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  url?: string;
  icon?: string;
}

// Friendship Types
export interface Friendship {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  date_created: string;
}

// AI Generation Types
export interface AIStoryGenerationRequest {
  prompt: string;
  genre: string;
  age_group: string;
  illustration_style: string;
  num_pages?: number;
}

export interface AIStoryGenerationResponse {
  title: string;
  summary: string;
  pages: {
    text: string;
    illustration_prompt: string;
  }[];
}

export interface AICharacterGenerationRequest {
  name: string;
  description: string;
  personality_traits: string[];
  appearance_notes?: string;
}

export interface AICharacterGenerationResponse {
  name: string;
  description: string;
  personality: string[];
  backstory: string;
  appearance_description: string;
}

// Upload Types
export interface UploadResponse {
  success: boolean;
  url: string;
  file_size: number;
  file_type: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

// User Limits Types
export interface UserLimits {
  stories: {
    current: number;
    max: number;
    unlimited: boolean;
  };
  characters: {
    current: number;
    max: number;
    unlimited: boolean;
  };
  storage: {
    used_mb: number;
    max_mb: number;
    unlimited: boolean;
  };
  ai_generations: {
    used_today: number;
    max_per_day: number;
    unlimited: boolean;
  };
}

// Feature Access Types
export interface FeatureAccess {
  can_create_stories: boolean;
  can_publish_stories: boolean;
  can_use_ai: boolean;
  can_use_social: boolean;
  can_comment: boolean;
  can_rate: boolean;
  can_download: boolean;
  can_export_high_res: boolean;
  can_use_advanced_tools: boolean;
  can_use_animations: boolean;
  max_story_pages: number;
  max_illustrations_per_story: number;
}
