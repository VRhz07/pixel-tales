import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { featureAccessService } from '@/services/featureAccess.service';
import type { User, FeatureAccess, UserLimits, ApiError } from '@/types/api.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  featureAccess: FeatureAccess | null;
  userLimits: UserLimits | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, userType: 'child' | 'parent' | 'teacher') => Promise<void>;
  signOut: () => Promise<void>;
  continueWithoutAccount: () => void;
  loadUserProfile: () => Promise<void>;
  updateFeatureAccess: () => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      featureAccess: null,
      userLimits: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(email, password);
          
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null,
          });

          // Set current user in story store
          import('../stores/storyStore').then(({ useStoryStore }) => {
            const storyStore = useStoryStore.getState();
            storyStore.setCurrentUser(response.user.id);
            
            // Auto-load stories from backend for all users
            storyStore.loadStoriesFromBackend().catch(err => {
              console.warn('Failed to load stories from backend:', err);
              
              // If loading fails and this is John Doe, fallback to demo data
              if (response.user.email === 'john.doe@pixeltales.com') {
                console.log('Loading demo data as fallback for John Doe');
                storyStore.resetToDemoData();
              }
            });
          });

          // Update feature access after login
          get().updateFeatureAccess();
        } catch (error) {
          const apiError = error as ApiError;
          set({ 
            isLoading: false,
            error: apiError.message || 'Failed to sign in. Please try again.',
          });
          throw error;
        }
      },

      signUp: async (name: string, email: string, password: string, userType: 'child' | 'parent' | 'teacher') => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.register({
            name,
            email,
            password,
            confirm_password: password,
            user_type: userType,
          });
          
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null,
          });

          // Set current user in story store
          import('../stores/storyStore').then(({ useStoryStore }) => {
            const storyStore = useStoryStore.getState();
            storyStore.setCurrentUser(response.user.id);
            
            // New users start with empty library (no need to load from backend)
            // Stories will auto-sync as they create them
          });

          // Update feature access after signup
          get().updateFeatureAccess();
        } catch (error) {
          const apiError = error as ApiError;
          set({ 
            isLoading: false,
            error: apiError.message || 'Failed to sign up. Please try again.',
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear story store user
          import('../stores/storyStore').then(({ useStoryStore }) => {
            const storyStore = useStoryStore.getState();
            storyStore.setCurrentUser(null);
          });
          
          // Clear account switch store
          import('../stores/accountSwitchStore').then(({ useAccountSwitchStore }) => {
            const accountSwitchStore = useAccountSwitchStore.getState();
            accountSwitchStore.clearActiveAccount();
          });
          
          // Clear parent session if exists
          localStorage.removeItem('parent_session');
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null,
            featureAccess: null,
            userLimits: null,
          });
        }
      },

      continueWithoutAccount: () => {
        authService.createAnonymousSession();
        const anonymousUser = authService.getUserData();
        
        set({
          user: anonymousUser,
          isAuthenticated: false, // Anonymous users are not authenticated
          isLoading: false,
          error: null,
        });

        // Set anonymous user in story store
        import('../stores/storyStore').then(({ useStoryStore }) => {
          const storyStore = useStoryStore.getState();
          storyStore.setCurrentUser(anonymousUser?.id || 'anonymous');
        });

        // Update feature access for anonymous user
        get().updateFeatureAccess();
      },

      loadUserProfile: async () => {
        if (!authService.isAuthenticated()) {
          return;
        }

        set({ isLoading: true });

        try {
          const profile = await authService.getProfile();
          set({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Update feature access with fresh data
          get().updateFeatureAccess();
        } catch (error) {
          const apiError = error as ApiError;
          set({
            isLoading: false,
            error: apiError.message,
          });
          
          // Only sign out on 401 if it's not a network error
          // This allows offline access to continue working
          const isNetworkError = !navigator.onLine || 
                                apiError.code === 'NETWORK_ERROR' ||
                                apiError.message?.includes('network') ||
                                apiError.message?.includes('connect');
          
          if (apiError.status === 401 && !isNetworkError) {
            // Real authentication failure - sign out
            get().signOut();
          }
          // If network error, keep user logged in for offline access
        }
      },

      updateFeatureAccess: () => {
        const featureAccess = featureAccessService.getFeatureAccess();
        const userLimits = featureAccessService.getUserLimits();
        
        set({
          featureAccess,
          userLimits,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        // Check if we have stored auth data
        const storedUser = authService.getUserData();
        const isAuthenticated = authService.isAuthenticated();

        if (storedUser && isAuthenticated) {
          set({
            user: storedUser,
            isAuthenticated: true,
          });

          // Set current user in story store and initialize demo data if needed
          import('../stores/storyStore').then(({ useStoryStore }) => {
            const storyStore = useStoryStore.getState();
            
            // Only set current user if it's not already set (to preserve persisted state)
            if (storyStore.currentUserId !== storedUser.id) {
              storyStore.setCurrentUser(storedUser.id);
            }
            
            if (storedUser.email === 'john.doe@pixeltales.com') {
              storyStore.initializeDemoData();
            }
          });

          // Try to refresh user profile
          try {
            await get().loadUserProfile();
            return true;
          } catch (error) {
            // If refresh fails, keep stored data but mark as potentially stale
            return true;
          }
        } else if (storedUser?.id === 'anonymous') {
          // Anonymous session exists
          set({
            user: storedUser,
            isAuthenticated: false,
          });
          
          // Set anonymous user in story store
          import('../stores/storyStore').then(({ useStoryStore }) => {
            const storyStore = useStoryStore.getState();
            
            // Only set current user if it's not already set (to preserve persisted state)
            if (storyStore.currentUserId !== 'anonymous') {
              storyStore.setCurrentUser('anonymous');
            }
          });
          
          get().updateFeatureAccess();
          return false;
        }

        return false;
      },

      setUser: (user: User) => {
        set({ user });
        // Also update localStorage
        localStorage.setItem('user_data', JSON.stringify(user));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
