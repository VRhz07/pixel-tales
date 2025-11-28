import { Search, RotateCcw, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import { ArchivedUserListItem } from '../../services/admin.service';
import './UserManagement.css';

interface ArchivedUserManagementProps {
  users: ArchivedUserListItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  onRestoreUser: (userId: number, username: string) => void;
}

export default function ArchivedUserManagement({
  users,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  totalPages,
  onRestoreUser,
}: ArchivedUserManagementProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="user-management-container">
      {/* Search */}
      <div className="admin-section">
        <div className="admin-filters">
          <div className="admin-search-box">
            <Search className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search archived users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>
      </div>

      {/* Archived Users Table */}
      <div className="user-table-wrapper">
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
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar" style={{ opacity: 0.6 }}>
                      {user.display_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info-details">
                      <span className="user-name" style={{ opacity: 0.7 }}>{user.display_name}</span>
                      <span className="user-email" style={{ opacity: 0.6 }}>@{user.username}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`user-type-badge ${user.user_type}`} style={{ opacity: 0.7 }}>
                    {user.user_type}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {formatDate(user.archived_at)}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {user.archived_by || 'System'}
                  </span>
                </td>
                <td>
                  <span 
                    style={{ 
                      fontSize: '13px', 
                      color: '#9ca3af',
                      maxWidth: '200px',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={user.archive_reason}
                  >
                    {user.archive_reason || 'No reason provided'}
                  </span>
                </td>
                <td>
                  <div className="user-actions">
                    <button
                      onClick={() => onRestoreUser(user.id, user.username)}
                      className="user-action-btn restore"
                      title="Restore User"
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white'
                      }}
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
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
