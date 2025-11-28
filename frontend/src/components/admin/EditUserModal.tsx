import { X, Calendar, Mail, User, Shield, AlertTriangle, Flag } from 'lucide-react';
import { UserListItem } from '../../services/admin.service';

interface EditUserModalProps {
  user: UserListItem;
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EditUserModal({ user, form, setForm, onSave, onClose }: EditUserModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit User</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Viewing and editing user information</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* User Overview Section */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-cyan-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              User Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Joined</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(user.date_joined).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Last Login</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Stories</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.story_count} total ({user.published_story_count} published)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Violations</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.violation_count}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Relationships Section */}
          {(user.children?.length > 0 || user.parents?.length > 0) && (
            <div className="bg-purple-50 dark:bg-gray-700 rounded-lg p-4 border border-purple-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Relationships
              </h3>
              <div className="space-y-3">
                {user.children?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Children ({user.children.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {user.children.map((child) => (
                        <span 
                          key={child.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-full text-sm border border-gray-300 dark:border-gray-500"
                        >
                          {child.display_name} (@{child.username})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.parents?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Parents ({user.parents.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {user.parents.map((parent) => (
                        <span 
                          key={parent.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-full text-sm border border-gray-300 dark:border-gray-500"
                        >
                          {parent.display_name} (@{parent.username})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editable Fields Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Editable Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Type
                </label>
                <select
                  value={form.user_type}
                  onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                >
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Permissions & Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.is_staff}
                      onChange={(e) => setForm({ ...form, is_staff: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.is_flagged}
                      onChange={(e) => setForm({ ...form, is_flagged: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Flagged</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* System Information (Read-only) */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              System Information (Read-only)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{user.id}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Superuser:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {user.is_superuser ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow"
            style={{background: 'linear-gradient(90deg, #9333EA 0%, #7C3AED 100%)'}}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
