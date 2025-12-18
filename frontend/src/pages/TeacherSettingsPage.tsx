import React, { useState, useEffect } from 'react';
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
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useI18nStore } from '../stores/i18nStore';
import { PasswordUpdateModal } from '../components/settings/PasswordUpdateModal';
import { ParentProfileEditModal } from '../components/settings/ParentProfileEditModal';
import { EmailChangeModal } from '../components/settings/EmailChangeModal';
import { authService } from '../services/auth.service';
import TeacherBottomNav from '../components/navigation/TeacherBottomNav';
import parentDashboardService, { Child, ChildFormData } from '../services/parentDashboard.service';
import './ParentSettingsPage.css';

const TeacherSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage, t } = useI18nStore();
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'privacy' | 'appearance' | 'children'>('account');
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
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

  // Manage children state
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [editChildData, setEditChildData] = useState<ChildFormData>({
    name: '',
    username: '',
    dateOfBirth: '',
    className: ''
  });
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [loadingAvailableStudents, setLoadingAvailableStudents] = useState(false);

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

  const handleProfileUpdate = async (name: string, username: string) => {
    try {
      await authService.updateProfile({ name, username });
      
      // Update the store immediately with setUser
      const { setUser } = useAuthStore.getState();
      if (user) {
        setUser({
          ...user,
          name: name,
          username: username,
        });
      }
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const handleEmailChange = async (newEmail: string, password: string) => {
    try {
      await authService.changeEmail(newEmail, password);
      await useAuthStore.getState().loadUserProfile();
      setSuccessMessage('Email updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update email');
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

  // Load children when settings page loads
  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoadingChildren(true);
      const userType = user?.profile?.user_type || user?.user_type;
      let childrenData: Child[];
      if (userType === 'parent') {
        childrenData = await parentDashboardService.getChildren();
      } else {
        childrenData = await parentDashboardService.getStudents();
      }
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoadingChildren(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      setLoadingAvailableStudents(true);
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${baseUrl}/teacher/available-students/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data.students || []);
      } else {
        console.error('Failed to load available students');
        setAvailableStudents([]);
      }
    } catch (error) {
      console.error('Error loading available students:', error);
      setAvailableStudents([]);
    } finally {
      setLoadingAvailableStudents(false);
    }
  };

  const handleAddStudentToAccount = async (studentId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

      const response = await fetch(`${baseUrl}/teacher/add-student/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: studentId })
      });

      if (response.ok) {
        setShowAddChildModal(false);
        loadChildren(); // Reload the children list
        setSuccessMessage('Student added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleOpenAddStudentModal = () => {
    loadAvailableStudents();
    setShowAddChildModal(true);
  };

  const handleEditChild = (child: Child) => {
    setSelectedChild(child);
    setEditChildData({
      name: child.name,
      username: child.username,
      dateOfBirth: '',
      className: ''
    });
    setShowEditChildModal(true);
  };

  const handleSaveChildEdit = async (childData: ChildFormData) => {
    if (!selectedChild) return;

    try {
      await parentDashboardService.updateChild(selectedChild.id, childData);
      await loadChildren();
      setShowEditChildModal(false);
      setSelectedChild(null);
      setSuccessMessage('Child profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating child:', error);
      alert('Failed to update child. Please try again.');
    }
  };

  const handleDeleteChild = async (child: Child) => {
    const userType = user?.profile?.user_type || user?.user_type;
    const childLabel = userType === 'teacher' ? 'student' : 'child';
    
    const confirmed = confirm(
      `Are you sure you want to remove ${child.name}?\n\nThis will:\n• Remove the ${childLabel} from your dashboard\n• They can no longer be monitored\n• Their account and stories will remain\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      try {
        await parentDashboardService.removeChild(child.id);
        await loadChildren();
        setSuccessMessage(`${child.name} removed successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting child:', error);
        alert('Failed to remove child. Please try again.');
      }
    }
  };

  return (
    <div className={`parent-settings ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Bar */}
      <div className="parent-settings-top-bar">
        <div className="parent-settings-top-bar-content">
          <button 
            className="parent-settings-back-btn"
            onClick={() => navigate('/teacher-dashboard')}
          >
            <ArrowLeftIcon />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="parent-settings-logo">
            <BookOpenIcon />
            <span>Teacher Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="parent-settings-main">
        <div className="parent-settings-container">
          <header className="parent-settings-header">
            <h1 className="parent-settings-title">Settings</h1>
            <p className="parent-settings-subtitle">Manage your teacher account preferences</p>
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
                className={`parent-settings-nav-item ${activeSection === 'children' ? 'active' : ''}`}
                onClick={() => setActiveSection('children')}
              >
                <UserGroupIcon />
                <span>Manage Students</span>
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
            </aside>

            {/* Content Area */}
            <div className="parent-settings-content">
              {/* Manage Students Section */}
              {activeSection === 'children' && (
                <div className="parent-settings-section">
                  <div className="section-header">
                    <h2>Manage Students</h2>
                    <p className="section-description">
                      Add, edit, or remove student profiles from your account
                    </p>
                  </div>

                  {/* Add Student Button */}
                  <div className="manage-children-actions">
                    <button 
                      className="btn-add-child-settings"
                      onClick={handleOpenAddStudentModal}
                    >
                      <PlusIcon style={{ width: '20px', height: '20px' }} />
                      <span>Add Existing Child Profile</span>
                    </button>
                  </div>

                  {/* Students List */}
                  {loadingChildren ? (
                    <div className="loading-children">
                      <p>Loading students...</p>
                    </div>
                  ) : children.length === 0 ? (
                    <div className="empty-children-state">
                      <UserGroupIcon style={{ width: '64px', height: '64px', opacity: 0.3 }} />
                      <h3>No Students Added Yet</h3>
                      <p>Click the "Add Existing Child Profile" button above to add your first student</p>
                    </div>
                  ) : (
                    <div className="children-management-grid">
                      {children.map((child) => (
                        <div key={child.id} className="child-management-card">
                          <div className="child-card-header">
                            <div className="child-avatar-large">
                              {child.avatar || '👤'}
                            </div>
                            <div className="child-details">
                              <h3>{child.name}</h3>
                              <p className="child-username">@{child.username}</p>
                              {child.email && <p className="child-email">{child.email}</p>}
                            </div>
                          </div>

                          <div className="child-stats-row">
                            <div className="child-stat">
                              <span className="stat-value">{child.total_stories || 0}</span>
                              <span className="stat-label">Stories</span>
                            </div>
                            <div className="child-stat">
                              <span className="stat-value">{child.achievements_count || 0}</span>
                              <span className="stat-label">Achievements</span>
                            </div>
                            <div className="child-stat">
                              <span className="stat-value">{child.total_reads || 0}</span>
                              <span className="stat-label">Read</span>
                            </div>
                          </div>

                          <div className="child-actions">
                            <button
                              className="btn-edit-child"
                              onClick={() => handleEditChild(child)}
                            >
                              <PencilIcon style={{ width: '16px', height: '16px' }} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn-delete-child"
                              onClick={() => handleDeleteChild(child)}
                            >
                              <TrashIcon style={{ width: '16px', height: '16px' }} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                      <button 
                        className="parent-settings-btn-secondary"
                        onClick={() => setShowProfileModal(true)}
                      >
                        Edit Profile
                      </button>
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
                      <button 
                        className="parent-settings-btn-secondary"
                        onClick={() => setShowEmailModal(true)}
                      >
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

      {/* Password Update Modal */}
      <PasswordUpdateModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onUpdate={handlePasswordChange}
      />

      {/* Add Student Modal - List of Available Students */}
      {showAddChildModal && (
        <div className="modal-overlay" onClick={() => setShowAddChildModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Existing Child Profile</h3>
              <button
                onClick={() => setShowAddChildModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {loadingAvailableStudents ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Loading available students...</p>
                </div>
              ) : (
                <div className="students-list">
                  {availableStudents.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No available students. All child profiles are already added to your account.
                    </p>
                  ) : (
                    availableStudents.map((student: any) => (
                      <div key={student.id} className="student-item">
                        <div className="student-info">
                          <span className="text-2xl mr-3">{student.avatar_emoji || '👤'}</span>
                          <div>
                            <p className="font-medium">{student.display_name}</p>
                            <p className="text-sm text-gray-500">
                              Level {student.level} • {student.stories_count} stories
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddStudentToAccount(student.id)}
                          className="add-button"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddChildModal(false)}
                className="modal-button secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditChildModal && selectedChild && (
        <div className="modal-overlay" onClick={() => setShowEditChildModal(false)}>
          <div 
            className={`modal-content edit-child-modal ${theme === 'dark' ? 'dark' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme === 'dark' ? '#1F1F1F' : '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              padding: '24px'
            }}
          >
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '20px',
              color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A'
            }}>Edit Child Profile</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveChildEdit(editChildData);
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151'
                }}>Name</label>
                <input
                  type="text"
                  value={editChildData.name}
                  onChange={(e) => setEditChildData({ ...editChildData, name: e.target.value })}
                  required
                  placeholder="Enter name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                    background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                    color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151'
                }}>Username</label>
                <input
                  type="text"
                  value={editChildData.username}
                  onChange={(e) => setEditChildData({ ...editChildData, username: e.target.value })}
                  required
                  placeholder="Enter username"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                    background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                    color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151'
                }}>Birthday (Optional)</label>
                <input
                  type="date"
                  value={editChildData.dateOfBirth}
                  onChange={(e) => setEditChildData({ ...editChildData, dateOfBirth: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                    background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                    color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151'
                }}>Class/Grade (Optional)</label>
                <input
                  type="text"
                  value={editChildData.className}
                  onChange={(e) => setEditChildData({ ...editChildData, className: e.target.value })}
                  placeholder="e.g., Grade 3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                    background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                    color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditChildModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#3A3A3A' : '#E8ECEF'}`,
                    background: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                    color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <ParentProfileEditModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentName={user?.name || ''}
          currentUsername={user?.username || ''}
          onSave={handleProfileUpdate}
        />
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <EmailChangeModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          currentEmail={user?.email || ''}
          onSave={handleEmailChange}
        />
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default TeacherSettingsPage;
