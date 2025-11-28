import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  accountType: 'child' | 'parent' | 'educator';
  age?: number;
  grade?: string;
}

export interface PrivacySettings {
  contentVisibility: 'public' | 'friends' | 'private';
  allowMessages: boolean;
  allowComments: boolean;
  showProfile: boolean;
  shareProgress: boolean;
}

export interface ParentalControls {
  safeMode: boolean;
  contentFilter: 'strict' | 'moderate' | 'off';
  timeLimit: number; // minutes per day
  allowedFeatures: {
    socialFeatures: boolean;
    aiGeneration: boolean;
    voiceRecording: boolean;
    sharing: boolean;
  };
}

export interface AccessibilitySettings {
  textToSpeech: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  voiceInput: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  readingSpeed: 'slow' | 'normal' | 'fast';
}

export interface AppPreferences {
  language: 'en' | 'tl' | 'es' | 'fr';
  theme: 'light' | 'dark' | 'colorful' | 'auto';
  notifications: {
    newStories: boolean;
    achievements: boolean;
    reminders: boolean;
    updates: boolean;
  };
  autoSave: boolean;
  storageLimit: number; // MB
}

export interface ProfessionalFeatures {
  hasSubscription: boolean;
  subscriptionType: 'basic' | 'premium' | 'pro';
  features: {
    gridTool: boolean;
    layerManagement: boolean;
    advancedBrushes: boolean;
    textureBrush: boolean;
    imageUpload: boolean;
    advancedDrawingTools: boolean;
    highResExport: boolean;
    animationFeatures: boolean;
    voiceActingTools: boolean;
    commercialLicensing: boolean;
    layersSupport: boolean;
    vectorTools: boolean;
    blendModes: boolean;
  };
}

export interface LinkedAccount {
  id: string;
  name: string;
  email: string;
  accountType: 'child' | 'parent' | 'educator';
  relationship: 'parent' | 'guardian' | 'teacher' | 'sibling';
  permissions: {
    viewProgress: boolean;
    manageSettings: boolean;
    approveContent: boolean;
    setTimeLimits: boolean;
  };
  invitationCode?: string;
  status: 'pending' | 'active' | 'suspended';
}

interface UserState {
  // Profile
  profile: UserProfile;
  
  // Settings
  privacySettings: PrivacySettings;
  parentalControls: ParentalControls;
  accessibilitySettings: AccessibilitySettings;
  appPreferences: AppPreferences;
  professionalFeatures: ProfessionalFeatures;
  
  // Account Management
  linkedAccounts: LinkedAccount[];
  pendingInvitations: LinkedAccount[];
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  updateParentalControls: (updates: Partial<ParentalControls>) => void;
  updateAccessibilitySettings: (updates: Partial<AccessibilitySettings>) => void;
  updateAppPreferences: (updates: Partial<AppPreferences>) => void;
  updateProfessionalFeatures: (updates: Partial<ProfessionalFeatures>) => void;
  
  // Account Linking
  sendInvitation: (email: string, relationship: string) => void;
  acceptInvitation: (invitationId: string) => void;
  removeLinkedAccount: (accountId: string) => void;
  
  // Data Management
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // UI State
  activeSettingsSection: string;
  setActiveSettingsSection: (section: string) => void;
}

const defaultProfile: UserProfile = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@pixeltales.com',
  avatar: '👑',
  bio: 'Master storyteller and creative genius! I love crafting magical adventures and bringing characters to life.',
  accountType: 'parent',
  age: 35,
  grade: 'Adult'
};

const defaultPrivacySettings: PrivacySettings = {
  contentVisibility: 'private',
  allowMessages: false,
  allowComments: true,
  showProfile: false,
  shareProgress: false
};

const defaultParentalControls: ParentalControls = {
  safeMode: true,
  contentFilter: 'strict',
  timeLimit: 60,
  allowedFeatures: {
    socialFeatures: false,
    aiGeneration: true,
    voiceRecording: true,
    sharing: false
  }
};

const defaultAccessibilitySettings: AccessibilitySettings = {
  textToSpeech: false,
  dyslexiaFont: false,
  highContrast: false,
  voiceInput: false,
  fontSize: 'medium',
  readingSpeed: 'normal'
};

const defaultAppPreferences: AppPreferences = {
  language: 'en',
  theme: 'colorful',
  notifications: {
    newStories: true,
    achievements: true,
    reminders: true,
    updates: false
  },
  autoSave: true,
  storageLimit: 500
};

const defaultProfessionalFeatures: ProfessionalFeatures = {
  hasSubscription: true,
  subscriptionType: 'pro',
  features: {
    gridTool: true,
    layerManagement: true,
    advancedBrushes: true,
    textureBrush: true,
    imageUpload: true,
    advancedDrawingTools: true,
    highResExport: true,
    animationFeatures: true,
    voiceActingTools: true,
    commercialLicensing: true,
    layersSupport: true,
    vectorTools: true,
    blendModes: true
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: defaultProfile,
      privacySettings: defaultPrivacySettings,
      parentalControls: defaultParentalControls,
      accessibilitySettings: defaultAccessibilitySettings,
      appPreferences: defaultAppPreferences,
      professionalFeatures: defaultProfessionalFeatures,
      linkedAccounts: [],
      pendingInvitations: [],
      activeSettingsSection: 'account',

      // Profile Actions
      updateProfile: (updates) => 
        set((state) => ({ 
          profile: { ...state.profile, ...updates } 
        })),

      // Settings Actions
      updatePrivacySettings: (updates) =>
        set((state) => ({
          privacySettings: { ...state.privacySettings, ...updates }
        })),

      updateParentalControls: (updates) =>
        set((state) => ({
          parentalControls: { ...state.parentalControls, ...updates }
        })),

      updateAccessibilitySettings: (updates) =>
        set((state) => ({
          accessibilitySettings: { ...state.accessibilitySettings, ...updates }
        })),

      updateAppPreferences: (updates) =>
        set((state) => ({
          appPreferences: { ...state.appPreferences, ...updates }
        })),

      updateProfessionalFeatures: (updates) =>
        set((state) => ({
          professionalFeatures: { ...state.professionalFeatures, ...updates }
        })),

      // Account Linking Actions
      sendInvitation: (email, relationship) => {
        const newInvitation: LinkedAccount = {
          id: `invitation-${Date.now()}`,
          name: '',
          email,
          accountType: 'parent',
          relationship: relationship as any,
          permissions: {
            viewProgress: true,
            manageSettings: true,
            approveContent: true,
            setTimeLimits: true
          },
          invitationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          status: 'pending'
        };

        set((state) => ({
          pendingInvitations: [...state.pendingInvitations, newInvitation]
        }));
      },

      acceptInvitation: (invitationId) => {
        const state = get();
        const invitation = state.pendingInvitations.find(inv => inv.id === invitationId);
        
        if (invitation) {
          set((state) => ({
            linkedAccounts: [...state.linkedAccounts, { ...invitation, status: 'active' as const }],
            pendingInvitations: state.pendingInvitations.filter(inv => inv.id !== invitationId)
          }));
        }
      },

      removeLinkedAccount: (accountId) => {
        set((state) => ({
          linkedAccounts: state.linkedAccounts.filter(acc => acc.id !== accountId)
        }));
      },

      // Data Management
      exportData: async () => {
        const state = get();
        const data = {
          profile: state.profile,
          settings: {
            privacy: state.privacySettings,
            parental: state.parentalControls,
            accessibility: state.accessibilitySettings,
            preferences: state.appPreferences
          },
          exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixel-tales-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      deleteAccount: async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
          // In a real app, this would call an API
          console.log('Account deletion requested');
          // Reset to defaults
          set(() => ({
            profile: defaultProfile,
            privacySettings: defaultPrivacySettings,
            parentalControls: defaultParentalControls,
            accessibilitySettings: defaultAccessibilitySettings,
            appPreferences: defaultAppPreferences,
            professionalFeatures: defaultProfessionalFeatures,
            linkedAccounts: [],
            pendingInvitations: []
          }));
        }
      },

      // UI State
      setActiveSettingsSection: (section) =>
        set(() => ({ activeSettingsSection: section }))
    }),
    {
      name: 'user-settings'
    }
  )
);
