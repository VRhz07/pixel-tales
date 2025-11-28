import React, { useEffect, useRef, useState } from 'react';
import { PresenceUser } from '../components/collaboration/PresenceSystem';

interface UsePresenceTrackingProps {
  sessionId: string | null;
  participants: any[];
  currentUserId: number;
  isCollaborating: boolean;
  collaborationService: any;
}

export const usePresenceTracking = ({
  sessionId,
  participants,
  currentUserId,
  isCollaborating,
  collaborationService
}: UsePresenceTrackingProps) => {
  const [presenceUsers, setPresenceUsers] = useState<Map<number, PresenceUser>>(new Map());
  const [isTyping, setIsTyping] = useState<{ elementId: string; type: string; pageIndex?: number } | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPresenceUpdateRef = useRef<number>(0);

  // Predefined colors for participants
  const PRESENCE_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
  ];

  // Get participant color - use a stable color assignment based on userId
  const getParticipantColor = (userId: number): string => {
    // If participants array is empty or doesn't contain user, use userId for stable color assignment
    let index = participants.findIndex(p => p.id === userId);
    
    if (index === -1) {
      // Fallback: use userId to ensure consistent colors even when participants aren't loaded yet
      index = userId % PRESENCE_COLORS.length;
      console.log('🎨 Color fallback for userId:', userId, 'using index:', index);
    }
    
    const color = PRESENCE_COLORS[index % PRESENCE_COLORS.length];
    console.log('🎨 Color assignment:', { userId, index, color, participantsCount: participants.length });
    return color;
  };

  // Send presence update to other users
  const sendPresenceUpdate = (updates: Partial<PresenceUser>, skipThrottle = false) => {
    if (!isCollaborating || !sessionId || !collaborationService.isConnected()) return;

    const now = Date.now();
    // Throttle presence updates to max 10 per second (except for cursor updates)
    if (!skipThrottle && now - lastPresenceUpdateRef.current < 100) return;
    lastPresenceUpdateRef.current = now;

    const presence = {
      type: 'presence_update',
      user_id: currentUserId,
      user_name: participants.find(p => p.id === currentUserId)?.username || participants.find(p => p.id === currentUserId)?.name || 'You',
      cursor_position: updates.cursor,
      current_tool: updates.typing ? 'text' : null,
      activity: updates.typing ? 
        (updates.typing.elementType === 'title' ? 'typing_title' : 'typing_text') : 
        'idle',
      typing: updates.typing,
      cursor: updates.cursor,
      timestamp: now
    };

    try {
      collaborationService.sendMessage(presence);
      console.log('🔗 WebSocket connected:', collaborationService.isConnected());
    } catch (error) {
      console.error('❌ Failed to send presence update:', error);
      console.error('🔗 WebSocket connected:', collaborationService.isConnected());
    }
  };

  // Handle incoming presence updates
  const handlePresenceUpdate = (message: any) => {
    
    if (message.type !== 'presence_update') {
      console.log('⏭️ Skipping non-presence message');
      return;
    }
    
    if (message.user_id === currentUserId) {
      console.log('⏭️ Skipping own presence message');
      return;
    }


    const userId = message.user_id;
    setPresenceUsers(prev => {
      const newMap = new Map(prev);
      const participant = participants.find(p => p.id === userId);
      
      // Debug logging
      console.log('🔍 Debug presence update:', {
        userId,
        message_user_name: message.user_name,
        message_username: message.username,
        participant_found: !!participant,
        participant_username: participant?.username,
        participant_display_name: participant?.display_name,
        participant_name: participant?.name,
        participants_count: participants.length,
        full_message: message,
        all_participants: participants.map(p => ({ id: p.id, username: p.username, name: p.name, display_name: p.display_name }))
      });
      
      // Try multiple ways to get username
      const userName = message.user_name || 
                      message.username ||
                      participant?.username || 
                      participant?.display_name || 
                      participant?.name ||
                      `User ${userId}`;  // Fallback with unique ID
      
      const existing = newMap.get(userId) || {
        id: userId,
        name: userName,
        color: getParticipantColor(userId),
        lastSeen: Date.now()
      };

      // Check both old and new format for typing
      const typingData = message.typing || (message.activity?.startsWith('typing') ? { active: true, type: message.activity } : null);
      
      const finalCursor = message.cursor || message.cursor_position;
      
      const updated = { 
        ...existing, 
        cursor: finalCursor,
        typing: typingData,
        activity: message.activity,
        lastSeen: Date.now()
      };
      
      newMap.set(userId, updated);
      return newMap;
    });
  };

  // Track typing status
  const startTyping = (elementId: string, type: 'title' | 'text' | 'canvas', pageIndex?: number) => {
    console.log('🔥 startTyping called:', { elementId, type, pageIndex });
    const typingData = { elementId, type, pageIndex };
    setIsTyping(typingData);
    
    console.log('🔥 Sending typing update:', {
      typing: {
        elementId,
        elementType: type,
        pageIndex
      },
      cursorFromState: cursorPosition
    });
    
    // Don't send cursor from state - it might be stale
    // Cursor will be sent separately by updateCursor
    sendPresenceUpdate({
      typing: {
        elementId,
        elementType: type,
        pageIndex
      }
    });

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Auto-stopping typing after 3 seconds');
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    console.log('🛑 stopTyping called');
    setIsTyping(null);
    sendPresenceUpdate({
      typing: undefined
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Track cursor position using character index
  const updateCursor = (cursorPos: number, textLength: number, elementId: string, textValue?: string) => {
    const cursorData = { 
      cursorPos, 
      textLength, 
      elementId, 
      textValue: textValue || '',
      x: 0, // Will be calculated on the receiving end
      y: 0  // Will be calculated on the receiving end
    };
    setCursorPosition({ x: 0, y: 0 }); // Keep for backward compatibility
    
    const updateData = {
      cursor: cursorData,
      typing: isTyping ? {
        elementId: isTyping.elementId,
        elementType: isTyping.type,
        pageIndex: isTyping.pageIndex
      } : undefined
    };
    sendPresenceUpdate(updateData, true); // Skip throttle for cursor updates
  };

  const clearCursor = () => {
    setCursorPosition(null);
    sendPresenceUpdate({
      cursor: undefined
    });
  };

  // Helper function to get text cursor position (character index, not screen coordinates)
  const getTextCursorPosition = (target: HTMLInputElement | HTMLTextAreaElement) => {
    const cursorPos = target.selectionStart || 0;
    const textLength = target.value.length;
    
    return {
      cursorPos,
      textLength,
      elementId: target.id || target.name || 'text-input',
      value: target.value
    };
  };

  // Text input tracking with cursor position
  const trackTextInput = (elementId: string, type: 'title' | 'text', pageIndex?: number) => {
    return {
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        startTyping(elementId, type, pageIndex);
        
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const cursorData = getTextCursorPosition(target);
        updateCursor(cursorData.cursorPos, cursorData.textLength, elementId, cursorData.value);
      },
      onBlur: () => {
        stopTyping();
        clearCursor();
      },
      onInput: (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!isTyping || isTyping.elementId !== elementId) {
          startTyping(elementId, type, pageIndex);
        }
        
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const cursorData = getTextCursorPosition(target);
        updateCursor(cursorData.cursorPos, cursorData.textLength, elementId, cursorData.value);
      },
      onClick: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        
        // Get actual text cursor position after click
        setTimeout(() => {
          const cursorData = getTextCursorPosition(target);
          updateCursor(cursorData.cursorPos, cursorData.textLength, elementId, cursorData.value);
        }, 0);
      },
      onKeyUp: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Update cursor position on arrow key navigation
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const cursorData = getTextCursorPosition(target);
        updateCursor(cursorData.cursorPos, cursorData.textLength, elementId, cursorData.value);
      },
      onSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Handle text selection changes
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const cursorData = getTextCursorPosition(target);
        updateCursor(cursorData.cursorPos, cursorData.textLength, elementId, cursorData.value);
      }
    };
  };

  // Canvas tracking
  const trackCanvas = (elementId: string, pageIndex?: number) => {
    return {
      onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        console.log('🎨 Canvas mouse move:', { x: e.clientX - rect.left, y: e.clientY - rect.top, elementId });
        updateCursor(e.clientX - rect.left, e.clientY - rect.top, elementId);
      },
      onTouchMove: (e: React.TouchEvent<HTMLElement>) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          updateCursor(touch.clientX - rect.left, touch.clientY - rect.top, elementId);
        }
      },
      onMouseDown: () => startTyping(elementId, 'canvas', pageIndex),
      onTouchStart: () => startTyping(elementId, 'canvas', pageIndex),
      onMouseUp: () => stopTyping(),
      onTouchEnd: () => stopTyping(),
      onMouseLeave: () => {
        clearCursor();
        stopTyping();
      }
    };
  };

  // Setup WebSocket listener for presence updates
  useEffect(() => {
    if (!isCollaborating || !sessionId) return;

    // Use collaborationService's message handling system
    collaborationService.on('presence_update', handlePresenceUpdate);
    collaborationService.on('all', handlePresenceUpdate); // Listen to all messages

    return () => {
      collaborationService.off('presence_update', handlePresenceUpdate);
      collaborationService.off('all', handlePresenceUpdate);
    };
  }, [isCollaborating, sessionId]);

  // Cleanup stale presence data
  useEffect(() => {
    if (!isCollaborating) return;

    const cleanup = setInterval(() => {
      setPresenceUsers(prev => {
        const newMap = new Map();
        const now = Date.now();
        
        prev.forEach((user, userId) => {
          // Keep presence for 10 seconds after last update
          if (now - user.lastSeen < 10000) {
            newMap.set(userId, user);
          } else {
            console.log('🧹 Cleaned up stale presence for user:', userId);
          }
        });
        
        return newMap;
      });
    }, 5000);

    return () => clearInterval(cleanup);
  }, [isCollaborating]);

  // Send initial presence when joining
  useEffect(() => {
    if (isCollaborating && sessionId) {
      sendPresenceUpdate({});
    }
  }, [isCollaborating, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send final presence update to clear user
      if (isCollaborating) {
        sendPresenceUpdate({
          cursor: undefined,
          typing: undefined
        });
      }
    };
  }, []);

  return {
    presenceUsers: Array.from(presenceUsers.values()),
    getParticipantColor,
    trackTextInput,
    trackCanvas,
    startTyping,
    stopTyping,
    updateCursor,
    clearCursor,
    isTyping,
    cursorPosition
  };
};