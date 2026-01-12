import { useState, useEffect } from 'react';
import { Shield, Search, Filter, AlertTriangle, Eye, Trash2, Calendar } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import './SecurityAuditLogs.css';

interface AuditLog {
  timestamp: string;
  admin_username: string;
  admin_id: number;
  action_type: string;
  details: string;
  target_user?: string;
  target_model?: string;
  target_id?: number;
}

interface AuditSummary {
  total_actions: number;
  actions_last_24h: number;
  action_types: Record<string, number>;
  admin_activity: Record<string, number>;
  most_active_admin: string | null;
  most_common_action: string | null;
}

interface SuspiciousActivity {
  type: string;
  severity: 'low' | 'medium' | 'high';
  user_id?: number;
  username?: string;
  story_id?: number;
  story_title?: string;
  author?: string;
  details: string;
  timestamp: string;
}

export default function SecurityAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [suspicious, setSuspicious] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'summary' | 'suspicious'>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const { theme } = useThemeStore();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch audit logs from our new endpoint
      const logsRes = await fetch('http://localhost:8000/api/admin/audit-logs/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
      });
      
      if (!logsRes.ok) {
        throw new Error('Failed to load security data');
      }
      
      const logsData = await logsRes.json();
      
      if (logsData.success) {
        // Transform the data to match the expected format
        const transformedLogs = logsData.logs.map((log: any) => ({
          timestamp: log.timestamp,
          admin_username: log.user,
          admin_id: log.id,
          action_type: log.action,
          details: log.details,
          target_user: log.resource,
          target_model: log.resource,
          target_id: log.id,
        }));
        
        setLogs(transformedLogs);
        
        // Generate summary from logs
        const actionTypes: Record<string, number> = {};
        const adminActivity: Record<string, number> = {};
        let last24hCount = 0;
        const now = new Date();
        
        transformedLogs.forEach((log: any) => {
          // Count action types
          actionTypes[log.action_type] = (actionTypes[log.action_type] || 0) + 1;
          
          // Count admin activity
          adminActivity[log.admin_username] = (adminActivity[log.admin_username] || 0) + 1;
          
          // Count last 24h
          const logTime = new Date(log.timestamp);
          if ((now.getTime() - logTime.getTime()) < 24 * 60 * 60 * 1000) {
            last24hCount++;
          }
        });
        
        const mostActiveAdmin = Object.entries(adminActivity).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const mostCommonAction = Object.entries(actionTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        
        setSummary({
          total_actions: transformedLogs.length,
          actions_last_24h: last24hCount,
          action_types: actionTypes,
          admin_activity: adminActivity,
          most_active_admin: mostActiveAdmin,
          most_common_action: mostCommonAction,
        });
        
        // For now, no suspicious activity (can be enhanced later)
        setSuspicious([]);
      } else {
        throw new Error(logsData.error || 'Failed to load logs');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.admin_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = actionTypeFilter === 'all' || log.action_type === actionTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const actionTypes = Array.from(new Set(logs.map(log => log.action_type)));

  if (loading) {
    return (
      <div className="security-logs-loading">
        <div className="loading-spinner"></div>
        <p>Loading security logs...</p>
      </div>
    );
  }

  return (
    <div className="security-logs-container">
      <div className="security-logs-header">
        <div className="security-logs-header-content">
          <div className="security-logs-icon-wrapper">
            <Shield />
          </div>
          <div>
            <h2 className="security-logs-title">Security & Audit Logs</h2>
            <p className="security-logs-subtitle">Monitor admin actions and security events</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="security-alert security-alert-error">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="security-tabs">
        <button
          className={`security-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Eye size={18} />
          <span>Audit Logs</span>
          <span className="tab-badge">{logs.length}</span>
        </button>
        <button
          className={`security-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <Calendar size={18} />
          <span>Summary</span>
        </button>
        <button
          className={`security-tab ${activeTab === 'suspicious' ? 'active' : ''}`}
          onClick={() => setActiveTab('suspicious')}
        >
          <AlertTriangle size={18} />
          <span>Suspicious Activity</span>
          {suspicious.length > 0 && (
            <span className="tab-badge alert">{suspicious.length}</span>
          )}
        </button>
      </div>

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <>
          <div className="security-filters">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Actions</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="logs-list">
            {filteredLogs.length === 0 ? (
              <div className="logs-empty">
                <Shield size={48} />
                <p>No audit logs found</p>
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="log-entry">
                  <div className="log-header">
                    <span className="log-action-type">{log.action_type}</span>
                    <span className="log-timestamp">{formatDate(log.timestamp)}</span>
                  </div>
                  <div className="log-details">
                    <span className="log-admin">
                      <strong>Admin:</strong> {log.admin_username}
                    </span>
                    <span className="log-description">{log.details}</span>
                  </div>
                  {log.target_user && (
                    <div className="log-target">
                      <span>Target: {log.target_user}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <span className="summary-label">Total Actions</span>
              <span className="summary-value">{summary.total_actions.toLocaleString()}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">🔥</div>
            <div className="summary-content">
              <span className="summary-label">Last 24 Hours</span>
              <span className="summary-value">{summary.actions_last_24h.toLocaleString()}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">👤</div>
            <div className="summary-content">
              <span className="summary-label">Most Active Admin</span>
              <span className="summary-value">{summary.most_active_admin || 'N/A'}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">⚡</div>
            <div className="summary-content">
              <span className="summary-label">Most Common Action</span>
              <span className="summary-value">{summary.most_common_action || 'N/A'}</span>
            </div>
          </div>

          {/* Action Types Breakdown */}
          <div className="summary-section">
            <h3>Action Types</h3>
            <div className="action-types-list">
              {Object.entries(summary.action_types).map(([type, count]) => (
                <div key={type} className="action-type-item">
                  <span className="action-type-name">{type}</span>
                  <span className="action-type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Activity Breakdown */}
          <div className="summary-section">
            <h3>Admin Activity</h3>
            <div className="admin-activity-list">
              {Object.entries(summary.admin_activity).map(([admin, count]) => (
                <div key={admin} className="admin-activity-item">
                  <span className="admin-name">{admin}</span>
                  <span className="admin-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suspicious Activity Tab */}
      {activeTab === 'suspicious' && (
        <div className="suspicious-list">
          {suspicious.length === 0 ? (
            <div className="suspicious-empty">
              <Shield size={48} />
              <h3>No Suspicious Activity Detected</h3>
              <p>All systems operating normally</p>
            </div>
          ) : (
            suspicious.map((activity, index) => (
              <div key={index} className="suspicious-card" style={{ borderLeftColor: getSeverityColor(activity.severity) }}>
                <div className="suspicious-header">
                  <div className="suspicious-type">
                    <span className={`severity-badge ${activity.severity}`}>
                      {activity.severity.toUpperCase()}
                    </span>
                    <span className="suspicious-type-name">{activity.type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="suspicious-timestamp">{formatDate(activity.timestamp)}</span>
                </div>
                <div className="suspicious-details">
                  <p>{activity.details}</p>
                  {activity.username && (
                    <span className="suspicious-user">User: {activity.username}</span>
                  )}
                  {activity.author && (
                    <span className="suspicious-author">Author: {activity.author}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
