import React, { useEffect, useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/solid';

export interface PresenceUser {
  id: number;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
  };
  typing?: {
    elementId: string;
    elementType: 'title' | 'text' | 'canvas';
    pageIndex?: number;
  };
  lastSeen: number;
}

interface PresenceSystemProps {
  participants: any[];
  currentUserId: number;
  onPresenceUpdate?: (presence: PresenceUser) => void;
}

// Predefined colors for participants
const PRESENCE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FECA57', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Light Blue
  '#5F27CD', // Purple
];

export const PresenceSystem: React.FC<PresenceSystemProps> = ({
  participants,
  currentUserId,
  onPresenceUpdate
}) => {
  const [presenceData, setPresenceData] = useState<Map<number, PresenceUser>>(new Map());

  // Assign colors to participants
  const getParticipantColor = (userId: number): string => {
    const index = participants.findIndex(p => p.id === userId);
    return PRESENCE_COLORS[index % PRESENCE_COLORS.length];
  };

  // Update participant presence
  const updatePresence = (userId: number, updates: Partial<PresenceUser>) => {
    setPresenceData(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(userId) || {
        id: userId,
        name: participants.find(p => p.id === userId)?.username || participants.find(p => p.id === userId)?.name || 'User',
        color: getParticipantColor(userId),
        lastSeen: Date.now()
      };
      
      const updated = { ...existing, ...updates, lastSeen: Date.now() };
      newMap.set(userId, updated);
      
      if (onPresenceUpdate) {
        onPresenceUpdate(updated);
      }
      
      return newMap;
    });
  };

  // Clean up stale presence data
  useEffect(() => {
    const cleanup = setInterval(() => {
      setPresenceData(prev => {
        const newMap = new Map();
        const now = Date.now();
        
        prev.forEach((presence, userId) => {
          // Keep presence for 30 seconds after last update
          if (now - presence.lastSeen < 30000) {
            newMap.set(userId, presence);
          }
        });
        
        return newMap;
      });
    }, 5000); // Cleanup every 5 seconds

    return () => clearInterval(cleanup);
  }, []);

  return {
    presenceData: Array.from(presenceData.values()),
    updatePresence,
    getParticipantColor
  };
};

// Typing indicator component
export const TypingIndicator: React.FC<{
  user: PresenceUser;
  position?: { x: number; y: number };
}> = ({ user, position }) => {
  return (
    <div
      className="typing-indicator"
      style={{
        position: 'absolute',
        left: position?.x || 0,
        top: position?.y || 0,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: user.color,
        color: 'white',
        padding: '2px 6px',
        borderRadius: '12px',
        fontSize: '10px',
        fontWeight: '500',
        zIndex: 1000,
        pointerEvents: 'none',
        transform: 'translateY(-100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <UserCircleIcon className="w-3 h-3" />
      <span>{user.name}</span>
      <div className="typing-dots" style={{ display: 'flex', gap: '1px' }}>
        <div style={{ 
          width: '2px', 
          height: '2px', 
          backgroundColor: 'white', 
          borderRadius: '50%',
          animation: 'typingDot 1.4s infinite ease-in-out'
        }} />
        <div style={{ 
          width: '2px', 
          height: '2px', 
          backgroundColor: 'white', 
          borderRadius: '50%',
          animation: 'typingDot 1.4s infinite ease-in-out 0.2s'
        }} />
        <div style={{ 
          width: '2px', 
          height: '2px', 
          backgroundColor: 'white', 
          borderRadius: '50%',
          animation: 'typingDot 1.4s infinite ease-in-out 0.4s'
        }} />
      </div>
    </div>
  );
};

// Text Caret indicator component (for text fields) - calculates position from character index
export const TextCaretIndicator: React.FC<{
  user: PresenceUser;
  elementId: string;
  cursorPos: number;
  textValue: string;
}> = ({ user, elementId, cursorPos, textValue }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    // Find the target element by elementId
    const targetElement = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLInputElement | HTMLTextAreaElement;
    if (!targetElement) {
      console.warn(`TextCaretIndicator: Could not find element with elementId: ${elementId}`);
      return;
    }

    // Calculate visual position from character position
    const calculateVisualPosition = () => {
      try {
        // Create a temporary span to measure text width accurately
        const tempSpan = document.createElement('span');
        const computedStyle = window.getComputedStyle(targetElement);
        
        // Copy all text styling from the target element
        tempSpan.style.font = computedStyle.font;
        tempSpan.style.fontSize = computedStyle.fontSize;
        tempSpan.style.fontFamily = computedStyle.fontFamily;
        tempSpan.style.fontWeight = computedStyle.fontWeight;
        tempSpan.style.letterSpacing = computedStyle.letterSpacing;
        tempSpan.style.wordSpacing = computedStyle.wordSpacing;
        tempSpan.style.lineHeight = computedStyle.lineHeight;
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.top = '-9999px';
        tempSpan.style.whiteSpace = 'pre';

        // Get text up to cursor position
        const textToCursor = textValue.substring(0, cursorPos);
        tempSpan.textContent = textToCursor;

        document.body.appendChild(tempSpan);
        const textWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);

        // Get element positioning
        const rect = targetElement.getBoundingClientRect();
        const paddingLeft = parseInt(computedStyle.paddingLeft) || 8;
        const paddingTop = parseInt(computedStyle.paddingTop) || 8;

        // Calculate position relative to the target element
        const x = Math.min(textWidth + paddingLeft, rect.width - 10);
        const y = paddingTop + (targetElement.tagName === 'TEXTAREA' ? 2 : 0);

        setPosition({ x, y });
      } catch (error) {
        console.error('Error calculating caret position:', error);
        setPosition({ x: 10, y: 10 }); // Fallback position
      }
    };

    calculateVisualPosition();

    // Recalculate on text change or element resize
    const resizeObserver = new ResizeObserver(calculateVisualPosition);
    resizeObserver.observe(targetElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementId, cursorPos, textValue]);

  return (
    <div
      className="text-caret-indicator"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}
    >
      {/* Text caret line */}
      <div
        style={{
          width: '2px',
          height: '18px',
          backgroundColor: user.color,
          borderRadius: '1px',
          animation: 'textCaretBlink 1s infinite',
          boxShadow: `0 0 4px ${user.color}30`
        }}
      />
      
      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          left: '4px',
          top: '-24px',
          backgroundColor: user.color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transform: 'translateX(-50%)'
        }}
      >
        {user.name}
      </div>
    </div>
  );
};

// Cursor indicator component (for mouse/general use)
export const CursorIndicator: React.FC<{
  user: PresenceUser;
  x: number;
  y: number;
}> = ({ user, x, y }) => {
  return (
    <div
      className="cursor-indicator"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 1000,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M2 2 L18 8 L8 12 L6 18 L2 2 Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: '0px',
          backgroundColor: user.color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {user.name}
      </div>
    </div>
  );
};

// Touch indicator for mobile (larger than cursor)
export const TouchIndicator: React.FC<{
  user: PresenceUser;
  x: number;
  y: number;
}> = ({ user, x, y }) => {
  return (
    <div
      className="touch-indicator"
      style={{
        position: 'absolute',
        left: x - 15,
        top: y - 15,
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        border: `3px solid ${user.color}`,
        backgroundColor: `${user.color}30`, // 30% opacity
        pointerEvents: 'none',
        zIndex: 999,
        animation: 'touchRipple 0.6s ease-out'
      }}
    >
      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          left: '35px',
          top: '0px',
          backgroundColor: user.color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {user.name}
      </div>
    </div>
  );
};

// CSS animations (add to your global CSS)
const PRESENCE_STYLES = `
@keyframes typingDot {
  0%, 20% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  80%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
}

@keyframes touchRipple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

@keyframes textCaretBlink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

.typing-indicator {
  transition: all 0.2s ease;
}

.cursor-indicator {
  transition: left 0.1s ease, top 0.1s ease;
}

.text-caret-indicator {
  transition: left 0.1s ease, top 0.1s ease;
}

.touch-indicator {
  transition: left 0.1s ease, top 0.1s ease;
}
`;

// Export styles to be added to CSS
export { PRESENCE_STYLES };