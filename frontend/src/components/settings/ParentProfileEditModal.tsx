import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { FilteredInput } from '../common/FilteredInput';

interface ParentProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentUsername: string;
  onSave: (name: string, username: string) => Promise<void>;
}

export const ParentProfileEditModal: React.FC<ParentProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentUsername,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [username, setUsername] = useState(currentUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Update name and username when props change
  useEffect(() => {
    setName(currentName);
    setUsername(currentUsername);
  }, [currentName, currentUsername]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    // Validate username format (alphanumeric, underscore, hyphen)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(name.trim(), username.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(currentName); // Reset to original name
    setUsername(currentUsername); // Reset to original username
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="account-modal-backdrop" 
      onClick={handleClose}
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
            : 'white',
          maxWidth: '500px'
        }}
      >
        {/* Header */}
        <div 
          className="account-modal-header"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
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
          <button onClick={handleClose} className="account-modal-close" style={{ color: 'white' }}>
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="account-modal-body">
          {/* Username Input */}
          <div className="account-modal-section" style={{ marginBottom: '20px' }}>
            <label 
              className="account-modal-label"
              style={{
                color: isDarkMode ? '#d1d5db' : '#374151',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                display: 'block'
              }}
            >
              Username
            </label>
            <FilteredInput
              type="text"
              value={username}
              onChange={(value) => setUsername(value.toLowerCase())}
              className="account-modal-input"
              placeholder="Enter your username"
              maxLength={30}
              style={{
                backgroundColor: isDarkMode ? '#1f2937' : 'white',
                color: isDarkMode ? 'white' : '#1f2937',
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid',
                width: '100%',
                fontSize: '14px'
              }}
            />
            <p 
              className="account-modal-char-count"
              style={{
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontSize: '12px',
                marginTop: '6px'
              }}
            >
              {username.length}/30 characters • Letters, numbers, _ and - only
            </p>
          </div>

          {/* Name Input */}
          <div className="account-modal-section">
            <label 
              className="account-modal-label"
              style={{
                color: isDarkMode ? '#d1d5db' : '#374151',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                display: 'block'
              }}
            >
              Full Name
            </label>
            <FilteredInput
              type="text"
              value={name}
              onChange={(value) => setName(value)}
              className="account-modal-input"
              placeholder="Enter your full name"
              maxLength={50}
              style={{
                backgroundColor: isDarkMode ? '#1f2937' : 'white',
                color: isDarkMode ? 'white' : '#1f2937',
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid',
                width: '100%',
                fontSize: '14px'
              }}
            />
            <p 
              className="account-modal-char-count"
              style={{
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontSize: '12px',
                marginTop: '6px'
              }}
            >
              {name.length}/50 characters
            </p>
          </div>

          {/* Info Box */}
          <div 
            className="account-modal-info"
            style={{
              backgroundColor: isDarkMode ? '#1e3a5f' : '#eff6ff',
              border: `1px solid ${isDarkMode ? '#2563eb' : '#bfdbfe'}`,
              borderRadius: '8px',
              padding: '12px',
              marginTop: '16px'
            }}
          >
            <p 
              className="account-modal-info-text"
              style={{
                color: isDarkMode ? '#93c5fd' : '#1e40af',
                fontSize: '13px',
                margin: 0
              }}
            >
              ℹ️ This name will be visible to your children and in parent dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="account-modal-error"
              style={{
                backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                border: `1px solid ${isDarkMode ? '#dc2626' : '#fecaca'}`,
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px'
              }}
            >
              <p 
                className="account-modal-error-text"
                style={{
                  color: isDarkMode ? '#fca5a5' : '#991b1b',
                  fontSize: '13px',
                  margin: 0
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
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            padding: '20px 24px',
            borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
          }}
        >
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="account-modal-button account-modal-button-cancel"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
              backgroundColor: isDarkMode ? '#374151' : 'white',
              color: isDarkMode ? '#d1d5db' : '#374151',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !name.trim() || !username.trim() || (name.trim() === currentName && username.trim() === currentUsername)}
            className="account-modal-button account-modal-button-primary"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading || !name.trim() || !username.trim() || (name.trim() === currentName && username.trim() === currentUsername) ? 'not-allowed' : 'pointer',
              opacity: isLoading || !name.trim() || !username.trim() || (name.trim() === currentName && username.trim() === currentUsername) ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
