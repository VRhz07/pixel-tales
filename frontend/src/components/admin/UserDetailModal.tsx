import { X, Trash2, User, Mail, Calendar, Shield, AlertTriangle, BookOpen, Trophy, Users as UsersIcon } from 'lucide-react';
import { UserDetail } from '../../services/admin.service';

interface UserDetailModalProps {
  user: UserDetail;
  onClose: () => void;
  onRemoveRelationship: (parentId: number, childId: number) => void;
}

export default function UserDetailModal({ user, onClose, onRemoveRelationship }: UserDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Complete user information and activity</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* User Profile Header */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 border border-cyan-200 dark:border-gray-600">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{background: 'linear-gradient(135deg, #00BCD4 0%, #2196F3 100%)'}}>
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{user.display_name}</h3>
                <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full capitalize" style={{
                    background: user.user_type === 'child' ? '#EFF6FF' : user.user_type === 'parent' ? '#ECFDF5' : '#FAF5FF',
                    color: user.user_type === 'child' ? '#2563EB' : user.user_type === 'parent' ? '#059669' : '#9333EA'
                  }}>
                    {user.user_type}
                  </span>
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full" style={{background: '#DCFCE7', color: '#16A34A'}}>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full" style={{background: '#F3F4F6', color: '#6B7280'}}>
                      Inactive
                    </span>
                  )}
                  {user.is_staff && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full" style={{background: '#00BCD4', color: '#FFFFFF'}}>
                      <Shield className="w-3 h-3" />
                      Staff
                    </span>
                  )}
                  {user.is_flagged && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full" style={{background: '#FEE2E2', color: '#DC2626'}}>
                      <AlertTriangle className="w-3 h-3" />
                      Flagged
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Basic Information
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-xs text-gray-600 dark:text-gray-400">Email</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-xs text-gray-600 dark:text-gray-400">User ID</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.id}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-xs text-gray-600 dark:text-gray-400">Date of Birth</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-xs text-gray-600 dark:text-gray-400">Joined</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(user.date_joined).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-xs text-gray-600 dark:text-gray-400">Last Login</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'Never'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <dt className="text-xs text-gray-600 dark:text-gray-400">Violations</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">{user.violation_count}</dd>
                </div>
              </div>
            </dl>
            {user.bio && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <dt className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bio</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{user.bio}</dd>
              </div>
            )}
            {user.is_flagged && user.flagged_reason && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <dt className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Flagged Reason
                  </dt>
                  <dd className="text-sm text-red-600 dark:text-red-300">{user.flagged_reason}</dd>
                  {user.last_violation_date && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                      Last violation: {new Date(user.last_violation_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Relationships */}
          {(user.children?.length > 0 || user.parents?.length > 0) && (
            <div className="bg-purple-50 dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-gray-600 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Relationships
              </h3>
              {user.children?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Children ({user.children.length})
                  </h4>
                  <div className="space-y-2">
                    {user.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
                            {child.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{child.display_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{child.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveRelationship(user.id, child.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Parents ({user.parents.length})
                  </h4>
                  <div className="space-y-2">
                    {user.parents.map((parent) => (
                      <div key={parent.id} className="flex items-center justify-between bg-white dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 flex items-center justify-center text-sm font-bold">
                            {parent.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{parent.display_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{parent.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveRelationship(parent.id, user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                Recent Stories ({user.stories.length})
              </h3>
              <div className="space-y-3">
                {user.stories.map((story) => (
                  <div key={story.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{story.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Created {new Date(story.date_created).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        story.is_published 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {story.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <BookOpen className="w-3 h-3" />
                        {story.views} views
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Characters ({user.characters.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.characters.map((character) => (
                  <div key={character.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{character.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Created {new Date(character.date_created).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements - Only show for child accounts */}
          {user.user_type?.toLowerCase() !== 'parent' && user.user_type?.toLowerCase() !== 'teacher' && user.achievements?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Recent Achievements ({user.achievements.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.achievements.map((achievement, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 border border-yellow-200 dark:border-gray-600">
                    <div className="flex items-start gap-2">
                      <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{achievement.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Earned {new Date(achievement.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
