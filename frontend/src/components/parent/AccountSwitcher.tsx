import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Child } from '../../services/parentDashboard.service';
import './AccountSwitcher.css';

interface AccountSwitcherProps {
  currentUser: {
    name: string;
    isParent: boolean;
  };
  children: Child[];
  onSwitchToProfile: (childId: number | null) => void;
  onManageProfiles: () => void;
  onSignOut?: () => void;
}

const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  currentUser,
  children,
  onSwitchToProfile,
  onManageProfiles,
  onSignOut
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const avatarColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];

  const handleSwitchProfile = (childId: number | null) => {
    setIsOpen(false);
    onSwitchToProfile(childId);
  };

  return (
    <div className="account-switcher" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        className="account-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="account-switcher-avatar"
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
        <span className="account-switcher-name">{currentUser.name}</span>
        <ChevronDownIcon className={`account-switcher-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="account-switcher-dropdown">
          {/* Current Account Section */}
          <div className="account-switcher-section">
            <div className="account-switcher-section-title">Current Account</div>
            <div className="account-switcher-item current">
              <div 
                className="account-switcher-item-avatar"
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
              <div className="account-switcher-item-info">
                <span className="account-switcher-item-name">{currentUser.name}</span>
                {currentUser.isParent && (
                  <span className="account-switcher-item-badge">Parent</span>
                )}
              </div>
              <div className="account-switcher-check">✓</div>
            </div>
          </div>

          {/* Switch To Section */}
          <div className="account-switcher-section">
            <div className="account-switcher-section-title">Switch To</div>
            
            {/* Parent Profile (if currently viewing child) */}
            {!currentUser.isParent && (
              <button 
                className="account-switcher-item"
                onClick={() => handleSwitchProfile(null)}
              >
                <div 
                  className="account-switcher-item-avatar"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
                >
                  <UserIcon />
                </div>
                <div className="account-switcher-item-info">
                  <span className="account-switcher-item-name">Parent Dashboard</span>
                  <span className="account-switcher-item-badge">Parent</span>
                </div>
              </button>
            )}

            {/* Child Profiles (if currently parent) */}
            {currentUser.isParent && children.map((child, index) => (
              <button 
                key={child.id}
                className="account-switcher-item"
                onClick={() => handleSwitchProfile(child.id)}
              >
                <div 
                  className="account-switcher-item-avatar"
                  style={{ background: avatarColors[index % avatarColors.length] }}
                >
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div className="account-switcher-item-info">
                  <span className="account-switcher-item-name">{child.name}</span>
                  {child.age && (
                    <span className="account-switcher-item-meta">Age {child.age}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Actions Section */}
          <div className="account-switcher-section">
            <button 
              className="account-switcher-action"
              onClick={() => {
                setIsOpen(false);
                onManageProfiles();
              }}
            >
              <UserIcon />
              <span>Manage Profiles</span>
            </button>
            
            {onSignOut && (
              <button 
                className="account-switcher-action danger"
                onClick={() => {
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

export default AccountSwitcher;
