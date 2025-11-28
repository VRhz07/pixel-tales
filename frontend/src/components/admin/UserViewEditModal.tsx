import { useState } from 'react';
import { X, Trash2, User, Mail, Calendar, Shield, AlertTriangle, BookOpen, Trophy, Users as UsersIcon, Edit2, Save } from 'lucide-react';
import { UserDetail } from '../../services/admin.service';
import './UserViewEditModal.css';

interface UserViewEditModalProps {
  user: UserDetail;
  onClose: () => void;
  onSave: (updates: any) => void;
  onRemoveRelationship: (parentId: number, childId: number) => void;
}

export default function UserViewEditModal({ user, onClose, onSave, onRemoveRelationship }: UserViewEditModalProps) {
  console.log('🎨 UserViewEditModal rendering with user:', user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    user_type: user.user_type,
    is_active: user.is_active,
    is_staff: user.is_staff,
    is_flagged: user.is_flagged,
  });

  const handleSave = () => {
    onSave(editForm);
    setIsEditing(false);
  };

  return (
    <div className="user-modal-overlay">
      <div className="user-modal-container">
        <div className="user-modal-header">
          <div className="user-modal-header-content">
            <h2>{isEditing ? 'Edit User' : 'User Details'}</h2>
            <p>{isEditing ? 'Make changes to user information' : 'Complete user information and activity'}</p>
          </div>
          <div className="user-modal-header-actions">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="user-modal-edit-btn" title="Edit User">
                <Edit2 className="w-5 h-5" />
                <span>Edit</span>
              </button>
            ) : (
              <button onClick={() => setIsEditing(false)} className="user-modal-cancel-edit-btn">
                Cancel Edit
              </button>
            )}
            <button onClick={onClose} className="user-modal-close-btn">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="user-modal-body">
          {/* User Profile Header */}
          <div className="user-profile-header">
            <div className="user-profile-header-content">
              <div className="user-profile-avatar">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="user-profile-info">
                <h3 className="user-profile-name">{user.display_name}</h3>
                <p className="user-profile-username">@{user.username}</p>
                <div className="user-profile-badges">
                  <span className={`user-badge ${user.user_type}`}>
                    {user.user_type}
                  </span>
                  <span className={`user-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {user.is_staff && (
                    <span className="user-badge staff">
                      <Shield className="w-3 h-3" />
                      Staff
                    </span>
                  )}
                  {user.is_flagged && (
                    <span className="user-badge flagged">
                      <AlertTriangle className="w-3 h-3" />
                      Flagged
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Section */}
          {isEditing ? (
            <div className="user-edit-section">
              <h3 className="user-edit-section-title">
                <Edit2 className="w-5 h-5" />
                Editing User Information
              </h3>
              <div className="user-form-grid">
                <div className="user-form-field">
                  <label className="user-form-label">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="user-form-input"
                  />
                </div>

                <div className="user-form-field">
                  <label className="user-form-label">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="user-form-input"
                  />
                </div>

                <div className="user-form-field">
                  <label className="user-form-label">Display Name</label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="user-form-input"
                  />
                </div>

                <div className="user-form-field">
                  <label className="user-form-label">User Type</label>
                  <select
                    value={editForm.user_type}
                    onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value as any })}
                    className="user-form-input"
                  >
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                <div className="user-form-checkboxes">
                  <label className="user-form-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="user-form-checkbox"
                    />
                    <span className="user-form-checkbox-label">Active</span>
                  </label>

                  <label className="user-form-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={editForm.is_staff}
                      onChange={(e) => setEditForm({ ...editForm, is_staff: e.target.checked })}
                      className="user-form-checkbox"
                    />
                    <span className="user-form-checkbox-label">Staff</span>
                  </label>

                  <label className="user-form-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={editForm.is_flagged}
                      onChange={(e) => setEditForm({ ...editForm, is_flagged: e.target.checked })}
                      className="user-form-checkbox"
                    />
                    <span className="user-form-checkbox-label">Flagged</span>
                  </label>
                </div>

                <div className="user-edit-actions">
                  <button onClick={() => setIsEditing(false)} className="user-modal-cancel-edit-btn">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="user-save-btn">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Basic Information */}
              <div className="user-info-section">
                <h3 className="user-info-section-title">
                  <User className="w-5 h-5" style={{color: '#00BCD4'}} />
                  Basic Information
                </h3>
                <dl className="user-info-grid">
                  <div className="user-info-item">
                    <Mail className="w-4 h-4" />
                    <div className="user-info-item-content">
                      <dt>Email</dt>
                      <dd>{user.email}</dd>
                    </div>
                  </div>
                  <div className="user-info-item">
                    <User className="w-4 h-4" />
                    <div className="user-info-item-content">
                      <dt>User ID</dt>
                      <dd>{user.id}</dd>
                    </div>
                  </div>
                  <div className="user-info-item">
                    <Calendar className="w-4 h-4" />
                    <div className="user-info-item-content">
                      <dt>Date of Birth</dt>
                      <dd>{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not provided'}</dd>
                    </div>
                  </div>
                  <div className="user-info-item">
                    <Calendar className="w-4 h-4" />
                    <div className="user-info-item-content">
                      <dt>Joined</dt>
                      <dd>{new Date(user.date_joined).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</dd>
                    </div>
                  </div>
                  <div className="user-info-item">
                    <Calendar className="w-4 h-4" />
                    <div className="user-info-item-content">
                      <dt>Last Login</dt>
                      <dd>{user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'Never'}</dd>
                    </div>
                  </div>
                  <div className="user-info-item">
                    <AlertTriangle className="w-4 h-4" />
                    <div className="user-info-item-content">
                      <dt>Violations</dt>
                      <dd>{user.violation_count}</dd>
                    </div>
                  </div>
                </dl>
                {user.bio && (
                  <div className="user-bio-section">
                    <dt className="user-bio-label">Bio</dt>
                    <dd className="user-bio-text">{user.bio}</dd>
                  </div>
                )}
                {user.is_flagged && user.flagged_reason && (
                  <div className="user-flagged-alert">
                    <dt className="user-flagged-alert-title">
                      <AlertTriangle className="w-3 h-3" />
                      Flagged Reason
                    </dt>
                    <dd className="user-flagged-alert-text">{user.flagged_reason}</dd>
                    {user.last_violation_date && (
                      <p className="user-flagged-alert-date">
                        Last violation: {new Date(user.last_violation_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Relationships */}
              {(user.children?.length > 0 || user.parents?.length > 0) && (
                <div className="user-relationships-section">
                  <h3 className="user-info-section-title">
                    <UsersIcon className="w-5 h-5" style={{color: '#7C3AED'}} />
                    Relationships
                  </h3>
                  {user.children?.length > 0 && (
                    <div className="user-relationships-list">
                      <h4 className="user-relationships-subtitle">
                        Children ({user.children.length})
                      </h4>
                      <div>
                        {user.children.map((child) => (
                          <div key={child.id} className="user-relationship-card">
                            <div className="user-relationship-info">
                              <div className="user-relationship-avatar child">
                                {child.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="user-relationship-details">
                                <p className="user-relationship-name">{child.display_name}</p>
                                <p className="user-relationship-username">@{child.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveRelationship(user.id, child.id)}
                              className="user-relationship-remove-btn"
                              title="Remove relationship"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.parents?.length > 0 && (
                    <div className="user-relationships-list">
                      <h4 className="user-relationships-subtitle">
                        Parents ({user.parents.length})
                      </h4>
                      <div>
                        {user.parents.map((parent) => (
                          <div key={parent.id} className="user-relationship-card">
                            <div className="user-relationship-info">
                              <div className="user-relationship-avatar parent">
                                {parent.display_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="user-relationship-details">
                                <p className="user-relationship-name">{parent.display_name}</p>
                                <p className="user-relationship-username">@{parent.username}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveRelationship(parent.id, user.id)}
                              className="user-relationship-remove-btn"
                              title="Remove relationship"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stories */}
              {user.stories?.length > 0 && (
                <div className="user-info-section">
                  <h3 className="user-info-section-title">
                    <BookOpen className="w-5 h-5" style={{color: '#10B981'}} />
                    Recent Stories ({user.stories.length})
                  </h3>
                  <div className="user-content-list">
                    {user.stories.map((story) => (
                      <div key={story.id} className="user-content-card">
                        <div className="user-content-card-header">
                          <div>
                            <p className="user-content-title">{story.title}</p>
                            <p className="user-content-date">
                              Created {new Date(story.date_created).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`user-content-status-badge ${story.is_published ? 'published' : 'draft'}`}>
                            {story.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="user-content-stats">
                          <span className="user-content-stat">
                            <BookOpen className="w-3 h-3" />
                            {story.views} views
                          </span>
                          <span className="user-content-stat">
                            ❤️ {story.likes} likes
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Characters */}
              {user.characters?.length > 0 && (
                <div className="user-info-section">
                  <h3 className="user-info-section-title">
                    <UsersIcon className="w-5 h-5" style={{color: '#F97316'}} />
                    Characters ({user.characters.length})
                  </h3>
                  <div className="user-characters-grid">
                    {user.characters.map((character) => (
                      <div key={character.id} className="user-content-card">
                        <p className="user-content-title">{character.name}</p>
                        <p className="user-content-date">
                          Created {new Date(character.date_created).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {user.achievements?.length > 0 && (
                <div className="user-info-section">
                  <h3 className="user-info-section-title">
                    <Trophy className="w-5 h-5" style={{color: '#FBBF24'}} />
                    Recent Achievements ({user.achievements.length})
                  </h3>
                  <div className="user-achievements-grid">
                    {user.achievements.map((achievement, idx) => (
                      <div key={idx} className="user-achievement-card">
                        <div className="user-achievement-content">
                          <Trophy className="w-4 h-4" />
                          <div>
                            <p className="user-content-title">{achievement.name}</p>
                            <p className="user-content-date">
                              Earned {new Date(achievement.earned_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
