/**
 * Admin Authentication Service
 * Separate from regular user authentication
 */
import axios from 'axios';
import { apiConfigService } from './apiConfig.service';

const API_BASE_URL = apiConfigService.getApiUrl();

// Storage keys for admin auth
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';

interface AdminLoginResponse {
  success: boolean;
  message?: string;
  admin_token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    display_name: string;
    user_type: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
  error?: string;
}

interface AdminVerifyResponse {
  success: boolean;
  valid?: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    is_superuser: boolean;
  };
  error?: string;
}

class AdminAuthService {
  /**
   * Admin login - separate from user login
   */
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    try {
      console.log('🔐 Attempting admin login...');
      console.log('API URL:', `${API_BASE_URL}/admin/auth/login/`);
      console.log('Email:', email);
      
      const response = await axios.post(`${API_BASE_URL}/admin/auth/login/`, {
        email,
        password,
      });

      console.log('📥 Response:', response.data);

      if (response.data.success && response.data.admin_token) {
        // Store admin token and user data
        localStorage.setItem(ADMIN_TOKEN_KEY, response.data.admin_token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.data.user));
        
        console.log('✅ Admin login successful');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Verify admin token
   */
  async verifyToken(): Promise<boolean> {
    const token = this.getAdminToken();
    
    if (!token) {
      return false;
    }

    try {
      const response = await axios.post<AdminVerifyResponse>(
        `${API_BASE_URL}/admin/auth/verify/`,
        { token }
      );

      return response.data.success && response.data.valid === true;
    } catch (error) {
      console.error('❌ Admin token verification failed:', error);
      return false;
    }
  }

  /**
   * Admin logout
   */
  async logout(): Promise<void> {
    const token = this.getAdminToken();
    
    if (token) {
      try {
        await axios.post(
          `${API_BASE_URL}/admin/auth/logout/`,
          {},
          {
            headers: {
              Authorization: `AdminBearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error('❌ Admin logout error:', error);
      }
    }

    // Clear admin data
    this.clearAdminData();
    console.log('✅ Admin logged out');
  }

  /**
   * Get admin token
   */
  getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  /**
   * Get admin user data
   */
  getAdminUser(): any | null {
    const userData = localStorage.getItem(ADMIN_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if admin is authenticated
   */
  isAdminAuthenticated(): boolean {
    return !!this.getAdminToken();
  }

  /**
   * Clear admin data
   */
  clearAdminData(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }

  /**
   * Get authorization header for admin requests
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getAdminToken();
    return token ? { Authorization: `AdminBearer ${token}` } : {};
  }
}

export default new AdminAuthService();
