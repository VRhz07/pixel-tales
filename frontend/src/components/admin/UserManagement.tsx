import { Search, Eye, Edit, Trash2, UserPlus, AlertTriangle, ChevronLeft, ChevronRight, RotateCcw, Archive, Users } from 'lucide-react';
import { UserListItem, ArchivedUserListItem } from '../../services/admin.service';
import './UserManagement.css';

interface UserManagementProps {
  users: UserListItem[];
  archivedUsers: ArchivedUserListItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userTypeFilter: 'all' | 'child' | 'parent' | 'teacher';
  setUserTypeFilter: (filter: 'all' | 'child' | 'parent' | 'teacher') => void;
  statusFilter: 'active' | 'archived';
  setStatusFilter: (filter: 'active' | 'archived') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  onViewUser: (userId: number) => void;
  onDeleteUser: (userId: number, username: string) => void;
  onRestoreUser: (userId: number, username: string) => void;
  onAddRelationship: () => void;
}

export default function UserManagement({
  users,
  archivedUsers,
  searchQuery,
  setSearchQuery,
  userTypeFilter,
  setUserTypeFilter,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  totalPages,
  onViewUser,
  onDeleteUser,
  onRestoreUser,
  onAddRelationship,
}: UserManagementProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const displayUsers = statusFilter === 'active' ? users : archivedUsers;
  
  console.log('👤 UserManagement - statusFilter:', statusFilter);
  console.log('👤 UserManagement - users:', users.length);
  console.log('👤 UserManagement - archivedUsers:', archivedUsers.length);
  console.log('👤 UserManagement - displayUsers:', displayUsers.length);
  
  return (
    <div className="user-management-container">
      {/* Tab Buttons */}
      <div className="user-tabs">
        <button
          className={`user-tab ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <Users size={18} />
          <span>Active Users</span>
        </button>
        <button
          className={`user-tab ${statusFilter === 'archived' ? 'active' : ''}`}
          onClick={() => setStatusFilter('archived')}
        >
          <Archive size={18} />
          <span>Archived Users</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="admin-section">
        <div className="admin-filters">
          <div className="admin-search-box">
            <Search className="admin-search-icon" />
            <input
              type="text"
              placeholder={statusFilter === 'active' ? "Search users..." : "Search archived users..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
          {statusFilter === 'active' && (
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value as any)}
              className="admin-filter-select"
            >
              <option value="all">All Types</option>
              <option value="child">Children</option>
              <option value="parent">Parents</option>
              <option value="teacher">Teachers</option>
            </select>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="user-table-wrapper">
        {statusFilter === 'active' ? (
          <table className="user-table">
            <thead className="user-table-header">
              <tr>
                <th>User</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="user-table-body">
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar">
                        {user.display_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-info-details">
                        <span className="user-name">{user.display_name}</span>
                        <span className="user-email">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`user-type-badge ${user.user_type}`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        onClick={() => onViewUser(user.id)}
                        className="user-action-btn view"
                        title="View & Edit User"
                      >
                        <Eye />
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id, user.username)}
                        className="user-action-btn delete"
                        title="Archive User"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="user-table">
            <thead className="user-table-header">
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Archived Date</th>
                <th>Archived By</th>
                <th>Reason</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="user-table-body">
              {archivedUsers.map((user) => (
                <tr key={user.id} className="archived-user-row">
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar archived">
                        {user.display_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-info-details">
                        <span className="user-name archived">{user.display_name}</span>
                        <span className="user-email archived">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`user-type-badge ${user.user_type} archived`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td>
                    <span className="archived-date">
                      {formatDate(user.archived_at)}
                    </span>
                  </td>
                  <td>
                    <span className="archived-by">
                      {user.archived_by || 'System'}
                    </span>
                  </td>
                  <td>
                    <span className="archived-reason" title={user.archive_reason}>
                      {user.archive_reason || 'No reason provided'}
                    </span>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button
                        onClick={() => onRestoreUser(user.id, user.username)}
                        className="user-action-btn restore"
                        title="Restore User"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {displayUsers.length === 0 && statusFilter === 'archived' && (
          <div style={{ 
            padding: '60px 20px', 
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <Archive size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Archived Users
            </h3>
            <p style={{ fontSize: '14px' }}>
              Users you archive will appear here for future restoration.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="user-pagination">
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <div className="pagination-buttons">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <ChevronLeft />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                <span>Next</span>
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
