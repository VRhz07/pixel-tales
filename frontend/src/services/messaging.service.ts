import api from './api';

export interface MessageUser {
  id: number;
  username: string;
  name: string;
}

export interface Message {
  id: number;
  sender: MessageUser;
  receiver: MessageUser;
  content: string;
  message_type?: 'text' | 'collaboration_invite';
  metadata?: {
    session_id?: string;
    story_title?: string;
    inviter_id?: number;
    inviter_name?: string;
  };
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  user: MessageUser;
  last_message: {
    content: string;
    created_at: string | null;
    is_from_me: boolean;
  };
  unread_count: number;
}

class MessagingService {
  /**
   * Get list of conversations
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const data: any = await api.get('/messages/conversations/');
      console.log('Conversations response:', data);
      return data?.conversations || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Get messages with a specific user
   */
  async getMessages(userId: number): Promise<Message[]> {
    try {
      const data: any = await api.get(`/messages/${userId}/`);
      console.log('📨 Messages API response:', data);
      console.log('📨 First message sample:', data?.messages?.[0]);
      return data?.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Send a message to a user
   */
  async sendMessage(receiverId: number, content: string): Promise<Message | null> {
    try {
      const data: any = await api.post('/messages/send/', {
        receiver_id: receiverId,
        content,
      });
      return data?.message || null;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages from a user as read
   */
  async markMessagesRead(userId: number): Promise<void> {
    try {
      await api.put(`/messages/mark-read/${userId}/`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: number): Promise<void> {
    try {
      await api.delete(`/messages/${messageId}/delete/`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: number, content: string): Promise<Message> {
    try {
      const data: any = await api.put(`/messages/${messageId}/edit/`, { content });
      return data?.message || null;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }
}

export const messagingService = new MessagingService();
