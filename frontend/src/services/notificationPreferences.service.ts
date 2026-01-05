import api from './api';

export interface NotificationPreferences {
  weekly_reports: boolean;
  achievement_alerts: boolean;
  goal_completion: boolean;
  realtime_updates: boolean;
  push_token?: string | null;
  device_type?: 'ios' | 'android' | 'web' | null;
  share_usage_data: boolean;
  allow_analytics: boolean;
  public_profile: boolean;
}

class NotificationPreferencesService {
  /**
   * Get notification preferences for the current user
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const data = await api.get('/notifications/preferences/');
      console.log('Notification preferences response:', data);
      
      if (data && data.preferences) {
        return data.preferences;
      }
      
      // Return defaults if no preferences found
      return {
        weekly_reports: true,
        achievement_alerts: true,
        goal_completion: true,
        realtime_updates: false,
        push_token: null,
        device_type: null,
        share_usage_data: true,
        allow_analytics: true,
        public_profile: false,
      };
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      // Return defaults on error
      return {
        weekly_reports: true,
        achievement_alerts: true,
        goal_completion: true,
        realtime_updates: false,
        push_token: null,
        device_type: null,
        share_usage_data: true,
        allow_analytics: true,
        public_profile: false,
      };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const data = await api.put('/notifications/preferences/update/', preferences);
      console.log('Update preferences response:', data);
      
      if (data && data.preferences) {
        return data.preferences;
      }
      
      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Register push notification token for mobile devices
   */
  async registerPushToken(pushToken: string, deviceType: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
      const data = await api.post('/notifications/register-token/', {
        push_token: pushToken,
        device_type: deviceType,
      });
      
      return data.success === true;
    } catch (error: any) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  /**
   * Send test email to verify SendGrid is working
   */
  async sendTestEmail(): Promise<{ success: boolean; message: string }> {
    try {
      const data = await api.post('/notifications/send-test-email/');
      return {
        success: data.success === true,
        message: data.message || 'Test email sent!'
      };
    } catch (error: any) {
      console.error('Error sending test email:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to send test email'
      };
    }
  }

  /**
   * Send sample achievement notification email
   */
  async sendAchievementTest(childName: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await api.post('/notifications/send-achievement/', {
        child_name: childName,
        achievement_name: 'First Story Created',
        achievement_description: 'Created your first story!'
      });
      return {
        success: data.success === true,
        message: data.message || 'Achievement notification sent!'
      };
    } catch (error: any) {
      console.error('Error sending achievement notification:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to send notification'
      };
    }
  }

  /**
   * Send sample weekly progress report email
   */
  async sendWeeklyReportTest(childName: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await api.post('/notifications/send-weekly-report/', {
        child_name: childName,
        stats: {
          stories_read: 5,
          stories_created: 3,
          achievements_earned: 2,
          total_reading_time: '2h 30m',
          games_completed: 4
        }
      });
      return {
        success: data.success === true,
        message: data.message || 'Weekly report sent!'
      };
    } catch (error: any) {
      console.error('Error sending weekly report:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to send report'
      };
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
