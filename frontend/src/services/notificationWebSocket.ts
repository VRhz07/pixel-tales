/**
 * WebSocket Service for Real-time Notifications and User Presence
 */

interface NotificationHandler {
  onCollaborationInvite?: (invitation: any) => void;
  onNewMessage?: (message: any) => void;
  onFriendRequest?: (friendship: any) => void;
  onFriendRequestAccepted?: (friendship: any) => void;
  onFriendOnline?: (userId: number, username: string) => void;
  onFriendOffline?: (userId: number, username: string) => void;
  onNotification?: (notification: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private handlers: NotificationHandler = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  public onReconnectStateChange?: (isReconnecting: boolean, attempt: number) => void;

  /**
   * Connect to the notification WebSocket
   */
  async connect(handlers: NotificationHandler = {}): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('Already connected to notification WebSocket');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('Connection already in progress');
        return;
      }

      this.isConnecting = true;
      this.handlers = handlers;

      // Get access token for authentication
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        this.isConnecting = false;
        reject(new Error('Not authenticated'));
        return;
      }

      // Get WebSocket URL from dynamic API config (Developer Mode support)
      const { apiConfigService } = await import('./apiConfig.service');
      const apiUrl = apiConfigService.getApiUrl();
      const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = apiUrl.replace('http://', '').replace('https://', '').replace('/api', '');
      const wsUrl = `${wsProtocol}://${wsHost}/ws/notifications/?token=${token}`;

      console.log('🔔 Connecting to notification WebSocket...');
      console.log('🔔 WebSocket URL:', wsUrl.replace(token, '***TOKEN***'));

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('🔔 Notification WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Clear reconnecting state
          if (this.isReconnecting) {
            this.isReconnecting = false;
            this.onReconnectStateChange?.(false, 0);
          }
          
          // Start ping interval to keep connection alive
          this.startPingInterval();
          
          if (this.handlers.onConnect) {
            this.handlers.onConnect();
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('🔔 Notification WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔔 Notification WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPingInterval();
          this.ws = null;

          if (this.handlers.onDisconnect) {
            this.handlers.onDisconnect();
          }

          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.isReconnecting = true;
            this.onReconnectStateChange?.(true, this.reconnectAttempts + 1);
            this.attemptReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }));
    }
  }

  // Private methods

  private handleMessage(message: any): void {
    console.log('🔔 Received notification message:', message);

    switch (message.type) {
      case 'connection':
        console.log('🔔 Connection confirmed:', message.status);
        break;

      case 'collaboration_invite':
        console.log('🔔 Collaboration invite received:', message.message);
        // Treat collaboration invite as a new message
        if (this.handlers.onNewMessage) {
          this.handlers.onNewMessage(message.message);
        }
        if (this.handlers.onCollaborationInvite) {
          this.handlers.onCollaborationInvite(message.message);
        }
        break;

      case 'new_message':
        console.log('🔔 New message received:', message.message);
        if (this.handlers.onNewMessage) {
          this.handlers.onNewMessage(message.message);
        }
        break;

      case 'friend_request':
        console.log('🔔 Friend request received:', message.friendship);
        if (this.handlers.onFriendRequest) {
          this.handlers.onFriendRequest(message.friendship);
        }
        break;

      case 'friend_request_accepted':
        console.log('🔔 Friend request accepted:', message.friendship);
        if (this.handlers.onFriendRequestAccepted) {
          this.handlers.onFriendRequestAccepted(message.friendship);
        }
        break;

      case 'friend_online':
        console.log('🔔 Friend came online:', message.username);
        if (this.handlers.onFriendOnline) {
          this.handlers.onFriendOnline(message.user_id, message.username);
        }
        break;

      case 'friend_offline':
        console.log('🔔 Friend went offline:', message.username);
        if (this.handlers.onFriendOffline) {
          this.handlers.onFriendOffline(message.user_id, message.username);
        }
        break;

      case 'notification':
        console.log('🔔 General notification:', message.notification);
        if (this.handlers.onNotification) {
          this.handlers.onNotification(message.notification);
        }
        break;

      case 'collaboration_session_started':
        console.log('🔔 Collaboration session started:', message.session_id);
        // Dispatch custom event for the app to listen to
        window.dispatchEvent(new CustomEvent('collaboration-session-started', {
          detail: {
            session_id: message.session_id,
            story_title: message.story_title
          }
        }));
        break;

      case 'collaboration_host_left':
        console.log('🔔 Host left collaboration session:', message.session_id);
        // Dispatch custom event for the app to listen to
        window.dispatchEvent(new CustomEvent('collaboration-host-left', {
          detail: {
            session_id: message.session_id,
            story_title: message.story_title
          }
        }));
        break;

      case 'pong':
        // Pong received, connection is alive
        break;

      default:
        console.log('🔔 Unknown message type:', message.type);
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ws!.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    this.onReconnectStateChange?.(true, this.reconnectAttempts);
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `🔔 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(this.handlers).catch((error) => {
        console.error('🔔 Reconnection failed:', error);
        
        // If max attempts reached, stop reconnecting
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.isReconnecting = false;
          this.onReconnectStateChange?.(false, 0);
          console.error('🔔 Max reconnection attempts reached for notifications');
        }
      });
    }, delay);
  }
}

// Export singleton instance
export const notificationWebSocket = new NotificationWebSocketService();
