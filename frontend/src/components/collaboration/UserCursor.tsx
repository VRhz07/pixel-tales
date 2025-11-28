import React from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/24/solid';

interface UserCursorProps {
  position: { x: number; y: number };
  username: string;
  color: string;
  tool?: string;
}

export const UserCursor: React.FC<UserCursorProps> = ({
  position,
  username,
  color,
  tool
}) => {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor Icon */}
      <CursorArrowRaysIcon
        className="w-6 h-6 drop-shadow-lg"
        style={{ color }}
      />
      
      {/* Username Label */}
      <div
        className="absolute top-6 left-2 px-2 py-1 rounded-md text-white text-xs font-semibold whitespace-nowrap shadow-lg"
        style={{ backgroundColor: color }}
      >
        {username}
        {tool && (
          <span className="ml-1 opacity-75">• {tool}</span>
        )}
      </div>
    </div>
  );
};
