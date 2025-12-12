import React from 'react';

interface Border {
  id: string;
  name: string;
  level: number; // User level required
  style: 'solid' | 'gradient' | 'animated';
  color?: string;
  gradient?: string;
  glowIntensity?: 'none' | 'low' | 'medium' | 'high' | 'ultra';
}

// Border configurations - should match backend
const BORDER_CONFIGS: Record<string, Border> = {
  basic: { id: 'basic', name: 'Basic', level: 1, style: 'solid', color: '#9CA3AF', glowIntensity: 'none' },
  bronze: { id: 'bronze', name: 'Bronze', level: 3, style: 'solid', color: '#CD7F32', glowIntensity: 'none' },
  silver: { id: 'silver', name: 'Silver', level: 5, style: 'solid', color: '#C0C0C0', glowIntensity: 'low' },
  gold: { id: 'gold', name: 'Gold', level: 7, style: 'solid', color: '#FFD700', glowIntensity: 'low' },
  emerald: { id: 'emerald', name: 'Emerald', level: 10, style: 'solid', color: '#50C878', glowIntensity: 'medium' },
  ruby: { id: 'ruby', name: 'Ruby', level: 12, style: 'solid', color: '#E0115F', glowIntensity: 'medium' },
  diamond: { id: 'diamond', name: 'Diamond', level: 15, style: 'gradient', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glowIntensity: 'high' },
  mythic: { id: 'mythic', name: 'Mythic', level: 20, style: 'gradient', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', glowIntensity: 'high' },
  legendary: { id: 'legendary', name: 'Legendary', level: 25, style: 'gradient', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', glowIntensity: 'ultra' },
  legendary_fire: { id: 'legendary_fire', name: 'Legendary Fire', level: 30, style: 'gradient', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', glowIntensity: 'ultra' },
  ultimate: { id: 'ultimate', name: 'Ultimate', level: 40, style: 'animated', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)', glowIntensity: 'ultra' },
  cosmic: { id: 'cosmic', name: 'Cosmic', level: 50, style: 'animated', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #a8edea 100%)', glowIntensity: 'ultra' },
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

  const getGlowEffect = (intensity: string, color?: string): string => {
    if (intensity === 'none' || !color) return '';
    
    const baseColor = color || '#ffffff';
    
    switch (intensity) {
      case 'low':
        // Subtle glow for level 5-7 (silver, gold)
        return `0 0 10px ${baseColor}60, 0 0 20px ${baseColor}40`;
      case 'medium':
        // Moderate glow for level 10-12 (emerald, ruby)
        return `0 0 15px ${baseColor}80, 0 0 30px ${baseColor}60, 0 0 45px ${baseColor}40`;
      case 'high':
        // Strong glow for level 15+ (diamond, mythic)
        return `0 0 20px ${baseColor}90, 0 0 40px ${baseColor}70, 0 0 60px ${baseColor}50, 0 0 80px ${baseColor}30`;
      case 'ultra':
        // Epic glow for level 25+ (legendary and above)
        return `0 0 25px ${baseColor}ff, 0 0 50px ${baseColor}90, 0 0 75px ${baseColor}70, 0 0 100px ${baseColor}50, 0 0 125px ${baseColor}30`;
      default:
        return '';
    }
  };

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
      const glowEffect = getGlowEffect(border.glowIntensity || 'none', border.color);
      
      return {
        ...baseStyle,
        border: `${Math.max(3, size / 20)}px solid ${border.color}`,
        boxShadow: glowEffect || undefined,
        filter: border.glowIntensity && border.glowIntensity !== 'none' ? 'brightness(1.1)' : undefined,
      };
    } else if (border.style === 'gradient') {
      const glowEffect = getGlowEffect(border.glowIntensity || 'none', '#667eea');
      
      return {
        ...baseStyle,
        background: border.gradient,
        padding: `${Math.max(3, size / 20)}px`,
        boxShadow: glowEffect,
        filter: 'brightness(1.1)',
      };
    } else if (border.style === 'animated') {
      const glowEffect = getGlowEffect(border.glowIntensity || 'ultra', '#ffecd2');
      
      return {
        ...baseStyle,
        background: border.gradient,
        padding: `${Math.max(3, size / 20)}px`,
        animation: 'shimmer 3s infinite linear, pulse-glow 2s infinite alternate',
        backgroundSize: '200% 200%',
        boxShadow: glowEffect,
        filter: 'brightness(1.2)',
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
          
          @keyframes pulse-glow {
            0% {
              filter: brightness(1.1) drop-shadow(0 0 5px currentColor);
            }
            100% {
              filter: brightness(1.3) drop-shadow(0 0 15px currentColor);
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
