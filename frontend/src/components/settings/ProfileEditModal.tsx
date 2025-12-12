import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, UserIcon, GiftIcon } from '@heroicons/react/24/outline';
import { FilteredInput } from '../common/FilteredInput';
import { RewardsModal } from './RewardsModal';
import api from '../../services/api';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string;
  onSave: (name: string, avatar: string) => Promise<void>;
}

const AVATAR_OPTIONS = [
  '📚', '✨', '🎨', '🎭', '🦄', '🐉', '🌟', '🎪',
  '🎬', '🎮', '🎯', '🎲', '🎸', '🎺', '🎻', '🎹',
  '🚀', '🛸', '🌈', '🌙', '⭐', '🌸', '🌺', '🌻',
  '🦋', '🐝', '🐢', '🦊', '🐱', '🐶', '🐼', '🐨'
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentAvatar,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [selectedBorder, setSelectedBorder] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark');
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Load current border when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrentBorder();
    }
  }, [isOpen]);

  const loadCurrentBorder = async () => {
    try {
      const response = await api.get('/users/profile/');
      if (response.data.success && response.data.profile.selected_avatar_border) {
        setSelectedBorder(response.data.profile.selected_avatar_border);
        
        // Update authStore to persist border selection
        const { setUser } = await import('../../stores/authStore').then(m => m.useAuthStore.getState());
        if (response.data.profile) {
          setUser(response.data.profile);
        }
      }
    } catch (err) {
      console.error('Error loading border:', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(name.trim(), avatar);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewardsSave = async (newAvatar: string, newBorder: string) => {
    // Update avatar and border
    const response = await api.put('/users/profile/update/', {
      avatar_emoji: newAvatar,
      selected_avatar_border: newBorder,
    });

    if (response.success) {
      setAvatar(newAvatar);
      setSelectedBorder(newBorder);
      
      // Update authStore to persist border selection immediately
      const { setUser } = await import('../../stores/authStore').then(m => m.useAuthStore.getState());
      const currentUser = await import('../../stores/authStore').then(m => m.useAuthStore.getState().user);
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          avatar: newAvatar,
          selected_avatar_border: newBorder,
        };
        setUser(updatedUser);
        
        // Also update cache immediately
        const { useCacheStore } = await import('../../stores/cacheStore');
        useCacheStore.getState().setCache('userProfile', updatedUser, 10 * 60 * 1000);
      }
    } else {
      throw new Error('Failed to update rewards');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="account-modal-backdrop" 
      onClick={onClose}
      style={{
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)'
      }}
    >
      <div 
        className="account-modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : 'white'
        }}
      >
        {/* Header */}
        <div 
          className="account-modal-header"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <div className="account-modal-header-content">
            <div 
              className="account-modal-icon"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <UserIcon className="w-5 h-5" style={{ color: 'white' }} />
            </div>
            <h2 className="account-modal-title" style={{ color: 'white' }}>Edit Profile</h2>
          </div>
          <button onClick={onClose} className="account-modal-close" style={{ color: 'white' }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="account-modal-body">
          {/* Name Input */}
          <div className="account-modal-section">
            <label 
              className="account-modal-label"
              style={{
                color: isDarkMode ? '#d1d5db' : '#374151'
              }}
            >
              Display Name
            </label>
            <FilteredInput
              type="text"
              value={name}
              onChange={(value) => setName(value)}
              className="account-modal-input"
              placeholder="Enter your name"
              maxLength={50}
              style={{
                backgroundColor: isDarkMode ? '#1f2937' : 'white',
                color: isDarkMode ? 'white' : '#1f2937',
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db'
              }}
            />
            <p 
              className="account-modal-char-count"
              style={{
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}
            >
              {name.length}/50 characters
            </p>
          </div>

          {/* Avatar Selection */}
          <div className="account-modal-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label 
                className="account-modal-label"
                style={{
                  color: isDarkMode ? '#d1d5db' : '#374151',
                  margin: 0,
                }}
              >
                Choose Avatar
              </label>
              <button
                onClick={() => setShowRewardsModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <GiftIcon style={{ width: '18px', height: '18px' }} />
                View All Rewards
              </button>
            </div>
            <div 
              className="account-modal-avatar-grid"
              style={{
                backgroundColor: isDarkMode ? '#111827' : '#f9fafb'
              }}
            >
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`account-modal-avatar-button ${
                    avatar === emoji ? 'account-modal-avatar-button-selected' : ''
                  }`}
                  style={{
                    backgroundColor: avatar === emoji 
                      ? (isDarkMode ? '#4f46e5' : '#667eea')
                      : (isDarkMode ? '#1f2937' : 'white'),
                    borderColor: isDarkMode ? '#4b5563' : '#e5e7eb'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Current Selection Preview */}
          <div className="account-modal-section">
            <div 
              className="account-modal-preview"
              style={{
                backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
                borderColor: isDarkMode ? '#374151' : '#e5e7eb'
              }}
            >
              <p 
                className="account-modal-preview-title"
                style={{
                  color: isDarkMode ? '#d1d5db' : '#4b5563'
                }}
              >
                Preview:
              </p>
              <div className="account-modal-preview-content">
                <div 
                  className="account-modal-preview-avatar"
                  style={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  {avatar}
                </div>
                <div>
                  <p 
                    className="account-modal-preview-name"
                    style={{
                      color: isDarkMode ? 'white' : '#1f2937'
                    }}
                  >
                    {name || 'Your Name'}
                  </p>
                  <p 
                    className="account-modal-preview-subtitle"
                    style={{
                      color: isDarkMode ? '#9ca3af' : '#6b7280'
                    }}
                  >
                    Young Storyteller
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="account-modal-error"
              style={{
                backgroundColor: isDarkMode ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2',
                borderColor: isDarkMode ? '#991b1b' : '#fca5a5'
              }}
            >
              <p 
                className="account-modal-error-text"
                style={{
                  color: isDarkMode ? '#fca5a5' : '#dc2626'
                }}
              >
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="account-modal-footer"
          style={{
            borderTopColor: isDarkMode ? '#374151' : '#e5e7eb'
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className="account-modal-button account-modal-button-cancel"
            style={{
              backgroundColor: isDarkMode ? '#1f2937' : 'white',
              color: isDarkMode ? '#d1d5db' : '#374151',
              borderColor: isDarkMode ? '#4b5563' : '#d1d5db'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="account-modal-button account-modal-button-primary"
            style={{
              background: isLoading || !name.trim()
                ? (isDarkMode ? '#4b5563' : '#9ca3af')
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              opacity: isLoading || !name.trim() ? 0.5 : 1
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Rewards Modal */}
      <RewardsModal
        isOpen={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        currentAvatar={avatar}
        currentBorder={selectedBorder}
        onSave={handleRewardsSave}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};
