import React from 'react';
import { useThemeStore } from '../../stores/themeStore';
import logoLight from '../../assets/logo.png';
import logoDark from '/logo__darkmode-toggle.png';

interface LogoProps {
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
}

const Logo: React.FC<LogoProps> = ({ 
  alt = 'Pixel Tales Logo', 
  className = '', 
  style = {},
  width,
  height
}) => {
  const { isDarkMode } = useThemeStore();
  
  // Use dark mode logo when dark mode is active, otherwise use light logo
  const logoSrc = isDarkMode ? logoDark : logoLight;
  
  // Handle aspect ratio properly
  // If both width and height are specified, use height and set width to auto to maintain aspect ratio
  // This prevents the wider dark mode logo from being compressed
  const finalStyle: React.CSSProperties = {
    objectFit: 'contain',
    maxWidth: '100%',
    ...style,
  };
  
  // If both width and height are provided, prioritize height and use auto width for proper aspect ratio
  if (width && height) {
    finalStyle.height = height;
    finalStyle.width = 'auto';
  } else {
    // If only one dimension is provided, use it
    if (width) finalStyle.width = width;
    if (height) finalStyle.height = height;
  }

  return (
    <img 
      src={logoSrc} 
      alt={alt} 
      className={className}
      style={finalStyle}
    />
  );
};

export default Logo;
