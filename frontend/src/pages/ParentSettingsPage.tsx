import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  EnvelopeIcon,
  TrashIcon,
  BookOpenIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useI18nStore } from '../stores/i18nStore';
import { PasswordUpdateModal } from '../components/settings/PasswordUpdateModal';
import { authService } from '../services/auth.service';
import ParentBottomNav from '../components/navigation/ParentBottomNav';
import './ParentSettingsPage.css';

const ParentSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage, t } = useI18nStore();
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'privacy' | 'appearance'>('account');
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Notification preferences state
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [goalCompletion, setGoalCompletion] = useState(true);
  const [realtimeUpdates, setRealtimeUpdates] = useState(false);
  
  // Privacy preferences state
  const [shareUsageData, setShareUsageData] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      signOut();
      navigate('/auth');
    }
  };

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSuccessMessage('Password updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update password');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const confirmDeleteAccount = async () => {
    setDeleteError('');
    
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion');
      return;
    }

    setIsDeleting(true);
    
    try {
      await authService.deleteAccount(deletePassword);
      setShowDeleteConfirm(false);
      navigate('/auth');
    } catch (error: any) {
      setDeleteError(error.response?.data?.error || 'Failed to delete account. Please check your password.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setDeleteError('');
  };

  return (
    <div className={`parent-settings ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Bar */}
      <div className="parent-settings-top-bar">
        <div className="parent-settings-top-bar-content">
          <button 
            className="parent-settings-back-btn"
            onClick={() => navigate('/parent-dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="parent-settings-logo">
            <BookOpenIcon />
            <span>Parent Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="parent-settings-main">
        <div className="parent-settings-container">
          <header className="parent-settings-header">
            <h1 className="parent-settings-title">Settings</h1>
            <p className="parent-settings-subtitle">Manage your parent account preferences</p>
          </header>

          {/* Success Message */}
          {successMessage && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <p style={{ margin: 0, fontWeight: '500' }}>{successMessage}</p>
            </div>
          )}

          {/* Settings Navigation */}
          <div className="parent-settings-layout">
            {/* Sidebar */}
            <aside className="parent-settings-sidebar">
              <button
                className={`parent-settings-nav-item ${activeSection === 'account' ? 'active' : ''}`}
                onClick={() => setActiveSection('account')}
              >
                <UserIcon />
                <span>Account</span>
              </button>
              <button
                className={`parent-settings-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveSection('notifications')}
              >
                <BellIcon />
                <span>Notifications</span>
              </button>
              <button
                className={`parent-settings-nav-item ${activeSection === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveSection('appearance')}
              >
                {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                <span>Appearance</span>
              </button>
              <button
                className={`parent-settings-nav-item ${activeSection === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveSection('privacy')}
              >
                <ShieldCheckIcon />
                <span>Privacy</span>
              </button>
            </aside>

            {/* Content Area */}
            <div className="parent-settings-content">
              {/* Account Section */}
              {activeSection === 'account' && (
                <div className="parent-settings-section">
                  <h2 className="parent-settings-section-title">Account Information</h2>
                  
                  {/* Profile Info */}
                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Profile</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-field">
                        <label>Name</label>
                        <div className="parent-settings-field-value">{user?.name || 'N/A'}</div>
                      </div>
                      <div className="parent-settings-field">
                        <label>Email</label>
                        <div className="parent-settings-field-value">{user?.email || 'N/A'}</div>
                      </div>
                      <div className="parent-settings-field">
                        <label>Account Type</label>
                        <div className="parent-settings-field-value">
                          <span className="parent-settings-badge">
                            {user?.user_type === 'parent' ? 'Parent' : 'Teacher'}
                          </span>
                        </div>
                      </div>
                      <button className="parent-settings-btn-secondary">
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Appearance Settings */}
                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Appearance</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-toggle-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: theme === 'dark' 
                              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                              : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            {theme === 'dark' ? <MoonIcon style={{ width: '24px', height: '24px' }} /> : <SunIcon style={{ width: '24px', height: '24px' }} />}
                          </div>
                          <div>
                            <h4>Dark Mode</h4>
                            <p>Switch between light and dark theme</p>
                          </div>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={theme === 'dark'}
                            onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Password Settings */}
                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Password</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-field">
                        <label>Password</label>
                        <div className="parent-settings-field-value">••••••••</div>
                      </div>
                      <button 
                        className="parent-settings-btn-secondary"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        <KeyIcon />
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Email Settings */}
                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Email Settings</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-field">
                        <label>Primary Email</label>
                        <div className="parent-settings-field-value">{user?.email || 'N/A'}</div>
                      </div>
                      <button className="parent-settings-btn-secondary">
                        <EnvelopeIcon />
                        Change Email
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="parent-settings-card danger">
                    <div className="parent-settings-card-header">
                      <h3>Danger Zone</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <p className="parent-settings-danger-text">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button 
                        className="parent-settings-btn-danger"
                        onClick={handleDeleteAccount}
                      >
                        <TrashIcon />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="parent-settings-section">
                  <h2 className="parent-settings-section-title">Notification Preferences</h2>
                  
                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Email Notifications</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Weekly Progress Reports</h4>
                          <p>Receive weekly summaries of your children's reading progress</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={weeklyReports}
                            onChange={(e) => setWeeklyReports(e.target.checked)}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Achievement Alerts</h4>
                          <p>Get notified when your child earns a new achievement</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={achievementAlerts}
                            onChange={(e) => setAchievementAlerts(e.target.checked)}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Goal Completion</h4>
                          <p>Receive alerts when learning goals are completed</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={goalCompletion}
                            onChange={(e) => setGoalCompletion(e.target.checked)}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Push Notifications</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Real-time Updates</h4>
                          <p>Get instant notifications for important activities</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={realtimeUpdates}
                            onChange={(e) => setRealtimeUpdates(e.target.checked)}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div className="parent-settings-section">
                  <h2 className="parent-settings-section-title">Privacy Settings</h2>
                  
                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Data Privacy</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Share Anonymous Usage Data</h4>
                          <p>Help us improve the app by sharing anonymous usage statistics</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={shareUsageData}
                            onChange={(e) => setShareUsageData(e.target.checked)}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Allow Analytics</h4>
                          <p>Enable detailed analytics to track reading patterns</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={allowAnalytics}
                            onChange={(e) => setAllowAnalytics(e.target.checked)}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Children's Privacy</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Public Profile for Children</h4>
                          <p>Allow children's profiles to be visible to friends</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input 
                            type="checkbox" 
                            checked={publicProfile}
                            onChange={(e) => setPublicProfile(e.target.checked)}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div className="parent-settings-section">
                  <h2 className="parent-settings-section-title">Appearance</h2>
                  
                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Theme</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-toggle-item">
                        <div>
                          <h4>Dark Mode</h4>
                          <p>Switch between light and dark theme for the parent dashboard</p>
                        </div>
                        <label className="parent-settings-toggle">
                          <input
                            type="checkbox"
                            checked={theme === 'dark'}
                            onChange={toggleDarkMode}
                          />
                          <span className="parent-settings-toggle-slider"></span>
                        </label>
                      </div>
                      
                      <div style={{ 
                        marginTop: '24px', 
                        padding: '16px', 
                        borderRadius: '12px',
                        background: theme === 'dark' 
                          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {theme === 'dark' ? (
                            <MoonIcon style={{ width: '32px', height: '32px' }} />
                          ) : (
                            <SunIcon style={{ width: '32px', height: '32px' }} />
                          )}
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                              {theme === 'dark' ? 'Dark Theme Active' : 'Light Theme Active'}
                            </h4>
                            <p style={{ fontSize: '14px', opacity: 0.9 }}>
                              {theme === 'dark' 
                                ? 'Easier on the eyes in low light conditions' 
                                : 'Bright and clear interface for daytime use'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="parent-settings-card">
                    <div className="parent-settings-card-header">
                      <h3>Language Preferences</h3>
                    </div>
                    <div className="parent-settings-card-body">
                      <div className="parent-settings-field">
                        <label>Interface Language</label>
                        <select 
                          className="parent-settings-select"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as 'en' | 'tl')}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                            color: theme === 'dark' ? 'white' : '#1f2937'
                          }}
                        >
                          <option value="en">English</option>
                          <option value="tl">Tagalog (Filipino)</option>
                        </select>
                        <p style={{ fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>
                          Choose your preferred language for the interface
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Logout Button - Outside all sections */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button 
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2rem',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: '200px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px' }} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <ParentBottomNav />

      {/* Password Update Modal */}
      <PasswordUpdateModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSave={handlePasswordChange}
      />

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={cancelDeleteAccount}
        >
          <div 
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <TrashIcon style={{ width: '32px', height: '32px' }} />
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                marginBottom: '8px',
                color: theme === 'dark' ? 'white' : '#1f2937'
              }}>
                Delete Account?
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                lineHeight: '1.6'
              }}>
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>

            {/* Warning Box */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
              border: `2px solid ${theme === 'dark' ? '#991b1b' : '#fecaca'}`,
              marginBottom: '24px'
            }}>
              <p style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: theme === 'dark' ? '#fca5a5' : '#991b1b',
                marginBottom: '8px'
              }}>
                ⚠️ This will permanently delete:
              </p>
              <ul style={{ 
                fontSize: '13px', 
                color: theme === 'dark' ? '#fca5a5' : '#991b1b',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li>Your parent account and all settings</li>
                <li>All child accounts under your management</li>
                <li>All stories, characters, and progress</li>
                <li>All data and cannot be recovered</li>
              </ul>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: theme === 'dark' ? '#e5e7eb' : '#374151',
                marginBottom: '8px'
              }}>
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  fontSize: '14px',
                  backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                  color: theme === 'dark' ? 'white' : '#1f2937'
                }}
                disabled={isDeleting}
              />
            </div>

            {/* Error Message */}
            {deleteError && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2',
                marginBottom: '24px'
              }}>
                <p style={{ 
                  fontSize: '13px', 
                  color: theme === 'dark' ? '#fca5a5' : '#991b1b',
                  margin: 0
                }}>
                  {deleteError}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={cancelDeleteAccount}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                  color: theme === 'dark' ? 'white' : '#374151',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={isDeleting || !deletePassword}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  cursor: (isDeleting || !deletePassword) ? 'not-allowed' : 'pointer',
                  opacity: (isDeleting || !deletePassword) ? 0.5 : 1,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentSettingsPage;
