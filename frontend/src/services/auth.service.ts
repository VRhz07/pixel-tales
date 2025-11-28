/**
 * Authentication Service
 * Handles user authentication, registration, and profile management
 */

import { api } from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/config/constants';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  ApiResponse,
} from '@/types/api.types';

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Demo mode for John Doe
    if (email === 'john.doe@pixeltales.com' && password === 'demo123') {
      const demoAuthResponse: AuthResponse = {
        success: true,
        user: {
          id: 'john-doe-demo',
          username: 'johndoe',
          email: 'john.doe@pixeltales.com',
          name: 'John Doe',
          avatar: '👑',
          user_type: 'parent',
          subscription_type: 'pro',
          is_verified: true,
          created_at: new Date('2024-01-01').toISOString(),
        },
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
      };

      this.saveAuthData(demoAuthResponse);
      return demoAuthResponse;
    }

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      // Backend returns: { access, refresh, user }
      if (response.access && response.refresh && response.user) {
        // Convert to our AuthResponse format
        const authResponse: AuthResponse = {
          success: true,
          user: {
            id: response.user.id.toString(),
            username: response.user.username,
            email: response.user.email,
            name: response.user.display_name || response.user.first_name,
            avatar: response.user.avatar || '📚',
            user_type: response.user.user_type || 'child',
            subscription_type: 'free', // Default to free
            is_verified: true,
            created_at: new Date().toISOString(),
          },
          access_token: response.access,
          refresh_token: response.refresh,
        };

        this.saveAuthData(authResponse);
        return authResponse;
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<any> {
    try {
      // Register the user
      const registerResponse = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);

      // Check if email verification is required
      if (registerResponse.requires_verification) {
        // Return the registration response (includes user_id, email, requires_verification, email_sent)
        return registerResponse;
      }

      // Backend doesn't return tokens on registration, so we need to log in
      if (registerResponse.message || registerResponse.user_id) {
        // Automatically log in the user after successful registration
        const loginResponse = await this.login(data.email, data.password);
        return loginResponse;
      }

      throw new Error('Registration failed');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email with verification code
   */
  async verifyEmail(email: string, verificationCode: string): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        email,
        verification_code: verificationCode,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<any> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
        email,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify password without logging in
   * Used for parent verification when switching from child view
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_PASSWORD, {
        email,
        password,
      });

      return response.success === true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send password reset code to email
   */
  async sendPasswordResetCode(email: string): Promise<any> {
    try {
      const response = await api.post('/auth/password-reset/send/', {
        email,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(email: string, code: string): Promise<any> {
    try {
      const response = await api.post('/auth/password-reset/verify/', {
        email,
        code,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with verified code
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<any> {
    try {
      const response = await api.post('/auth/password-reset/reset/', {
        email,
        code,
        new_password: newPassword,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = api.getRefreshToken();
      
      if (refreshToken) {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await api.get<ApiResponse<UserProfile>>(API_ENDPOINTS.AUTH.PROFILE);
      
      if (response.success && response.data) {
        this.saveUserData(response.data);
        return response.data;
      }

      throw new Error('Failed to fetch profile');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.patch<ApiResponse<UserProfile>>(
        API_ENDPOINTS.AUTH.PROFILE,
        data
      );

      if (response.success && response.data) {
        this.saveUserData(response.data);
        return response.data;
      }

      throw new Error('Failed to update profile');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.success || response.message) {
        return;
      }

      throw new Error('Failed to change password');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user email
   */
  async changeEmail(newEmail: string, password: string): Promise<void> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_EMAIL, {
        new_email: newEmail,
        password: password,
      });

      if (response.success || response.message) {
        // Update local user data with new email
        const userData = this.getUserData();
        if (userData) {
          userData.email = newEmail;
          this.saveUserData(userData);
        }
        return;
      }

      throw new Error('Failed to change email');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    try {
      const response = await api.post('/auth/delete-account/', {
        password: password,
      });

      if (response.success || response.message) {
        // Clear all user data after successful deletion
        this.clearAuthData();
        return;
      }

      throw new Error('Failed to delete account');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return api.isAuthenticated();
  }

  /**
   * Get stored user data
   */
  getUserData(): UserProfile | null {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Check if user has premium subscription
   */
  isPremiumUser(): boolean {
    const user = this.getUserData();
    return user?.subscription_type === 'premium' || user?.subscription_type === 'pro';
  }

  /**
   * Check if user is free tier
   */
  isFreeUser(): boolean {
    const user = this.getUserData();
    return user?.subscription_type === 'free';
  }

  /**
   * Check if user is anonymous (not logged in)
   */
  isAnonymous(): boolean {
    const user = this.getUserData();
    return user?.id === 'anonymous' || !this.isAuthenticated();
  }

  /**
   * Get user subscription type
   */
  getSubscriptionType(): 'anonymous' | 'free' | 'premium' | 'pro' {
    if (this.isAnonymous()) return 'anonymous';
    const user = this.getUserData();
    return user?.subscription_type || 'free';
  }

  /**
   * Save authentication data to storage
   */
  private saveAuthData(authResponse: AuthResponse): void {
    if (authResponse.access_token) {
      api.setAccessToken(authResponse.access_token);
    }
    if (authResponse.refresh_token) {
      api.setRefreshToken(authResponse.refresh_token);
    }
    if (authResponse.user) {
      this.saveUserData(authResponse.user);
    }
  }

  /**
   * Save user data to storage
   */
  private saveUserData(user: any): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    api.clearAuth();
  }

  /**
   * Create anonymous session for browsing
   */
  createAnonymousSession(): void {
    const anonymousUser = {
      id: 'anonymous',
      username: 'anonymous',
      email: 'anonymous@pixeltales.com',
      name: 'Guest User',
      avatar: '👁️',
      user_type: 'child' as const,
      subscription_type: 'free' as const,
      is_verified: false,
      created_at: new Date().toISOString(),
    };

    this.saveUserData(anonymousUser);
    
    // Track browse start time for anonymous session limits
    localStorage.setItem(STORAGE_KEYS.BROWSE_START_TIME, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.ANONYMOUS_SESSION, 'true');
  }

  /**
   * Check if anonymous session has expired
   */
  isAnonymousSessionExpired(): boolean {
    const startTime = localStorage.getItem(STORAGE_KEYS.BROWSE_START_TIME);
    if (!startTime) return false;

    const elapsed = Date.now() - parseInt(startTime);
    const maxTime = 30 * 60 * 1000; // 30 minutes in milliseconds

    return elapsed > maxTime;
  }

  /**
   * Clear anonymous session
   */
  clearAnonymousSession(): void {
    localStorage.removeItem(STORAGE_KEYS.BROWSE_START_TIME);
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }
}

export const authService = new AuthService();
export default authService;
