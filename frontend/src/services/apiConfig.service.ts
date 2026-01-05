/**
 * API Configuration Service
 * Manages dynamic API URL configuration for developer mode
 */

const STORAGE_KEY = 'dev_api_url';
const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://pixeltales-backend.onrender.com/api';

export interface ApiPreset {
  id: string;
  name: string;
  url: string;
  description: string;
  icon: string;
}

export const API_PRESETS: ApiPreset[] = [
  {
    id: 'production',
    name: 'Production Server',
    url: 'https://pixeltales-backend.onrender.com/api',
    description: 'Live production backend',
    icon: '🌐'
  },
  {
    id: 'localhost-adb',
    name: 'Localhost (ADB)',
    url: 'http://localhost:8000/api',
    description: 'USB connection via ADB port forwarding',
    icon: '🔌'
  },
  {
    id: 'localhost-emulator',
    name: 'Localhost (Emulator)',
    url: 'http://10.0.2.2:8000/api',
    description: 'Android emulator magic IP',
    icon: '📱'
  }
];

class ApiConfigService {
  /**
   * Get the current API base URL
   */
  getApiUrl(): string {
    try {
      const customUrl = localStorage.getItem(STORAGE_KEY);
      if (customUrl) {
        console.log('[Dev Mode] Using custom API URL:', customUrl);
        return customUrl;
      }
    } catch (error) {
      console.error('Error reading custom API URL:', error);
    }
    
    return DEFAULT_API_URL;
  }

  /**
   * Set a custom API URL
   */
  setApiUrl(url: string): void {
    try {
      // Clean up the URL
      let cleanUrl = url.trim();
      
      // Remove trailing slash if present
      if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      
      // Ensure it ends with /api if not already
      if (!cleanUrl.endsWith('/api')) {
        cleanUrl = `${cleanUrl}/api`;
      }
      
      // Validate URL format
      try {
        new URL(cleanUrl);
      } catch {
        throw new Error('Invalid URL format');
      }
      
      localStorage.setItem(STORAGE_KEY, cleanUrl);
      console.log('[Dev Mode] API URL updated to:', cleanUrl);
    } catch (error) {
      console.error('Error setting custom API URL:', error);
      throw error;
    }
  }

  /**
   * Reset to default production URL
   */
  resetToDefault(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Dev Mode] API URL reset to default:', DEFAULT_API_URL);
    } catch (error) {
      console.error('Error resetting API URL:', error);
    }
  }

  /**
   * Check if using custom URL
   */
  isUsingCustomUrl(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get the default API URL
   */
  getDefaultUrl(): string {
    return DEFAULT_API_URL;
  }

  /**
   * Test API connectivity
   */
  async testConnection(url?: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const testUrl = url || this.getApiUrl();
    const startTime = Date.now();
    
    try {
      // Remove /api suffix for testing base URL
      const baseUrl = testUrl.replace('/api', '');
      
      // Try multiple endpoints to test connectivity
      const testEndpoints = [
        `${baseUrl}/api/`,  // Try API root
        `${baseUrl}/admin/system/health/`,  // Try health check
      ];
      
      // Try the first endpoint
      const response = await fetch(testEndpoints[0], {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Short timeout for quick feedback
        signal: AbortSignal.timeout(5000)
      });
      
      const latency = Date.now() - startTime;
      
      // Any response (even 404) means server is reachable
      if (response.status < 500) {
        return {
          success: true,
          message: `Connected successfully (${latency}ms)`,
          latency
        };
      } else {
        return {
          success: false,
          message: `Server error (status ${response.status})`
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          return {
            success: false,
            message: 'Connection timeout - Check IP and firewall'
          };
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return {
            success: false,
            message: 'Cannot reach server - Check network and backend'
          };
        }
        return {
          success: false,
          message: `Connection failed: ${error.message}`
        };
      }
      
      return {
        success: false,
        message: 'Unknown connection error'
      };
    }
  }
}

export const apiConfigService = new ApiConfigService();
