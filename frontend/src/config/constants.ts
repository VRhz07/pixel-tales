/**
 * Application Constants and Configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pixel-tales-yu7cx.ondigitalocean.app/api';
export const GOOGLE_AI_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || '';

// Feature Flags
export const FEATURES = {
  AI_ENABLED: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
  SOCIAL_ENABLED: import.meta.env.VITE_ENABLE_SOCIAL_FEATURES === 'true',
  OFFLINE_ENABLED: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
};

// User Access Levels
export const USER_TYPES = {
  ANONYMOUS: 'anonymous',
  FREE: 'free',
  PREMIUM: 'premium',
  PRO: 'pro',
} as const;

// Free User Limitations
export const FREE_USER_LIMITS = {
  MAX_STORIES: parseInt(import.meta.env.VITE_FREE_USER_STORY_LIMIT || '3'),
  MAX_CHARACTERS: parseInt(import.meta.env.VITE_FREE_USER_CHARACTER_LIMIT || '2'),
  MAX_STORAGE_MB: parseInt(import.meta.env.VITE_FREE_USER_STORAGE_LIMIT || '50'),
  MAX_STORY_PAGES: 10,
  MAX_ILLUSTRATIONS_PER_STORY: 5,
  AI_GENERATIONS_PER_DAY: 3,
  CANVAS_EXPORT_QUALITY: 'medium', // low, medium, high
};

// Premium User Features
export const PREMIUM_FEATURES = {
  UNLIMITED_STORIES: true,
  UNLIMITED_CHARACTERS: true,
  ADVANCED_DRAWING_TOOLS: true,
  HIGH_RES_EXPORT: true,
  ANIMATION_FEATURES: true,
  VOICE_ACTING_TOOLS: true,
  COMMERCIAL_LICENSING: true,
  PRIORITY_SUPPORT: true,
  NO_ADS: true,
  CLOUD_BACKUP: true,
  COLLABORATION: true,
};

// Anonymous User Restrictions
export const ANONYMOUS_RESTRICTIONS = {
  CAN_VIEW_STORIES: true,
  CAN_CREATE_STORIES: false,
  CAN_SAVE_PROGRESS: false,
  CAN_USE_SOCIAL: false,
  CAN_COMMENT: false,
  CAN_RATE: false,
  CAN_DOWNLOAD: false,
  CAN_USE_AI: false,
  MAX_BROWSE_TIME_MINUTES: 30, // Prompt to sign up after 30 minutes
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    VERIFY_EMAIL: '/auth/verify-email/',
    RESEND_VERIFICATION: '/auth/resend-verification/',
    VERIFY_PASSWORD: '/auth/verify-password/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/refresh/',
    PROFILE: '/auth/profile/',
    CHANGE_PASSWORD: '/auth/change-password/',
    CHANGE_EMAIL: '/auth/change-email/',
  },
  // Stories
  STORIES: {
    LIST: '/stories/',
    CREATE: '/stories/create/',
    DETAIL: (id: string) => `/stories/${id}/`,
    UPDATE: (id: string) => `/stories/${id}/update/`,
    DELETE: (id: string) => `/stories/${id}/delete/`,
    PUBLISH: (id: string) => `/stories/${id}/publish/`,
    UNPUBLISH: (id: string) => `/stories/${id}/unpublish/`,
    COMMENTS: (id: string) => `/stories/${id}/comments/`,
    RATE: (id: string) => `/stories/${id}/rate/`,
  },
  // Characters
  CHARACTERS: {
    LIST: '/characters/',
    CREATE: '/characters/create/',
    DETAIL: (id: string) => `/characters/${id}/`,
    UPDATE: (id: string) => `/characters/${id}/update/`,
    DELETE: (id: string) => `/characters/${id}/delete/`,
  },
  // Social
  SOCIAL: {
    FRIENDS: '/friends/',
    FRIEND_REQUEST: '/friends/request/',
    ACCEPT_FRIEND: (id: string) => `/friends/${id}/accept/`,
    REJECT_FRIEND: (id: string) => `/friends/${id}/reject/`,
  },
  // Achievements
  ACHIEVEMENTS: {
    LIST: '/achievements/',
    USER: '/achievements/user/',
    UNLOCK: '/achievements/unlock/',
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications/',
    READ: (id: string) => `/notifications/${id}/read/`,
    READ_ALL: '/notifications/read-all/',
  },
  // AI
  AI: {
    GENERATE_STORY: '/ai/generate-story/',
    GENERATE_CHARACTER: '/ai/generate-character/',
    WRITING_ASSISTANT: '/ai/writing-assistant/',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  ANONYMOUS_SESSION: 'anonymous_session',
  BROWSE_START_TIME: 'browse_start_time',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'Please sign in to access this feature.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  LIMIT_REACHED: 'You have reached the limit for this feature. Upgrade to continue.',
  ANONYMOUS_LIMIT: 'Sign up for a free account to unlock this feature!',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  STORY_CREATED: 'Story created successfully!',
  STORY_UPDATED: 'Story updated successfully!',
  STORY_PUBLISHED: 'Story published successfully!',
  CHARACTER_CREATED: 'Character created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};
