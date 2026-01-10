import React, { useEffect, useState } from 'react';

interface XPGainPopupProps {
  xpGained: number;
  action?: string;
  show: boolean;
  onClose: () => void;
}

const XPGainPopup: React.FC<XPGainPopupProps> = ({ xpGained, action, show, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  const getActionEmoji = (actionType?: string) => {
    const emojiMap: Record<string, string> = {
      'story_created': '📖',
      'story_published': '🎉',
      'collaboration_completed': '🤝',
      'story_liked': '❤️',
      'story_commented': '💬',
      'friend_added': '👋',
      'character_created': '🎨',
      'story_read': '📚',
      'achievement_earned': '🏆',
    };
    return emojiMap[actionType || ''] || '⭐';
  };

  const getActionText = (actionType?: string) => {
    const textMap: Record<string, string> = {
      'story_created': 'Story Created!',
      'story_published': 'Story Published!',
      'collaboration_completed': 'Collaboration Complete!',
      'story_liked': 'Story Liked!',
      'story_commented': 'Great Comment!',
      'friend_added': 'New Friend!',
      'character_created': 'Character Created!',
      'story_read': 'Story Read!',
      'achievement_earned': 'Achievement Unlocked!',
    };
    return textMap[actionType || ''] || 'Great Job!';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      background: 'linear-gradient(to bottom right, #a855f7, #ec4899, #f43f5e)',
      borderRadius: '16px',
      padding: '24px',
      minWidth: '280px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
      border: '4px solid white',
      textAlign: 'center',
      color: 'white'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>
        {getActionEmoji(action)}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
        {getActionText(action)}
      </div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '9999px',
        padding: '8px 16px',
        marginTop: '8px'
      }}>
        <span style={{ fontSize: '24px' }}>⭐</span>
        <span style={{
          fontSize: '24px',
          fontWeight: '900',
          background: 'linear-gradient(to right, #9333ea, #db2777)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          +{xpGained} XP
        </span>
      </div>
      <div style={{ fontSize: '14px', marginTop: '8px', fontWeight: '500', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
        Keep going! 🚀
      </div>
    </div>
  );
};

export default XPGainPopup;
