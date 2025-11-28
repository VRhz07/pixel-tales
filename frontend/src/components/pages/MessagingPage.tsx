import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { messagingService, Conversation, Message } from '../../services/messaging.service';
import { useAuthStore } from '../../stores/authStore';
import AnonymousPrompt from '../ui/AnonymousPrompt';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const MessagingPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const isAnonymous = user?.id === 'anonymous' || !isAuthenticated;
  const { playSuccess, playSound, playButtonClick } = useSoundEffects();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAnonymous) {
      loadConversations();
    }
  }, [isAnonymous]);

  // Listen for real-time message events
  useEffect(() => {
    const handleNewMessage = (event: any) => {
      const message = event.detail;
      console.log('📨 New message event received:', message);
      
      // If this message is for the currently selected conversation, add it to messages
      if (selectedConversation && message.sender.id === selectedConversation.user.id) {
        setMessages(prev => [...prev, message]);
        // Mark as read immediately since user is viewing the conversation
        messagingService.markMessagesRead(selectedConversation.user.id).catch(console.error);
      } else {
        // Update the conversation list to show new message
        loadConversations();
      }
    };

    window.addEventListener('new-message', handleNewMessage);
    return () => window.removeEventListener('new-message', handleNewMessage);
  }, [selectedConversation, isAnonymous]);

  useEffect(() => {
    if (userId && conversations.length > 0) {
      const conversation = conversations.find(c => c.user.id === parseInt(userId));
      if (conversation) {
        selectConversation(conversation);
      }
    }
  }, [userId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation.user.id}`);
    
    try {
      const msgs = await messagingService.getMessages(conversation.user.id);
      setMessages(msgs);
      
      // Mark messages as read
      if (conversation.unread_count > 0) {
        await messagingService.markMessagesRead(conversation.user.id);
        // Update conversation unread count
        setConversations(prev => prev.map(c => 
          c.user.id === conversation.user.id ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const newMessage = await messagingService.sendMessage(
        selectedConversation.user.id,
        messageInput.trim()
      );
      
      if (newMessage) {
        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
        playSuccess();
        
        // Update conversation last message
        setConversations(prev => prev.map(c => 
          c.user.id === selectedConversation.user.id 
            ? {
                ...c,
                last_message: {
                  content: newMessage.content,
                  created_at: newMessage.created_at,
                  is_from_me: true,
                }
              }
            : c
        ));
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to send message');
      }
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return date.toLocaleDateString();
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (isAnonymous) {
    return <AnonymousPrompt feature="Messaging" message="Create a free account to chat with your friends!" />;
  }

  if (isLoading) {
    return (
      <div className="messaging-page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messaging-page">
      <div className="messaging-container">
        {/* Conversations List */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <h2 className="conversations-title">Messages</h2>
          </div>
          
          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <div
                  key={conversation.user.id}
                  className={`conversation-item ${selectedConversation?.user.id === conversation.user.id ? 'active' : ''}`}
                  onClick={() => {
                    playButtonClick();
                    selectConversation(conversation);
                  }}
                >
                  <div className="conversation-avatar">
                    👤
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-name-row">
                      <span className="conversation-name">{conversation.user.name}</span>
                      {conversation.last_message.created_at && (
                        <span className="conversation-time">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="conversation-last-message">
                      {conversation.last_message.is_from_me && 'You: '}
                      {conversation.last_message.content || 'No messages yet'}
                    </div>
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="unread-badge">{conversation.unread_count}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-conversations">
                <p>No conversations yet</p>
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                  Send a message to a friend to start chatting
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button className="back-button-mobile" onClick={() => {
                  playButtonClick();
                  setSelectedConversation(null);
                }}>
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="chat-header-user">
                  <div className="chat-avatar">👤</div>
                  <span className="chat-user-name">{selectedConversation.user.name}</span>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.map((message) => {
                  const isFromMe = message.sender.id === (typeof user?.id === 'number' ? user.id : parseInt(user?.id || '0'));
                  const isCollabInvite = message.message_type === 'collaboration_invite';
                  
                  // Debug logging - log ALL collaboration invites
                  if (isCollabInvite || message.content.includes('invited you to collaborate')) {
                    console.log('🔍 Collaboration message detected:', {
                      message_type: message.message_type,
                      metadata: message.metadata,
                      isCollabInvite,
                      isFromMe,
                      hasSessionId: !!message.metadata?.session_id,
                      conditionCheck: isCollabInvite && !isFromMe && !!message.metadata?.session_id,
                      fullMessage: message
                    });
                  }
                  
                  return (
                    <div
                      key={message.id}
                      className={`message ${isFromMe ? 'message-sent' : 'message-received'}`}
                    >
                      <div 
                        className={`message-bubble ${isCollabInvite ? 'collab-invite-bubble' : ''}`}
                      >
                        <p className="message-content">{message.content}</p>
                        <span className="message-time">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form className="message-input-container" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!messageInput.trim() || isSending}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
