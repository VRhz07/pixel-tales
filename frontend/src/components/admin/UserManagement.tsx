import { Search, Eye, Edit, Trash2, UserPlus, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserListItem } from '../../services/admin.service';
import './UserManagement.css';

interface UserManagementProps {
  users: UserListItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userTypeFilter: 'all' | 'child' | 'parent' | 'teacher';
  setUserTypeFilter: (filter: 'all' | 'child' | 'parent' | 'teacher') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  onViewUser: (userId: number) => void;
  onDeleteUser: (userId: number, username: string) => void;
  onAddRelationship: () => void;
}

export default function UserManagement({
  users,
  searchQuery,
  setSearchQuery,
  userTypeFilter,
  setUserTypeFilter,
  currentPage,
  setCurrentPage,
  totalPages,
  onViewUser,
  onDeleteUser,
  onAddRelationship,
}: UserManagementProps) {
  return (
    <div className="user-management-container">
      {/* Search and Filters */}
      <div className="admin-section">
        <div className="admin-filters">
          <div className="admin-search-box">
            <Search className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
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
          <button onClick={onAddRelationship} className="admin-btn admin-btn-primary">
            <UserPlus />
            <span>Add Relationship</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="user-table-wrapper">
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
                      title="Delete User"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
