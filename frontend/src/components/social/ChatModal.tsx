import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { messagingService, Message } from '../../services/messaging.service';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import ConfirmationModal from '../common/ConfirmationModal';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: number;
  friendName: string;
  friendAvatar: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, friendId, friendName, friendAvatar }) => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const { playSound, playSuccess, playButtonClick } = useSoundEffects();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for real-time new message events
  useEffect(() => {
    if (!isOpen) return;

    const handleNewMessage = (event: any) => {
      const message = event.detail;
      console.log('💬 New message event received in ChatModal:', message);
      
      // Only add message if it's from the friend we're chatting with or sent by us to this friend
      if (
        (message.sender.id === friendId && message.receiver.id === user?.id) ||
        (message.sender.id === user?.id && message.receiver.id === friendId)
      ) {
        console.log('✅ Message is for this conversation, adding to chat');
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }
          return [...prev, message];
        });
        
        // Mark as read if message is from friend (not from us)
        if (message.sender.id === friendId) {
          messagingService.markMessagesRead(friendId).catch(console.error);
        }
      }
    };

    window.addEventListener('new-message', handleNewMessage);
    return () => window.removeEventListener('new-message', handleNewMessage);
  }, [isOpen, friendId, user?.id]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const msgs = await messagingService.getMessages(friendId);
      setMessages(msgs);
      
      // Mark messages as read
      await messagingService.markMessagesRead(friendId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      playSound('button-click');
      const newMessage = await messagingService.sendMessage(friendId, messageInput.trim());
      
      if (newMessage) {
        playSuccess();
        setMessages(prev => [...prev, newMessage]);
        setMessageInput('');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      playSound('error');
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

  const handleDeleteMessage = (messageId: number) => {
    playButtonClick();
    setDeleteMessageId(messageId);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteMessageId) return;
    
    try {
      playSound('button-cancel');
      await messagingService.deleteMessage(deleteMessageId);
      setMessages(prev => prev.filter(msg => msg.id !== deleteMessageId));
      setShowDeleteModal(false);
      setDeleteMessageId(null);
    } catch (error) {
      alert('Failed to delete message');
      setShowDeleteModal(false);
      setDeleteMessageId(null);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (messageId: number) => {
    if (!editingContent.trim()) return;
    
    try {
      const updatedMessage = await messagingService.editMessage(messageId, editingContent.trim());
      setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      alert('Failed to edit message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 24) return date.toLocaleDateString();
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="chat-modal-header">
          <div className="chat-modal-user-info">
            <div className="chat-modal-avatar">{friendAvatar}</div>
            <span className="chat-modal-user-name">{friendName}</span>
          </div>
          <button className="chat-modal-close-button" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="chat-modal-messages">
          {isLoading ? (
            <div className="chat-modal-loading">Loading messages...</div>
          ) : messages.length > 0 ? (
            <>
              {messages.map((message) => {
                const isFromMe = message.sender.id === (typeof user?.id === 'number' ? user.id : parseInt(user?.id || '0'));
                const isEditing = editingMessageId === message.id;
                
                return (
                  <div
                    key={message.id}
                    className={`chat-modal-message ${isFromMe ? 'chat-modal-message-sent' : 'chat-modal-message-received'}`}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}
                  >
                    <div 
                      className="chat-modal-message-bubble"
                      style={{
                        backgroundColor: isFromMe ? '#8B5CF6' : (isDarkMode ? '#2d3748' : '#F3F4F6'),
                        color: isFromMe ? 'white' : (isDarkMode ? '#F1F5F9' : '#111827'),
                        border: 'none'
                      } as React.CSSProperties}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #8b5cf6',
                              resize: 'none',
                              minHeight: '60px',
                              fontFamily: 'inherit',
                              fontSize: '0.875rem',
                              backgroundColor: isDarkMode ? '#1a1625' : '#ffffff',
                              color: isDarkMode ? '#ffffff' : '#111827'
                            }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleSaveEdit(message.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="chat-modal-message-content">{message.content}</p>
                          <span className="chat-modal-message-time">{formatTime(message.created_at)}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Three-dot menu (only for own messages) - OUTSIDE bubble */}
                    {isFromMe && !isEditing && (
                      <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === message.id ? null : message.id)}
                          style={{
                            background: 'rgba(107, 114, 128, 0.1)',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            color: '#6b7280'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                            e.currentTarget.style.color = '#8b5cf6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" style={{ color: 'currentColor' }} />
                        </button>
                        
                        {/* Dropdown menu */}
                        {openMenuId === message.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '0.25rem',
                              backgroundColor: 'white',
                              borderRadius: '0.5rem',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              overflow: 'hidden',
                              zIndex: 10,
                              minWidth: '120px'
                            }}
                          >
                            <button
                              onClick={() => handleEditMessage(message)}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#374151',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#ef4444',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="chat-modal-empty">
              <p>No messages yet</p>
              <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                Send a message to start the conversation
              </p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <form className="chat-modal-input-container" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-modal-input"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            disabled={isSending}
            autoFocus
          />
          <button
            type="submit"
            className="chat-modal-send-button"
            disabled={!messageInput.trim() || isSending}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Delete Message Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteMessageId(null);
        }}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ChatModal;
