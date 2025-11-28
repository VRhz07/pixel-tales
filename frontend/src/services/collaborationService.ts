/**
 * Collaboration Service for Real-time Drawing
 * Handles WebSocket connections and synchronization
 */

interface Participant {
  user_id: number;
  username: string;
  cursor_color: string;
  cursor_position?: { x: number; y: number };
}

interface DrawingData {
  type: string;
  path?: any;
  color?: string;
  strokeWidth?: number;
  [key: string]: any;
}

interface CollaborationMessage {
  type: string;
  user_id?: number;
  username?: string;
  data?: any;
  position?: { x: number; y: number };
  cursor_color?: string;
  canvas_data?: any;
  participants?: Participant[];
  your_color?: string;
  page_viewers?: Record<string, Array<{
    user_id: number;
    username: string;
    display_name: string;
    cursor_color: string;
  }>>;
  [key: string]: any; // Allow additional properties
}

type MessageHandler = (message: CollaborationMessage) => void;

export class CollaborationService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private isConnecting = false;
  private isReconnecting = false;
  private accessToken: string | null = null;
  public onReconnectFailed?: () => void;
  public onReconnectStateChange?: (isReconnecting: boolean, attempt: number) => void;
  public onReconnectSuccess?: () => void;

  constructor() {
    // Get access token from localStorage
    this.accessToken = localStorage.getItem('access_token');
    
    // Try to restore session from sessionStorage on init
    this.restoreSession();
  }

  /**
   * Connect to a collaboration session
   */
  async connect(sessionId: string, options?: { skipHistorySync?: boolean }): Promise<void> {
    console.log('🔌 connect() called with sessionId:', sessionId, 'length:', sessionId?.length);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Already connected to session');
      return Promise.resolve();
    }

    if (this.isConnecting) {
      console.log('Connection already in progress');
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.sessionId = sessionId;
    
    // Persist session to sessionStorage for reconnection on refresh
    this.persistSession(sessionId);

    // Get access token for authentication
    let token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      this.isConnecting = false;
      return Promise.reject(new Error('Not authenticated'));
    }

    // Check if token is expired and refresh if needed
    try {
      if (this.isTokenExpired(token)) {
        console.log('🔄 Token expired, refreshing...');
        token = await this.refreshAccessToken();
        if (!token) {
          console.error('❌ Failed to refresh token');
          this.isConnecting = false;
          return Promise.reject(new Error('Token refresh failed'));
        }
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      // Try to refresh anyway
      try {
        token = await this.refreshAccessToken();
        if (!token) {
          this.isConnecting = false;
          return Promise.reject(new Error('Token refresh failed'));
        }
      } catch (refreshError) {
        this.isConnecting = false;
        return Promise.reject(new Error('Authentication failed'));
      }
    }

    // Get WebSocket URL from environment
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace('http://', '').replace('https://', '').replace('/api', '');
    const wsUrl = `${wsProtocol}://${wsHost}/ws/collaborate/${sessionId}/?token=${token}`;

    console.log('Connecting to WebSocket:', wsUrl.replace(token, '***TOKEN***'));

    return new Promise((resolve, reject) => {

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message as CollaborationMessage);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          console.log('Close event details:', {
            code: event.code,
            reason: event.reason || 'No reason provided',
            wasClean: event.wasClean,
            type: event.type
          });
          this.isConnecting = false;
          this.ws = null;

          // Attempt to reconnect if not a normal closure and not manually disconnected
          if (event.code !== 1000 && event.code !== 1001 && this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log('🔄 Connection lost, attempting to reconnect...');
            this.isReconnecting = true;
            this.onReconnectStateChange?.(true, this.reconnectAttempts + 1);
            this.attemptReconnect();
          } else if (event.code === 1000 || event.code === 1001) {
            // Clean disconnect, clear session storage
            this.clearPersistedSession();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the session
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.sessionId = null;
    this.messageHandlers.clear();
    this.clearPersistedSession();
  }

  /**
   * Send a drawing operation with page information for cross-page collaboration
   */
  sendDrawing(data: DrawingData & { page_id?: string; page_index?: number; is_cover_image?: boolean }): void {
    this.send({
      type: 'draw',
      data,
      page_id: data.page_id,
      page_index: data.page_index,
      is_cover_image: data.is_cover_image
    });
  }

  /**
   * Send cursor position with canvas context for proper isolation
   */
  sendCursorPosition(x: number, y: number, pageId?: string, pageIndex?: number, isCoverImage?: boolean): void {
    this.send({
      type: 'cursor',
      position: { x, y },
      page_id: pageId,
      page_index: pageIndex,
      is_cover_image: isCoverImage
    });
  }

  /**
   * Clear the canvas with page information for cross-page collaboration
   */
  clearCanvas(pageId?: string, pageIndex?: number, isCoverImage?: boolean): void {
    this.send({
      type: 'clear',
      page_id: pageId,
      page_index: pageIndex,
      is_cover_image: isCoverImage
    });
  }

  /**
   * Send object transformation
   */
  sendTransform(data: any): void {
    this.send({
      type: 'transform',
      data
    });
  }

  /**
   * Send object deletion
   */
  sendDelete(data: any): void {
    this.send({
      type: 'delete',
      data
    });
  }

  /**
   * Send text edit operation
   * Include both page_id (local id) and page_index to help remote clients map correctly.
   */
  sendTextEdit(pageId: number, text: string, pageIndex?: number): void {
    this.send({
      type: 'text_edit',
      page_id: pageId,
      page_index: pageIndex,
      text
    });
  }

  /**
   * Send page change
   */
  sendPageChange(pageNumber: number): void {
    this.send({
      type: 'page_change',
      page_number: pageNumber
    });
  }

  /**
   * Update presence (cursor + tool + optional activity)
   */
  updatePresence(
    cursorPosition: { x: number; y: number } | null,
    currentTool: string,
    activity?: string
  ): void {
    this.send({
      type: 'presence_update',
      cursor_position: cursorPosition,
      current_tool: currentTool,
      activity
    });
  }

  /**
   * Send live title edit
   */
  sendTitleEdit(title: string): void {
    const trimmed = (title || '').trim();
    if (!trimmed) {
      // Prevent sending truly empty titles; keep last known title on clients
      console.warn('Skipping sending empty title in live collaboration');
      return;
    }

    this.send({
      type: 'title_edit',
      title
    });
  }

  /**
   * Kick a user (host only)
   */
  kickUser(userId: number): void {
    this.send({
      type: 'kick_user',
      user_id: userId
    });
  }

  /**
   * Initiate a save vote (REST API)
   */
  async initiateVote(): Promise<any> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }
    
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${this.sessionId}/vote/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to initiate vote');
    }
    
    return response.json();
  }

  /**
   * Cast a vote to save (REST API)
   */
  async voteToSave(voteId: string, agree: boolean): Promise<any> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }
    
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${this.sessionId}/vote/cast/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        vote_id: voteId,
        agree: agree
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to cast vote');
    }
    
    return response.json();
  }

  /**
   * Add a new page
   */
  addPage(pageData: any = {}, pageIndex?: number): void {
    this.send({
      type: 'add_page',
      page_data: pageData,
      page_index: pageIndex
    });
  }

  /**
   * Delete a page
   */
  deletePage(pageIndex?: number, pageId?: number): void {
    this.send({
      type: 'delete_page',
      page_index: pageIndex,
      page_id: pageId
    });
  }

  /**
   * Request current page viewers information
   */
  requestPageViewers(): void {
    this.send({
      type: 'get_page_viewers'
    });
  }
  
  /**
   * Send canvas snapshot for persistence (used for reconnection support)
   */
  sendCanvasSnapshot(pageId: string, isCoverImage: boolean, canvasDataUrl: string): void {
    this.send({
      type: 'canvas_snapshot',
      page_id: pageId,
      is_cover_image: isCoverImage,
      canvas_data_url: canvasDataUrl
    });
  }

  /**
   * Request full canvas sync after reconnection
   */
  requestCanvasSync(pageId?: string, pageIndex?: number, isCoverImage?: boolean): void {
    console.log('📥 Requesting canvas sync after reconnection');
    this.send({
      type: 'request_sync',
      page_id: pageId,
      page_index: pageIndex,
      is_cover_image: isCoverImage
    });
  }

  /**
   * Send full canvas state to a specific user (in response to sync request)
   */
  sendCanvasState(canvasData: any, targetUserId: number, pageId?: string, pageIndex?: number, isCoverImage?: boolean): void {
    console.log('📤 Sending canvas state to user', targetUserId);
    this.send({
      type: 'canvas_state',
      canvas_data: canvasData,
      target_user_id: targetUserId,
      page_id: pageId,
      page_index: pageIndex,
      is_cover_image: isCoverImage
    });
  }

  /**
   * Register a message handler
   */
  on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  /**
   * Unregister a message handler
   */
  off(messageType: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Manually retry reconnection
   */
  retryConnection(): void {
    if (!this.sessionId) {
      console.error('No session ID available for retry');
      return;
    }
    
    if (this.isConnected()) {
      console.log('Already connected, no retry needed');
      return;
    }

    console.log('🔄 Manual reconnection triggered');
    // Reset reconnect attempts to give fresh tries
    this.reconnectAttempts = 0;
    this.isReconnecting = true;
    this.onReconnectStateChange?.(true, 0);
    
    // Attempt reconnection immediately
    this.connect(this.sessionId).catch((error) => {
      console.error('❌ Manual reconnection failed:', error);
      this.attemptReconnect();
    });
  }

  // REST API Methods

  /**
   * Get session presence (REST API)
   */
  async getPresence(sessionId: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${sessionId}/presence/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get presence');
    }
    
    return response.json();
  }

  /**
   * Kick participant (REST API)
   */
  async kickParticipant(sessionId: string, userId: number): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${sessionId}/kick/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to kick participant');
    }
    
    return response.json();
  }

  /**
   * Update session draft (REST API)
   */
  async updateDraft(sessionId: string, storyDraft: any): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${sessionId}/draft/update/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ story_draft: storyDraft })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update draft');
    }
    
    return response.json();
  }

  /**
   * Get session draft (REST API)
   */
  async getDraft(sessionId: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${sessionId}/draft/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get draft');
    }
    
    return response.json();
  }

  /**
   * Close lobby (REST API - Host only)
   */
  async closeLobby(sessionId: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${sessionId}/lobby/close/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to close lobby');
    }
    
    return response.json();
  }

  /**
   * End collaboration session (REST API - Host only)
   * This will deactivate the session and notify all participants
   */
  async endSession(sessionId: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/${sessionId}/end/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to end session');
    }
    
    return response.json();
  }

  /**
   * Get collaborative stories (REST API)
   */
  async getCollaborativeStories(): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/stories/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get collaborative stories');
    }
    
    return response.json();
  }

  /**
   * Publish collaborative story (REST API)
   */
  async publishCollaborativeStory(storyId: number): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/stories/${storyId}/publish-collaborative/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Check if already published
      if (data.error === 'already_published') {
        throw new Error(`Already published by ${data.published_by}`);
      }
      throw new Error(data.error || 'Failed to publish story');
    }
    
    return data;
  }

  /**
   * Get user's active sessions (REST API)
   */
  async getUserSessions(): Promise<any> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    const response = await fetch(`${apiUrl}/collaborate/sessions/user/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user sessions');
    }
    
    return response.json();
  }

  // Private methods

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  /**
   * Public method to send custom messages (for advanced features)
   */
  sendMessage(message: any): void {
    this.send(message);
  }

  private handleMessage(message: CollaborationMessage): void {
    // Deep clone the message to avoid any reference issues
    const clonedMessage = JSON.parse(JSON.stringify(message));
    
    const handlers = this.messageHandlers.get(clonedMessage.type);
    if (handlers) {
      handlers.forEach(handler => handler(clonedMessage));
    }

    // Also trigger 'all' handlers
    const allHandlers = this.messageHandlers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(clonedMessage));
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (!this.sessionId) return;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('⛔ Max reconnection attempts reached. Please refresh the page.');
      this.isReconnecting = false;
      this.onReconnectStateChange?.(false, 0);
      this.handleMessage({ type: 'reconnection_failed' });
      this.onReconnectFailed?.();
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    this.onReconnectStateChange?.(true, this.reconnectAttempts);
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      if (this.sessionId) {
        try {
          // Refresh token before reconnecting if needed
          const token = localStorage.getItem('access_token');
          if (token && this.isTokenExpired(token)) {
            console.log('🔄 Token expired, refreshing before reconnect...');
            const newToken = await this.refreshAccessToken();
            if (!newToken) {
              console.error('❌ Failed to refresh token during reconnect');
              if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Max reconnection attempts reached. Please refresh the page.');
                this.isReconnecting = false;
                this.handleMessage({ type: 'reconnection_failed' });
                this.onReconnectFailed?.();
              }
              return;
            }
          }
          
          await this.connect(this.sessionId);
          this.isReconnecting = false;
          this.onReconnectStateChange?.(false, 0);
          console.log('✅ Successfully reconnected!');
          
          // Notify that reconnection was successful so canvas can request sync
          this.onReconnectSuccess?.();
        } catch (error) {
          console.error('❌ Reconnection failed:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached. Please refresh the page.');
            this.isReconnecting = false;
            this.handleMessage({ type: 'reconnection_failed' });
            this.onReconnectFailed?.();
          }
        }
      }
    }, delay);
  }
  
  /**
   * Persist session info to sessionStorage for reconnection on refresh
   */
  private persistSession(sessionId: string): void {
    try {
      sessionStorage.setItem('collab_session_id', sessionId);
      sessionStorage.setItem('collab_session_timestamp', Date.now().toString());
      console.log('💾 Session persisted to sessionStorage');
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  }
  
  /**
   * Restore session from sessionStorage if available
   */
  private restoreSession(): void {
    try {
      const sessionId = sessionStorage.getItem('collab_session_id');
      const timestamp = sessionStorage.getItem('collab_session_timestamp');
      
      if (sessionId && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // Only restore if session is less than 1 hour old
        if (age < 60 * 60 * 1000) {
          this.sessionId = sessionId;
          console.log('♻️ Restored session from sessionStorage:', sessionId);
        } else {
          console.log('⏰ Stored session too old, clearing');
          this.clearPersistedSession();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }
  
  /**
   * Clear persisted session from sessionStorage
   */
  private clearPersistedSession(): void {
    try {
      sessionStorage.removeItem('collab_session_id');
      sessionStorage.removeItem('collab_session_timestamp');
      console.log('🧹 Cleared persisted session');
    } catch (error) {
      console.error('Failed to clear persisted session:', error);
    }
  }
  
  /**
   * Get the stored session ID from sessionStorage
   */
  getStoredSessionId(): string | null {
    try {
      return sessionStorage.getItem('collab_session_id');
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  }
  
  /**
   * Fetch operation history from server (for late joiners or reconnection)
   */
  async getOperationHistory(sessionId: string, pageNumber?: number): Promise<any[]> {
    const token = localStorage.getItem('access_token');
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    
    let url = `${apiUrl}/collaborate/${sessionId}/operations/`;
    if (pageNumber !== undefined) {
      url += `?page_number=${pageNumber}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get operation history');
    }
    
    const data = await response.json();
    return data.operations || [];
  }

  /**
   * Check if JWT token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration time (exp is in seconds, Date.now() is in milliseconds)
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = payload.exp;
      
      // Add 60 second buffer to refresh before actual expiration
      const isExpired = now >= (expiresAt - 60);
      
      if (isExpired) {
        console.log('🕐 Token expired or expiring soon:', {
          now,
          expiresAt,
          timeUntilExpiry: expiresAt - now
        });
      }
      
      return isExpired;
    } catch (error) {
      console.error('Failed to parse token:', error);
      return true; // Treat invalid tokens as expired
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.error('No refresh token found');
        return null;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (!response.ok) {
        console.error('Failed to refresh token:', response.status);
        
        // If refresh token is invalid, clear auth and redirect to login
        if (response.status === 401) {
          console.error('Refresh token invalid - user needs to login again');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          this.clearPersistedSession();
          
          // Redirect to login page
          window.location.href = '/auth';
        }
        
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access;
      
      // Update stored token
      localStorage.setItem('access_token', newAccessToken);
      this.accessToken = newAccessToken;
      
      console.log('✅ Access token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
