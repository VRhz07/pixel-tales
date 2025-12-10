import React from 'react';

interface Border {
  id: string;
  name: string;
  style: 'solid' | 'gradient' | 'animated';
  color?: string;
  gradient?: string;
}

// Border configurations - should match backend
const BORDER_CONFIGS: Record<string, Border> = {
  basic: { id: 'basic', name: 'Basic', style: 'solid', color: '#9CA3AF' },
  bronze: { id: 'bronze', name: 'Bronze', style: 'solid', color: '#CD7F32' },
  silver: { id: 'silver', name: 'Silver', style: 'solid', color: '#C0C0C0' },
  gold: { id: 'gold', name: 'Gold', style: 'solid', color: '#FFD700' },
  emerald: { id: 'emerald', name: 'Emerald', style: 'solid', color: '#50C878' },
  ruby: { id: 'ruby', name: 'Ruby', style: 'solid', color: '#E0115F' },
  diamond: { id: 'diamond', name: 'Diamond', style: 'gradient', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  mythic: { id: 'mythic', name: 'Mythic', style: 'gradient', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  legendary: { id: 'legendary', name: 'Legendary', style: 'gradient', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  legendary_fire: { id: 'legendary_fire', name: 'Legendary Fire', style: 'gradient', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  ultimate: { id: 'ultimate', name: 'Ultimate', style: 'animated', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)' },
  cosmic: { id: 'cosmic', name: 'Cosmic', style: 'animated', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #a8edea 100%)' },
};

interface AvatarWithBorderProps {
  avatar: string;
  borderId?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AvatarWithBorder: React.FC<AvatarWithBorderProps> = ({
  avatar,
  borderId = 'basic',
  size = 80,
  className = '',
  style = {},
}) => {
  const border = BORDER_CONFIGS[borderId] || BORDER_CONFIGS.basic;

  const getBorderStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.5}px`,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    };

    if (border.style === 'solid') {
      return {
        ...baseStyle,
        border: `${Math.max(3, size / 20)}px solid ${border.color}`,
        boxShadow: `0 0 ${size / 10}px ${border.color}40`,
      };
    } else if (border.style === 'gradient') {
      return {
        ...baseStyle,
        background: border.gradient,
        padding: `${Math.max(3, size / 20)}px`,
      };
    } else if (border.style === 'animated') {
      return {
        ...baseStyle,
        background: border.gradient,
        padding: `${Math.max(3, size / 20)}px`,
        animation: 'shimmer 3s infinite linear',
        backgroundSize: '200% 200%',
      };
    }

    return baseStyle;
  };

  const getInnerStyle = (): React.CSSProperties => {
    if (border.style === 'solid') {
      return {};
    }

    // For gradient and animated borders, we need an inner circle
    return {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.5}px`,
      background: 'var(--bg-primary, white)',
      overflow: 'hidden',
    };
  };

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}
      </style>
      <div className={className} style={getBorderStyle()}>
        {border.style === 'solid' ? (
          avatar
        ) : (
          <div style={getInnerStyle()}>
            {avatar}
          </div>
        )}
      </div>
    </>
  );
};

export default AvatarWithBorder;
