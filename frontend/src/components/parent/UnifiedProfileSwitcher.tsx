import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  UserIcon, 
  PlusIcon, 
  XMarkIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { Child } from '../../services/parentDashboard.service';
import './UnifiedProfileSwitcher.css';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface UnifiedProfileSwitcherProps {
  currentUser: {
    name: string;
    isParent: boolean;
  };
  children: Child[];
  parentName: string;
  onSwitchToProfile: (childId: number | null) => void;
  onAddChild: () => void;
  onSignOut?: () => void;
  mode?: 'compact' | 'full'; // compact = dropdown, full = Netflix modal
}

const UnifiedProfileSwitcher: React.FC<UnifiedProfileSwitcherProps> = ({
  currentUser,
  children,
  parentName,
  onSwitchToProfile,
  onAddChild,
  onSignOut,
  mode = 'compact'
}) => {
  const { playSound } = useSoundEffects();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Avatar colors for children
  const avatarColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSwitchProfile = (childId: number | null) => {
    playSound('button-click');
    setIsOpen(false);
    onSwitchToProfile(childId);
  };

  // Render Compact Dropdown
  return (
    <div className="unified-switcher" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        className="unified-switcher-trigger"
        onClick={() => {
          playSound('button-toggle');
          setIsOpen(!isOpen);
        }}
      >
        <div 
          className="unified-switcher-avatar"
          style={{ 
            background: currentUser.isParent 
              ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' 
              : avatarColors[0]
          }}
        >
          {currentUser.isParent ? (
            <UserIcon />
          ) : (
            currentUser.name.charAt(0).toUpperCase()
          )}
        </div>
        <span className="unified-switcher-name">{currentUser.name}</span>
        <ChevronDownIcon className={`unified-switcher-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="unified-switcher-dropdown">
          {/* Current Account Section */}
          <div className="unified-switcher-section">
            <div className="unified-switcher-section-title">Current Account</div>
            <div className="unified-switcher-item current">
              <div 
                className="unified-switcher-item-avatar"
                style={{ 
                  background: currentUser.isParent 
                    ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' 
                    : avatarColors[0]
                }}
              >
                {currentUser.isParent ? (
                  <UserIcon />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="unified-switcher-item-info">
                <span className="unified-switcher-item-name">{currentUser.name}</span>
                {currentUser.isParent && (
                  <span className="unified-switcher-item-badge">Parent</span>
                )}
              </div>
              <div className="unified-switcher-check">✓</div>
            </div>
          </div>

          {/* Switch To Section */}
          <div className="unified-switcher-section scrollable">
            <div className="unified-switcher-section-title">Switch To</div>
            
            {/* Show Parent if currently viewing child */}
            {!currentUser.isParent && (
              <button 
                className="unified-switcher-item"
                onClick={() => handleSwitchProfile(null)}
              >
                <div 
                  className="unified-switcher-item-avatar"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
                >
                  <UserIcon />
                </div>
                <div className="unified-switcher-item-info">
                  <span className="unified-switcher-item-name">{parentName}</span>
                  <span className="unified-switcher-item-badge">Parent</span>
                </div>
              </button>
            )}

            {/* Show all children in grid if currently parent */}
            {currentUser.isParent && children.length > 0 && (
              <div className="unified-switcher-grid">
                {children.map((child, index) => (
                  <button 
                    key={child.id}
                    className="unified-switcher-grid-item"
                    onClick={() => handleSwitchProfile(child.id)}
                  >
                    <div 
                      className="unified-switcher-item-avatar"
                      style={{ background: avatarColors[index % avatarColors.length] }}
                    >
                      {child.avatar || child.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="unified-switcher-item-name">{child.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="unified-switcher-section actions">
            <button 
              className="unified-switcher-action"
              onClick={() => {
                playSound('button-success');
                setIsOpen(false);
                onAddChild();
              }}
            >
              <PlusIcon />
              <span>Add Child</span>
            </button>
            
            {onSignOut && (
              <button 
                className="unified-switcher-action danger"
                onClick={() => {
                  playSound('button-cancel');
                  setIsOpen(false);
                  onSignOut();
                }}
              >
                <ArrowRightOnRectangleIcon />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedProfileSwitcher;
