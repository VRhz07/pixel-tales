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
        console.log('🔐 Signing in...');
        // Don't set isLoading to true - it blocks the UI
        // We'll set it to false immediately after successful login
        set({ error: null });
        
        try {
          const response = await authService.login(email, password);
          console.log('🔐 Login successful');
          
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
          
          // Navigation is now handled by App.tsx after checkAuth
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
        // Don't set isLoading to true - it blocks the UI
        set({ error: null });
        
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
        // Don't block UI during signout
        set({ isLoading: false });
        
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
          
          // Clear all cache
          import('../stores/cacheStore').then(({ useCacheStore }) => {
            useCacheStore.getState().clearAllCache();
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
          console.log('🔐 loadUserProfile: Not authenticated, skipping');
          return;
        }

        console.log('🔐 loadUserProfile: Starting...');
        // Don't set isLoading to true here - it causes UI blocking
        // The user is already logged in with cached data

        try {
          const profile = await authService.getProfile();
          console.log('🔐 loadUserProfile: Profile loaded successfully');
          set({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Cache user profile including avatar border
          import('../stores/cacheStore').then(({ useCacheStore }) => {
            useCacheStore.getState().setCache('userProfile', profile, 10 * 60 * 1000); // Cache for 10 minutes
          });

          // Update feature access with fresh data
          get().updateFeatureAccess();
        } catch (error) {
          const apiError = error as ApiError;
          console.warn('🔐 loadUserProfile: Failed to load profile:', apiError);
          
          // Don't set isLoading here either - keep UI responsive
          set({
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
            console.log('🔐 loadUserProfile: Real auth failure, signing out');
            get().signOut();
          } else {
            console.log('🔐 loadUserProfile: Network error or offline, keeping user logged in');
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
        console.log('🔐 Starting checkAuth...');
        
        // Check if we have stored auth data
        const storedUser = authService.getUserData();
        const isAuthenticated = authService.isAuthenticated();
        
        console.log('🔐 Stored user:', storedUser?.email);
        console.log('🔐 Is authenticated:', isAuthenticated);
        
        // Check if session has expired (for non-remembered sessions)
        const rememberMe = storage.getItemSync('rememberMe') === 'true';
        const sessionExpiry = storage.getItemSync('sessionExpiry');
        
        if (!rememberMe && sessionExpiry) {
          const expiryTime = parseInt(sessionExpiry);
          if (Date.now() > expiryTime) {
            // Session expired, sign out
            console.log('🔐 Session expired, signing out');
            await get().signOut();
            return false;
          }
        }

        if (storedUser && isAuthenticated) {
          console.log('🔐 User found in storage, restoring session immediately...');
          
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
          
          // INSTANT RESTORE: Set user immediately without waiting for backend
          set({
            user: storedUser,
            isAuthenticated: true,
            isLoading: false, // Ensure loading is false
          });

          console.log('🔐 ✅ User session restored instantly!');

          // Set current user in story store IMMEDIATELY (don't wait)
          import('../stores/storyStore').then(({ useStoryStore }) => {
            const storyStore = useStoryStore.getState();
            
            // Only set current user if it's not already set (to preserve persisted state)
            if (storyStore.currentUserId !== storedUser.id) {
              storyStore.setCurrentUser(storedUser.id);
            }
            
            // Load stories from backend in background (don't await - let it happen async)
            // This won't block the UI and will sync when backend wakes up
            console.log('🔐 Loading stories in background...');
            storyStore.loadStoriesFromBackend().catch(err => {
              console.warn('🔐 Failed to load stories from backend (will retry):', err);
              
              // If loading fails and this is John Doe, fallback to demo data
              if (storedUser.email === 'john.doe@pixeltales.com') {
                console.log('🔐 Loading demo data as fallback for John Doe');
                storyStore.initializeDemoData();
              }
            });
          });

          // BACKGROUND VALIDATION: Try to refresh user profile in background with timeout
          // This won't block auth - just validates token and syncs profile updates
          console.log('🔐 Validating token in background...');
          
          // Wake up the backend without blocking (helps with Render free tier)
          // This sends a lightweight request to wake up the server
          const wakeUpBackend = async () => {
            try {
              // Send a simple ping to wake up the backend
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              
              // Use GET instead of HEAD since the endpoint doesn't support HEAD
              await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/profile/`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${storage.getItemSync('access_token')}`
                },
                signal: controller.signal
              }).catch(() => {
                console.log('🔐 Backend wake-up ping sent (might be sleeping)');
              });
              
              clearTimeout(timeoutId);
            } catch (err) {
              // Ignore errors - this is just a wake-up call
              console.log('🔐 Backend wake-up call completed');
            }
          };
          
          // Start backend wake-up immediately (don't await)
          wakeUpBackend();
          
          // Then validate profile with timeout (5 seconds)
          Promise.race([
            get().loadUserProfile(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile load timeout')), 5000)
            )
          ]).catch(error => {
            console.warn('🔐 Background profile validation failed (using cached data):', error);
            // Keep user authenticated with cached data - this is fine!
            // Backend will sync once it wakes up
          });
          
          return true;
        } else if (storedUser?.id === 'anonymous') {
          console.log('🔐 Anonymous session found');
          // Anonymous session exists
          set({
            user: storedUser,
            isAuthenticated: false,
            isLoading: false,
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

        console.log('🔐 No stored session found');
        return false;
      },

      setUser: (user: User) => {
        set({ user });
        // Also update storage
        storage.setItemSync('user_data', JSON.stringify(user));
        
        // Update cache
        import('../stores/cacheStore').then(({ useCacheStore }) => {
          useCacheStore.getState().setCache('userProfile', user, 10 * 60 * 1000);
        });
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
