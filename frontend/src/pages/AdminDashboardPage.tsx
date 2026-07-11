import { useState, useEffect, useRef } from 'react';
import { Activity, BarChart3, Users, RefreshCw, Shield, AlertTriangle, LogOut, TrendingUp, BookOpen, Heart, Moon, Sun, MessageSquareWarning, Archive, Smartphone, Zap, Database, Server } from 'lucide-react';
import adminAuthService from '../services/adminAuth.service';
import adminService, { AdminStats, UserListItem, UserDetail } from '../services/admin.service';
import { useThemeStore } from '../stores/themeStore';
import ConfirmationModal from '../components/common/ConfirmationModal';
import DashboardStats from '../components/admin/DashboardStats';
import UserManagement from '../components/admin/UserManagement';
import UserViewEditModal from '../components/admin/UserViewEditModal';
import AddRelationshipModal from '../components/admin/AddRelationshipModal';
import EmptyState from '../components/admin/EmptyState';
import AdminLoginPage from '../components/admin/AdminLoginPage';
import ProfanityManagement from '../components/admin/ProfanityManagement';
import SystemHealthDashboard from '../components/admin/SystemHealthDashboard';
import MobileAppSettings from '../components/admin/MobileAppSettings';
import AIServicesConfig from '../components/admin/AIServicesConfig';
import SecurityAuditLogs from '../components/admin/SecurityAuditLogs';
import AdminStoryManagement from '../components/admin/AdminStoryManagement';
import Logo from '../components/common/Logo';
import '../styles/dashboard-common.css';
import '../components/admin/ProfanityManagement.css';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'profanity' | 'system' | 'ai-services' | 'security' | 'stories'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const { theme, isDarkMode, setTheme } = useThemeStore();
  const isAdmin = adminUser?.is_staff || adminUser?.is_superuser;
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'child' | 'parent' | 'teacher'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);
  
  // Archived users state
  const [archivedUsers, setArchivedUsers] = useState<any[]>([]);
  const [archiveReason, setArchiveReason] = useState('');
  const [userToArchive, setUserToArchive] = useState<{ id: number; username: string } | null>(null);
  
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [relationshipForm, setRelationshipForm] = useState({ parentId: '', childId: '' });
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Check if admin is authenticated
  useEffect(() => {
    const checkAdminAuth = async () => {
      const isAuth = adminAuthService.isAdminAuthenticated();
      if (isAuth) {
        // Verify token is still valid
        const isValid = await adminAuthService.verifyToken();
        if (isValid) {
          const user = adminAuthService.getAdminUser();
          setAdminUser(user);
          setIsAdminAuthenticated(true);
          loadDashboardStats();
        } else {
          // Token invalid, clear and show login
          console.log('❌ Admin token invalid, clearing...');
          adminAuthService.clearAdminData();
          setIsAdminAuthenticated(false);
          setLoading(false);
        }
      } else {
        setIsAdminAuthenticated(false);
        setLoading(false);
      }
    };
    checkAdminAuth();
  }, []);

  // Auto-refresh stats every 30 seconds for real-time analytics
  useEffect(() => {
    if (isAdminAuthenticated && activeTab === 'dashboard') {
      const statsInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing dashboard stats...');
        loadDashboardStats();
      }, 30000); // 30 seconds
      
      return () => {
        clearInterval(statsInterval);
      };
    }
  }, [isAdminAuthenticated, activeTab]);

  useEffect(() => {
    if (isAdminAuthenticated && activeTab === 'users') {
      if (statusFilter === 'active') {
        loadUsers();
      } else {
        loadArchivedUsers();
      }
    }
  }, [isAdminAuthenticated, activeTab, searchQuery, userTypeFilter, statusFilter, currentPage]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard stats...');
      const data = await adminService.getDashboardStats();
      console.log('✅ Dashboard stats loaded:', data);
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading dashboard stats:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load dashboard stats';
      
      // If unauthorized (401), clear admin data and redirect to login
      if (err.response?.status === 401) {
        console.log('❌ Unauthorized - clearing admin data');
        adminAuthService.clearAdminData();
        setIsAdminAuthenticated(false);
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading users...');
      const { users: userData, pagination } = await adminService.listUsers({
        search: searchQuery || undefined,
        user_type: userTypeFilter === 'all' ? undefined : userTypeFilter,
        page: currentPage,
        page_size: 20,
      });
      console.log('✅ Users loaded:', userData.length, 'users');
      setUsers(userData);
      setTotalPages(pagination.total_pages);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading users:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load users';
      
      // If unauthorized (401), clear admin data and redirect to login
      if (err.response?.status === 401) {
        console.log('❌ Unauthorized - clearing admin data');
        adminAuthService.clearAdminData();
        setIsAdminAuthenticated(false);
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading archived users...');
      const { users: archivedData, pagination } = await adminService.getArchivedUsers(
        currentPage,
        20,
        searchQuery || undefined
      );
      console.log('✅ Archived users loaded:', archivedData.length, 'users');
      setArchivedUsers(archivedData);
      setTotalPages(pagination.total_pages);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading archived users:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load archived users';
      
      if (err.response?.status === 401) {
        console.log('❌ Unauthorized - clearing admin data');
        adminAuthService.clearAdminData();
        setIsAdminAuthenticated(false);
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId: number) => {
    try {
      console.log('🔍 Fetching user details for ID:', userId);
      const userDetail = await adminService.getUser(userId);
      console.log('✅ User details loaded:', userDetail);
      setSelectedUser(userDetail);
      console.log('✅ Selected user state updated');
    } catch (err: any) {
      console.error('❌ Error loading user details:', err);
      alert(err.response?.data?.error || 'Failed to load user details');
    }
  };

  const handleSaveUser = async (updates: any) => {
    if (!selectedUser) return;
    try {
      await adminService.updateUser(selectedUser.id, updates);
      alert('User updated successfully');
      // Reload user details to show updated information
      const updatedUser = await adminService.getUser(selectedUser.id);
      setSelectedUser(updatedUser);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    setUserToArchive({ id: userId, username });
    setArchiveReason('');
    setShowConfirmModal(true);
  };

  const confirmArchiveUser = async () => {
    if (!userToArchive) return;
    
    try {
      await adminService.deleteUser(userToArchive.id, archiveReason || 'Archived by admin');
      alert(`User "${userToArchive.username}" archived successfully`);
      setShowConfirmModal(false);
      setUserToArchive(null);
      setArchiveReason('');
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive user');
    }
  };

  const handleRestoreUser = async (userId: number, username: string) => {
    if (!confirm(`Restore user "${username}"? They will be able to log in again.`)) return;
    
    try {
      await adminService.restoreUser(userId);
      alert(`User "${username}" restored successfully`);
      loadArchivedUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to restore user');
    }
  };

  const handleHardDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`PERMANENTLY delete user "${username}"? This action CANNOT be undone and will delete all their stories and data.`)) return;
    
    try {
      await adminService.hardDeleteUser(userId);
      alert(`User "${username}" permanently deleted`);
      loadArchivedUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user permanently');
    }
  };

  const handleBulkAction = async (action: 'archive' | 'restore' | 'hard_delete', userIds: number[]) => {
    if (userIds.length === 0) return;

    if (action === 'archive') {
      const reason = prompt('Reason for archiving selected users:', 'Archived by admin bulk action');
      if (reason === null) return;
      
      try {
        await Promise.all(userIds.map(id => adminService.deleteUser(id, reason)));
        alert(`Successfully archived ${userIds.length} users.`);
        loadUsers();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to archive some users');
        loadUsers();
      }
    } else if (action === 'restore') {
      if (!confirm(`Restore ${userIds.length} selected users?`)) return;
      
      try {
        await Promise.all(userIds.map(id => adminService.restoreUser(id)));
        alert(`Successfully restored ${userIds.length} users.`);
        loadArchivedUsers();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to restore some users');
        loadArchivedUsers();
      }
    } else if (action === 'hard_delete') {
      if (!confirm(`PERMANENTLY delete ${userIds.length} selected users? This action CANNOT be undone.`)) return;
      
      try {
        await Promise.all(userIds.map(id => adminService.hardDeleteUser(id)));
        alert(`Successfully permanently deleted ${userIds.length} users.`);
        loadArchivedUsers();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete some users permanently');
        loadArchivedUsers();
      }
    }
  };

  const handleAddRelationship = async () => {
    try {
      await adminService.addParentChildRelationship(
        parseInt(relationshipForm.parentId),
        parseInt(relationshipForm.childId)
      );
      alert('Relationship added successfully');
      setShowAddRelationship(false);
      setRelationshipForm({ parentId: '', childId: '' });
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add relationship');
    }
  };

  const handleRemoveRelationship = async (parentId: number, childId: number) => {
    if (!confirm('Remove this parent-child relationship?')) return;
    try {
      await adminService.removeParentChildRelationship(parentId, childId);
      alert('Relationship removed successfully');
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove relationship');
    }
  };

  // Show login page if not authenticated as admin
  if (!isAdminAuthenticated) {
    return (
      <AdminLoginPage 
        onLoginSuccess={() => {
          const user = adminAuthService.getAdminUser();
          setAdminUser(user);
          setIsAdminAuthenticated(true);
          loadDashboardStats();
        }} 
      />
    );
  }

  if (loading && !stats && !users.length) {
    return (
      <div className="admin-container">
        <div className="admin-loading">
          <div className="admin-loading-spinner"></div>
          <p className="admin-loading-text">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <div className="admin-logo-icon">
              <Logo style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="admin-logo-text">Admin Dashboard</span>
          </div>
        </div>
        
        <div className="admin-header-right">
          {adminUser && (
            <div className="admin-profile-container" ref={profileDropdownRef}>
              <button 
                className="admin-user-info"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="admin-user-avatar">
                  {adminUser.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="admin-user-details">
                  <span className="admin-user-name">{adminUser.username}</span>
                  <span className="admin-user-role">Administrator</span>
                </div>
              </button>
              
              {showProfileDropdown && (
                <div className="admin-profile-dropdown">
                  <div className="admin-dropdown-toggle-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="admin-theme-icon">
                        {isDarkMode ? <Moon /> : <Sun />}
                      </div>
                      <div className="admin-theme-text">
                        <div className="admin-theme-title">Dark Mode</div>
                        <div className="admin-theme-subtitle">
                          {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                        </div>
                      </div>
                    </div>
                    <label className="admin-toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={isDarkMode}
                        onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                      />
                      <span className="admin-toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div className="admin-dropdown-divider"></div>
                  
                  <button
                    onClick={async () => {
                      setShowProfileDropdown(false);
                      await adminAuthService.logout();
                      setIsAdminAuthenticated(false);
                      setAdminUser(null);
                      // Redirect to admin login page
                      window.location.href = '/admin/login';
                    }}
                    className="admin-dropdown-logout-btn"
                  >
                    <LogOut />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="admin-main">
        {/* Error Display */}
        {error && (
          <div className="admin-error">
            <AlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {activeTab === 'dashboard' && (
          <>
            {!loading && stats && <DashboardStats stats={stats} />}
            {!loading && !stats && !error && (
              <div className="admin-section">
                <p style={{ textAlign: 'center', color: '#6B7280' }}>No statistics available yet.</p>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'users' && (
          <>
            <UserManagement
              users={users}
              archivedUsers={archivedUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              userTypeFilter={userTypeFilter}
              setUserTypeFilter={setUserTypeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              onViewUser={handleViewUser}
              onDeleteUser={handleDeleteUser}
              onRestoreUser={handleRestoreUser}
              onHardDeleteUser={handleHardDeleteUser}
              onBulkAction={handleBulkAction}
              onAddRelationship={() => setShowAddRelationship(true)}
            />
            {!loading && statusFilter === 'active' && users.length === 0 && !error && (
              <EmptyState 
                type="no-users" 
                message={searchQuery ? 'No users match your search criteria.' : 'No users found in the system.'}
                onRetry={loadUsers}
              />
            )}
          </>
        )}

        {activeTab === 'stories' && (
          <AdminStoryManagement />
        )}

        {activeTab === 'profanity' && (
          <ProfanityManagement />
        )}

        {activeTab === 'system' && (
          <SystemHealthDashboard />
        )}

        {activeTab === 'ai-services' && (
          <AIServicesConfig />
        )}

        {activeTab === 'security' && (
          <SecurityAuditLogs />
        )}
        
        {loading && (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p className="admin-loading-text">Loading data...</p>
          </div>
        )}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="admin-nav">
        <div className="admin-nav-items">
          <button
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 />
            <span>Dashboard</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users />
            <span>Users</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            <BookOpen />
            <span>Stories</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'profanity' ? 'active' : ''}`}
            onClick={() => setActiveTab('profanity')}
          >
            <MessageSquareWarning />
            <span>Profanity</span>
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Server />
            <span>System</span>
          </button>
        </div>
      </nav>
    </div>

    {/* Modals - Rendered outside main container for proper z-index */}
    {selectedUser && (
      <>
        {console.log('📋 Rendering UserViewEditModal, selectedUser:', selectedUser)}
        <UserViewEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={handleSaveUser}
          onRemoveRelationship={handleRemoveRelationship}
        />
      </>
    )}

    {showAddRelationship && (
      <AddRelationshipModal
        form={relationshipForm}
        setForm={setRelationshipForm}
        onSave={handleAddRelationship}
        onClose={() => setShowAddRelationship(false)}
      />
    )}

    {/* Archive User Modal */}
    {userToArchive && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: showConfirmModal ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '16px',
            color: theme === 'dark' ? 'white' : '#1f2937'
          }}>
            Archive User "{userToArchive.username}"?
          </h2>
          <p style={{
            fontSize: '14px',
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            marginBottom: '24px'
          }}>
            This user will be archived and won't be able to log in. You can restore them later from the Archived tab.
          </p>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: theme === 'dark' ? '#e5e7eb' : '#374151',
              marginBottom: '8px'
            }}>
              Reason for archiving (optional)
            </label>
            <textarea
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="e.g., Inactive account, duplicate user, requested by parent..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                fontSize: '14px',
                backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
                color: theme === 'dark' ? 'white' : '#1f2937',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setUserToArchive(null);
                setArchiveReason('');
              }}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                color: theme === 'dark' ? 'white' : '#374151',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmArchiveUser}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              Archive User
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
