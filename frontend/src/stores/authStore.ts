import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { featureAccessService } from '@/services/featureAccess.service';
import type { User, FeatureAccess, UserLimits, ApiError } from '@/types/api.types';
import { createCapacitorStorage } from '@/utils/capacitorStorage';
import { storage } from '@/utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  featureAccess: FeatureAccess | null;
  userLimits: UserLimits | null;
  
  // Actions
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
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

      signIn: async (email: string, password: string, rememberMe: boolean = true) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(email, password);
          
          // Store remember me preference
          if (rememberMe) {
            storage.setItemSync('rememberMe', 'true');
          } else {
            storage.setItemSync('rememberMe', 'false');
            // Set session expiry for non-remembered sessions (24 hours)
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
            storage.setItemSync('sessionExpiry', expiryTime.toString());
          }
          
          // SECURITY FIX: Clear any leftover parent_session from previous sessions
          storage.removeItemSync('parent_session');
          
          // SECURITY FIX: Clear account switch state to prevent confusion
          import('../stores/accountSwitchStore').then(({ useAccountSwitchStore }) => {
            const accountSwitchStore = useAccountSwitchStore.getState();
            accountSwitchStore.clearActiveAccount();
            
            // Set correct account type based on actual user type
            const userType = response.user.user_type;
            if (userType === 'parent' || userType === 'teacher') {
              accountSwitchStore.setActiveAccount('parent');
            }
            // Don't set 'child' for actual child logins - they shouldn't have account switching
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
          storage.removeItemSync('parent_session');
          
          // Clear remember me and session expiry
          storage.removeItemSync('rememberMe');
          storage.removeItemSync('sessionExpiry');
          
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
        
        // Check if session has expired (for non-remembered sessions)
        const rememberMe = storage.getItemSync('rememberMe') === 'true';
        const sessionExpiry = storage.getItemSync('sessionExpiry');
        
        if (!rememberMe && sessionExpiry) {
          const expiryTime = parseInt(sessionExpiry);
          if (Date.now() > expiryTime) {
            // Session expired, sign out
            await get().signOut();
            return false;
          }
        }

        if (storedUser && isAuthenticated) {
          // CRITICAL FIX: Check if there's a parent_session
          const parentSession = storage.getItemSync('parent_session');
          
          if (parentSession) {
            // We have a parent session - this means we were viewing as child
            try {
              const sessionData = JSON.parse(parentSession);
              
              // SECURITY: Validate the parent session
              if (!sessionData.parentId || !sessionData.parentUserType) {
                // Invalid session structure - clear it and restore parent
                console.warn('🔒 Invalid parent_session structure - restoring parent account');
                storage.removeItemSync('parent_session');
                
                // Restore parent user data if available
                if (sessionData.userData) {
                  const parentUserData = typeof sessionData.userData === 'string' 
                    ? JSON.parse(sessionData.userData) 
                    : sessionData.userData;
                  storage.setItemSync('user_data', JSON.stringify(parentUserData));
                }
                
                // Restore parent tokens if available
                if (sessionData.tokens) {
                  if (sessionData.tokens.access) {
                    storage.setItemSync('access_token', sessionData.tokens.access);
                  }
                  if (sessionData.tokens.refresh) {
                    storage.setItemSync('refresh_token', sessionData.tokens.refresh);
                  }
                }
                
                // Clear account switch state
                import('../stores/accountSwitchStore').then(({ useAccountSwitchStore }) => {
                  useAccountSwitchStore.getState().clearActiveAccount();
                });
                
                // Reload user data from restored parent data
                const restoredUser = authService.getUserData();
                if (restoredUser) {
                  set({
                    user: restoredUser,
                    isAuthenticated: true,
                  });
                  
                  import('../stores/storyStore').then(({ useStoryStore }) => {
                    useStoryStore.getState().setCurrentUser(restoredUser.id);
                  });
                  
                  return true;
                }
              } else {
                // Valid parent session exists - parent was viewing as child
                console.log('🔒 Parent session detected - restoring child view state');
                
                // Set the account switch state to reflect child view
                import('../stores/accountSwitchStore').then(({ useAccountSwitchStore }) => {
                  const childId = storedUser.id ? parseInt(storedUser.id) : undefined;
                  useAccountSwitchStore.getState().setActiveAccount('child', childId, storedUser.name);
                });
              }
            } catch (e) {
              // Corrupted parent session - clear it
              console.error('🔒 Corrupted parent_session - clearing:', e);
              storage.removeItemSync('parent_session');
              
              // Clear account switch state
              import('../stores/accountSwitchStore').then(({ useAccountSwitchStore }) => {
                useAccountSwitchStore.getState().clearActiveAccount();
              });
            }
          } else {
            // No parent session - this is a normal user login
            // Set account type based on actual user type
            const userType = storedUser.user_type;
            import('../stores/accountSwitchStore').then(({ useAccountSwitchStore }) => {
              if (userType === 'parent' || userType === 'teacher') {
                useAccountSwitchStore.getState().setActiveAccount('parent');
              } else if (userType === 'child') {
                const childId = storedUser.id ? parseInt(storedUser.id) : undefined;
                useAccountSwitchStore.getState().setActiveAccount('child', childId, storedUser.name);
              }
            });
          }
          
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
        // Also update storage
        storage.setItemSync('user_data', JSON.stringify(user));
      },
    }),
    {
      name: 'auth-storage',
      storage: createCapacitorStorage(),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
