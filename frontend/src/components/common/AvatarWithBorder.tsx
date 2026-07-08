import React, { useState, useEffect } from 'react';

interface Border {
  id: string;
  name: string;
  level: number;
  style: 'solid' | 'gradient' | 'animated';
  color?: string;
  darkColor?: string; // Optional dark-mode override for border color
  gradient?: string;
  glowIntensity?: 'none' | 'low' | 'medium' | 'high' | 'ultra';
}

// Border configurations - should match backend
const BORDER_CONFIGS: Record<string, Border> = {
  basic:         { id: 'basic',         name: 'Basic',          level: 1,  style: 'solid',    color: '#D1D5DB', darkColor: '#4B5563', glowIntensity: 'none' },
  bronze:        { id: 'bronze',        name: 'Bronze',         level: 3,  style: 'solid',    color: '#CD7F32',                       glowIntensity: 'none' },
  silver:        { id: 'silver',        name: 'Silver',         level: 5,  style: 'solid',    color: '#C0C0C0',                       glowIntensity: 'low'  },
  gold:          { id: 'gold',          name: 'Gold',           level: 7,  style: 'solid',    color: '#FFD700',                       glowIntensity: 'low'  },
  emerald:       { id: 'emerald',       name: 'Emerald',        level: 10, style: 'solid',    color: '#50C878',                       glowIntensity: 'medium' },
  ruby:          { id: 'ruby',          name: 'Ruby',           level: 12, style: 'solid',    color: '#E0115F',                       glowIntensity: 'medium' },
  diamond:       { id: 'diamond',       name: 'Diamond',        level: 15, style: 'gradient', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glowIntensity: 'high' },
  mythic:        { id: 'mythic',        name: 'Mythic',         level: 20, style: 'gradient', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', glowIntensity: 'high' },
  legendary:     { id: 'legendary',     name: 'Legendary',      level: 25, style: 'gradient', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', glowIntensity: 'ultra' },
  legendary_fire:{ id: 'legendary_fire',name: 'Legendary Fire', level: 30, style: 'gradient', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', glowIntensity: 'ultra' },
  ultimate:      { id: 'ultimate',      name: 'Ultimate',       level: 40, style: 'animated', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)', glowIntensity: 'ultra' },
  cosmic:        { id: 'cosmic',        name: 'Cosmic',         level: 50, style: 'animated', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #a8edea 100%)', glowIntensity: 'ultra' },
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

  // Reactively track the .dark class on <html> so all colors adapt when theme toggles
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const innerFg = isDark ? '#F9FAFB' : '#1F2937';

  const getGlowEffect = (intensity: string, color?: string): string => {
    if (intensity === 'none' || !color) return '';
    const c = color;
    switch (intensity) {
      case 'low':    return `0 0 10px ${c}60, 0 0 20px ${c}40`;
      case 'medium': return `0 0 15px ${c}80, 0 0 30px ${c}60, 0 0 45px ${c}40`;
      case 'high':   return `0 0 20px ${c}90, 0 0 40px ${c}70, 0 0 60px ${c}50, 0 0 80px ${c}30`;
      case 'ultra':  return `0 0 25px ${c}ff, 0 0 50px ${c}90, 0 0 75px ${c}70, 0 0 100px ${c}50, 0 0 125px ${c}30`;
      default:       return '';
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
      position: 'relative',
      boxSizing: 'border-box',
      flexShrink: 0,
      ...style,
    };

    if (border.style === 'solid') {
      const glowEffect = getGlowEffect(border.glowIntensity || 'none', border.color);
      const borderWidth = Math.max(3, size / 20);
      // Use darkColor override when in dark mode (e.g. basic border goes from light-gray → dark-gray)
      const borderColor = isDark && border.darkColor ? border.darkColor : border.color;
      return {
        ...baseStyle,
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: glowEffect || undefined,
        filter: border.glowIntensity && border.glowIntensity !== 'none' ? 'brightness(1.1)' : undefined,
      };
    }

    if (border.style === 'gradient') {
      const glowEffect = getGlowEffect(border.glowIntensity || 'none', '#667eea');
      return {
        ...baseStyle,
        background: border.gradient,
        padding: `${Math.max(3, size / 20)}px`,
        boxShadow: glowEffect,
        filter: 'brightness(1.1)',
      };
    }

    if (border.style === 'animated') {
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

  const innerCircleStyle = (): React.CSSProperties => ({
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.5}px`,
    fontWeight: 700,
    color: innerFg,
    background: 'transparent',
    overflow: 'hidden',  // clip emoji inside the circle — on inner div only, NOT outer
    lineHeight: 1,
    userSelect: 'none',
  });


  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-glow {
          0%   { filter: brightness(1.1) drop-shadow(0 0 5px currentColor); }
          100% { filter: brightness(1.3) drop-shadow(0 0 15px currentColor); }
        }
      `}</style>
      <div className={className} style={getBorderStyle()}>
        {/* Both solid and gradient/animated use the same inner circle — keeps code DRY */}
        <div style={innerCircleStyle()}>
          {avatar}
        </div>
      </div>
    </>
  );
};

export default AvatarWithBorder;
