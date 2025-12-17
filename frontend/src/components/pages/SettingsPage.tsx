import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  QuestionMarkCircleIcon,
  SpeakerWaveIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  SwatchIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Logo from '../common/Logo';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useAccountSwitchStore } from '../../stores/accountSwitchStore';
import { ProfileEditModal } from '../settings/ProfileEditModal';
import { EmailChangeModal } from '../settings/EmailChangeModal';
import { PasswordUpdateModal } from '../settings/PasswordUpdateModal';
import { ParentPasswordVerificationModal } from '../settings/ParentPasswordVerificationModal';
import { CustomDropdown } from '../common/CustomDropdown';
import { storage } from '../../utils/storage';
import { authService } from '../../services/auth.service';
import { api } from '../../services/api';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import soundService, { BackgroundMusicTrack } from '../../services/soundService';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, signOut } = useAuthStore();
  const { theme, setTheme, animationsEnabled, setAnimationsEnabled } = useThemeStore();
  const { language, setLanguage, t } = useI18nStore();
  const { setActiveAccount } = useAccountSwitchStore();
  const { playButtonClick, playButtonToggle } = useSoundEffects();
  const isAnonymous = currentUser?.id === 'anonymous' || !isAuthenticated;
  
  // Sound settings state
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [soundVolume, setSoundVolume] = useState(soundService.getGlobalVolume());
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(soundService.isBackgroundMusicEnabled());
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(soundService.getBackgroundMusicVolume());
  const [selectedTrack, setSelectedTrack] = useState<BackgroundMusicTrack>(soundService.getSelectedMusicTrack());
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(soundService.getCurrentTrackName());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showParentPasswordModal, setShowParentPasswordModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check if viewing as child (parent session exists)
  const [isViewingAsChild, setIsViewingAsChild] = useState(false);
  const [parentName, setParentName] = useState('');
  
  useEffect(() => {
    const parentSession = storage.getItemSync('parent_session');
    if (parentSession) {
      try {
        const parentInfo = JSON.parse(parentSession);
        setIsViewingAsChild(true);
        setParentName(parentInfo.name || 'Parent Dashboard');
      } catch (e) {
        console.error('Error parsing parent session:', e);
      }
    }
  }, []);
  
  // Debug logging
  useEffect(() => {
    console.log('SettingsPage - User:', currentUser);
    console.log('SettingsPage - isAuthenticated:', isAuthenticated);
    console.log('SettingsPage - isAnonymous:', isAnonymous);
  }, [currentUser, isAuthenticated, isAnonymous]);

  // Show success message temporarily
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if API call fails, clear local state and redirect
      navigate('/auth');
    }
  };

  const handleDeleteAccount = () => {
    console.log('Delete account clicked, showing modal');
    console.log('Current showDeleteConfirm state:', showDeleteConfirm);
    setShowDeleteConfirm(true);
    console.log('After setState - showDeleteConfirm should be true');
  };

  const confirmDeleteAccount = async () => {
    try {
      // TODO: Call delete account API endpoint when available
      // await authService.deleteAccount();
      
      // For now, just sign out
      await signOut();
      setShowDeleteConfirm(false);
      navigate('/auth');
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Failed to delete account. Please try again or contact support.');
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
  };
  
  const handleBackToParentDashboard = () => {
    // Show password verification modal instead of switching directly
    setShowParentPasswordModal(true);
  };
  
  const handleParentPasswordVerified = () => {
    try {
      // Retrieve parent session from storage
      const parentSessionStr = storage.getItemSync('parent_session');
      if (!parentSessionStr) {
        console.error('No parent session found');
        return;
      }
      
      const parentSession = JSON.parse(parentSessionStr);
      
      // Restore parent tokens
      if (parentSession.tokens) {
        localStorage.setItem('access_token', parentSession.tokens.access);
        localStorage.setItem('refresh_token', parentSession.tokens.refresh);
      }
      
      // Restore parent user data
      if (parentSession.userData) {
        localStorage.setItem('user_data', JSON.stringify(parentSession.userData));
      }
      
      // Remove parent session
      storage.removeItemSync('parent_session');
      
      // Update account switch store to parent mode
      setActiveAccount('parent');
      
      // Use window.location.href for full page reload with navigation
      window.location.href = '/parent-dashboard';
    } catch (error) {
      console.error('Error switching back to parent view:', error);
      alert('Failed to switch back to parent view. Please try again.');
    }
  };
  
  // Profile update handler
  const handleProfileUpdate = async (name: string, avatar: string) => {
    try {
      await authService.updateProfile({ name, avatar });
      
      // Update the store immediately with setUser
      const { setUser } = useAuthStore.getState();
      if (currentUser) {
        setUser({
          ...currentUser,
          name: name,
          avatar: avatar,
        });
      }
      
      setSuccessMessage('Profile updated successfully!');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  // Email change handler
  const handleEmailChange = async (newEmail: string, password: string) => {
    try {
      await authService.changeEmail(newEmail, password);
      await useAuthStore.getState().loadUserProfile();
      setSuccessMessage('Email updated successfully! Please check your inbox to verify.');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update email');
    }
  };
  
  // Password update handler
  const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccessMessage('Password updated successfully!');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update password');
    }
  };


  return (
    <>
    <div className="min-h-screen settings-page">
      {/* Page Header */}
      <div className="settings-header px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAnonymous ? 'Manage app preferences' : 'Manage your account and app preferences'}
        </p>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <span className="text-green-600 text-xl">✓</span>
          <p className="text-sm text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Anonymous User Notice */}
      {isAnonymous && (
        <div className="mx-6 mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900 font-medium mb-2">
            👋 Browsing as Guest
          </p>
          <p className="text-xs text-purple-700 mb-3">
            Sign up for a free account to access account settings, privacy controls, and social features.
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="text-xs px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Create Free Account
          </button>
        </div>
      )}


      {/* Account Section - Only for authenticated non-child users */}
      {!isAnonymous && currentUser?.user_type !== 'child' && (
        <>
          <div className="settings-section-header">
            <h2>
              <UserIcon className="settings-section-icon" />
              Account
            </h2>
          </div>

          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-content">
                <div className="settings-item-title">Profile Information</div>
                <div className="settings-item-subtitle">
                  {currentUser?.name || 'Update your personal details'}
                </div>
              </div>
              <button 
                onClick={() => {
                  console.log('Profile button clicked');
                  setShowProfileModal(true);
                }}
                className="settings-button-secondary"
              >
                Change
              </button>
            </div>

            <div className="settings-item">
              <div className="settings-item-content">
                <div className="settings-item-title">Email Address</div>
                <div className="settings-item-subtitle">{currentUser?.email || 'user@example.com'}</div>
              </div>
              <button 
                onClick={() => {
                  console.log('Email button clicked');
                  setShowEmailModal(true);
                }}
                className="settings-button-secondary"
              >
                Change
              </button>
            </div>

            <div className="settings-item">
              <div className="settings-item-content">
                <div className="settings-item-title">Password</div>
                <div className="settings-item-subtitle">••••••••</div>
              </div>
              <button 
                onClick={() => {
                  console.log('Password button clicked');
                  setShowPasswordModal(true);
                }}
                className="settings-button-secondary"
              >
                Update
              </button>
            </div>
          </div>
        </>
      )}

      {/* Appearance Section */}
      <div className="settings-section-header">
        <h2>
          <SwatchIcon className="settings-section-icon" />
          Appearance
        </h2>
      </div>

      <div className="settings-card">
        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-title">Dark Mode</div>
            <div className="settings-item-subtitle">
              {theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`settings-toggle-container ${theme === 'dark' ? 'settings-toggle-enabled' : 'settings-toggle-disabled'}`}
            aria-label="Toggle dark mode"
          >
            <div className={`settings-toggle-thumb ${theme === 'dark' ? 'settings-toggle-thumb-enabled' : 'settings-toggle-thumb-disabled'}`}></div>
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-title">Animations</div>
            <div className="settings-item-subtitle">
              {animationsEnabled ? 'Smooth animations and transitions' : 'Reduced motion for better performance'}
            </div>
          </div>
          <button
            onClick={() => setAnimationsEnabled(!animationsEnabled)}
            className={`settings-toggle-container ${animationsEnabled ? 'settings-toggle-enabled' : 'settings-toggle-disabled'}`}
            aria-label="Toggle animations"
          >
            <div className={`settings-toggle-thumb ${animationsEnabled ? 'settings-toggle-thumb-enabled' : 'settings-toggle-thumb-disabled'}`}></div>
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-title">Language / Wika</div>
            <div className="settings-item-subtitle">
              {language === 'en' && 'English - App interface in English'}
              {language === 'tl' && 'Tagalog - Interface sa Tagalog'}
            </div>
          </div>
          <CustomDropdown
            options={[
              { value: 'en', label: '🇺🇸 English' },
              { value: 'tl', label: '🇵🇭 Tagalog' }
            ]}
            value={language}
            onChange={(value) => {
              playButtonClick();
              setLanguage(value as 'en' | 'tl');
            }}
            className="settings-select-compact"
          />
        </div>

        {/* Sound Effects */}
        <div className="settings-item">
          <div className="settings-item-content">
            <div className="settings-item-title">Sound Effects</div>
            <div className="settings-item-subtitle">
              {soundEnabled ? 'UI sounds and haptic feedback enabled' : 'Sounds and haptics disabled'}
            </div>
          </div>
          <button
            onClick={() => {
              const newValue = !soundEnabled;
              setSoundEnabled(newValue);
              soundService.setEnabled(newValue);
              if (newValue) {
                setTimeout(() => playButtonToggle(), 100);
              }
            }}
            className={`settings-toggle-container ${soundEnabled ? 'settings-toggle-enabled' : 'settings-toggle-disabled'}`}
            aria-label="Toggle sound effects"
          >
            <div className={`settings-toggle-thumb ${soundEnabled ? 'settings-toggle-thumb-enabled' : 'settings-toggle-thumb-disabled'}`}></div>
          </button>
        </div>

        {/* Sound Volume - Only show when sounds are enabled */}
        {soundEnabled && (
          <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="settings-item-content" style={{ marginBottom: '1rem' }}>
              <div className="settings-item-title">Sound Volume</div>
              <div className="settings-item-subtitle">
                Adjust the volume of sound effects ({Math.round(soundVolume * 100)}%)
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setSoundVolume(newVolume);
                  soundService.setGlobalVolume(newVolume);
                }}
                onMouseUp={() => playButtonClick()}
                onTouchEnd={() => playButtonClick()}
                style={{
                  flex: 1,
                  accentColor: '#8b5cf6',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '1.25rem' }}>🔊</span>
            </div>
          </div>
        )}

        {/* Background Music - Only for child accounts */}
        {!isAnonymous && currentUser?.user_type === 'child' && (
          <>
            <div className="settings-item">
              <div className="settings-item-content">
                <div className="settings-item-title">🎵 Background Music</div>
                <div className="settings-item-subtitle">
                  {backgroundMusicEnabled ? 'Playful music while you create' : 'Music disabled'}
                </div>
              </div>
              <button
                onClick={() => {
                  const newValue = !backgroundMusicEnabled;
                  setBackgroundMusicEnabled(newValue);
                  soundService.setBackgroundMusicEnabled(newValue);
                  playButtonToggle();
                  
                  if (newValue) {
                    soundService.startBackgroundMusic();
                  } else {
                    soundService.stopBackgroundMusic();
                  }
                }}
                className={`settings-toggle-container ${backgroundMusicEnabled ? 'settings-toggle-enabled' : 'settings-toggle-disabled'}`}
                aria-label="Toggle background music"
              >
                <div className={`settings-toggle-thumb ${backgroundMusicEnabled ? 'settings-toggle-thumb-enabled' : 'settings-toggle-thumb-disabled'}`}></div>
              </button>
            </div>

            {/* Background Music Volume - Only show when music is enabled */}
            {backgroundMusicEnabled && (
              <>
                <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div className="settings-item-content" style={{ marginBottom: '1rem' }}>
                    <div className="settings-item-title">Music Volume</div>
                    <div className="settings-item-subtitle">
                      Adjust background music volume ({Math.round(backgroundMusicVolume * 100)}%)
                    </div>
                  </div>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎵</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={backgroundMusicVolume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        setBackgroundMusicVolume(newVolume);
                        soundService.setBackgroundMusicVolume(newVolume);
                      }}
                      style={{
                        flex: 1,
                        accentColor: '#10b981',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '1.25rem' }}>🎶</span>
                  </div>
                </div>

                {/* Track Selection */}
                <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', paddingTop: '1.5rem', borderTop: theme === 'dark' ? '1px solid #3d3349' : '1px solid #e5e7eb' }}>
                  <div className="settings-item-content" style={{ marginBottom: '0.75rem' }}>
                    <div className="settings-item-title">Choose Music Track</div>
                    {currentTrackName && (
                      <div className="settings-item-subtitle" style={{ color: theme === 'dark' ? '#a78bfa' : '#8b5cf6', fontStyle: 'italic' }}>
                        ♪ Now playing: {currentTrackName}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    width: '100%', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '0.5rem',
                    padding: '0 1rem'
                  }}>
                    {soundService.getAvailableTracks().map((track) => (
                      <button
                        key={track}
                        onClick={() => {
                          playButtonClick();
                          setSelectedTrack(track);
                          soundService.setBackgroundMusicTrack(track);
                          // Update current track name after a short delay
                          setTimeout(() => {
                            setCurrentTrackName(soundService.getCurrentTrackName());
                          }, 1000);
                        }}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: selectedTrack === track
                            ? (theme === 'dark' ? '#6d28d9' : '#a78bfa')
                            : (theme === 'dark' ? '#3d3349' : '#f3f4f6'),
                          border: `2px solid ${
                            selectedTrack === track
                              ? (theme === 'dark' ? '#7c3aed' : '#8b5cf6')
                              : (theme === 'dark' ? '#4b4560' : '#d1d5db')
                          }`,
                          borderRadius: '0.5rem',
                          color: selectedTrack === track
                            ? '#ffffff'
                            : (theme === 'dark' ? '#e5e7eb' : '#374151'),
                          fontSize: '0.75rem',
                          fontWeight: selectedTrack === track ? '600' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTrack !== track) {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#4b4560' : '#e5e7eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTrack !== track) {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#3d3349' : '#f3f4f6';
                          }
                        }}
                      >
                        {soundService.getTrackDisplayName(track)}
                      </button>
                    ))}
                  </div>

                  <p style={{
                    fontSize: '0.75rem',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    marginTop: '0.75rem',
                    lineHeight: '1.5',
                    padding: '0 1rem',
                    textAlign: 'center',
                  }}>
                    💡 Select "Random" to hear a different song each time, or choose your favorite track!
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Action Buttons - Only show for authenticated non-child users */}
      {!isAnonymous && currentUser?.user_type !== 'child' && (
        <div className="settings-action-buttons">
          <button 
            onClick={handleSignOut}
            className="settings-sign-out-button"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span>Sign Out</span>
          </button>

          <button 
            onClick={handleDeleteAccount}
            className="settings-button-destructive w-full px-6 py-3"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      )}

      {/* Child Account Notice - Show for child accounts */}
      {!isAnonymous && currentUser?.user_type === 'child' && (
        <div className="mx-6 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
            👶 Child Account
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Your account is managed by your parent or teacher. They can update your profile, change your password, and manage other account settings through their dashboard.
          </p>
        </div>
      )}

      {/* Anonymous User Message */}
      {isAnonymous && (
        <div className="mx-6 mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900 font-medium mb-2">
            📝 Sign up to save your settings
          </p>
          <p className="text-xs text-purple-700">
            Create a free account to customize your experience and access all features.
          </p>
        </div>
      )}

      {/* Back to Parent Dashboard - Only when viewing as child - BEFORE APP INFO */}
      {isViewingAsChild && !isAnonymous && (
        <div 
          className="mx-6 mb-6 p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '2px solid rgba(102, 126, 234, 0.3)',
          }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: '#667eea' }}>
            👨‍👩‍👧‍👦 Viewing as Child Account
          </p>
          <p className="text-xs mb-3" style={{ color: '#764ba2', opacity: 0.9 }}>
            You are currently viewing the app from your child's perspective. Click below to return to your parent dashboard.
          </p>
          <button
            onClick={handleBackToParentDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to {parentName}
          </button>
        </div>
      )}

      {/* App Info Footer */}
      <div className="settings-app-info">
        <Logo className="settings-app-icon" width="150px" height="150px" />
        <div className="settings-app-version">Version 1.0.0</div>
        <div className="settings-app-tagline">
          <span>Made with</span>
          <span>✨</span>
          <span>for young creators</span>
        </div>
      </div>

    </div>

    {/* Account Settings Modals */}
    {console.log('Modal states:', { showProfileModal, showEmailModal, showPasswordModal })}
    {showProfileModal && (
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentName={currentUser?.name || ''}
        currentAvatar={currentUser?.avatar || '📚'}
        onSave={handleProfileUpdate}
      />
    )}

    {showEmailModal && (
      <EmailChangeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        currentEmail={currentUser?.email || ''}
        onSave={handleEmailChange}
      />
    )}
    
    {showPasswordModal && (
      <PasswordUpdateModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSave={handlePasswordUpdate}
      />
    )}
    
    {showParentPasswordModal && createPortal(
      <ParentPasswordVerificationModal
        isOpen={showParentPasswordModal}
        onClose={() => setShowParentPasswordModal(false)}
        onVerified={handleParentPasswordVerified}
        parentName={parentName}
      />,
      document.body
    )}
    
    {/* Delete Account Confirmation Modal - Using Portal to render at document root */}
    {showDeleteConfirm && createPortal(
      <div 
        className="delete-modal-backdrop"
        onClick={cancelDeleteAccount}
      >
        <div 
          className="delete-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Warning Icon */}
          <div className="delete-modal-icon">
            <div className="delete-modal-icon-circle">
              <TrashIcon />
            </div>
          </div>

          {/* Title */}
          <h3 className="delete-modal-title">
            Delete Account?
          </h3>

          {/* Warning Message */}
          <div className="delete-modal-warning">
            <p className="delete-modal-warning-title">
              ⚠️ This action cannot be undone!
            </p>
            <p className="delete-modal-warning-text">
              All your data will be permanently deleted and cannot be recovered.
            </p>
          </div>

          {/* What will be deleted */}
          <div className="delete-modal-content">
            <p className="delete-modal-content-title">
              The following will be permanently deleted:
            </p>
            <div className="delete-modal-list">
              <div className="delete-modal-list-item">
                <span className="delete-modal-list-bullet">•</span>
                <span>All your stories and characters</span>
              </div>
              <div className="delete-modal-list-item">
                <span className="delete-modal-list-bullet">•</span>
                <span>Progress, achievements, and statistics</span>
              </div>
              <div className="delete-modal-list-item">
                <span className="delete-modal-list-bullet">•</span>
                <span>Account settings and preferences</span>
              </div>
              <div className="delete-modal-list-item">
                <span className="delete-modal-list-bullet">•</span>
                <span>Friends and social connections</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="delete-modal-actions">
            <button
              onClick={cancelDeleteAccount}
              className="delete-modal-button delete-modal-button-cancel"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteAccount}
              className="delete-modal-button delete-modal-button-delete"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default SettingsPage;
