import { useState, useEffect } from 'react';
import { Activity, Database, Cpu, HardDrive, Clock, AlertTriangle, CheckCircle, RefreshCw, Download, Users, FileText, BarChart3 } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import adminService from '../../services/admin.service';
import './SystemHealthDashboard.css';
import './BackupManagement.css';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  health_score: number;
  timestamp: string;
  server: {
    cpu_usage: number;
    memory_total: number;
    memory_used: number;
    memory_percent: number;
    disk_total: number;
    disk_used: number;
    disk_percent: number;
  };
  database: {
    size: string;
    active_connections: number;
    query_response_time_ms: number;
  };
  application: {
    total_users: number;
    total_stories: number;
    django_version: string;
    python_version: string;
  };
}

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useThemeStore();

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getSystemHealth();
      setHealthData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load immediately
    loadHealthData();
    
    // Then poll every 30 seconds for real-time updates
    const pollInterval = setInterval(() => {
      loadHealthData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(pollInterval);
  }, []);


  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };


  return (
    <div className="system-health-container">
      {/* Error Message */}
      {error && (
        <div className="backup-alert backup-alert-error">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* System Health Content */}
      <div className="system-header">
            <div className="system-header-content">
              <div className="system-icon-wrapper">
                <Activity />
              </div>
              <div>
                <h2 className="system-title">System Health Monitor</h2>
                <p className="system-subtitle">Real-time server and application metrics</p>
              </div>
            </div>
            <button onClick={loadHealthData} className="refresh-button" disabled={loading}>
              <RefreshCw className={loading ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>
      </div>

      {loading && !healthData && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading system health data...</p>
            </div>
      )}

      {healthData && (
            <>
              {/* Health Score Card */}
              <div className="health-score-card">
                <div className="health-score-content">
                  <div className="health-score-circle" style={{ 
                    border: `8px solid ${getStatusColor(healthData.status)}`,
                    boxShadow: `0 0 0 4px ${getStatusColor(healthData.status)}20`
                  }}>
                    <div className="health-score-inner">
                      <span className="health-score-value">{healthData.health_score}</span>
                      <span className="health-score-label">Score</span>
                    </div>
                  </div>
                  <div className="health-status-info">
                    <h3 style={{ color: getStatusColor(healthData.status) }}>
                      {healthData.status.toUpperCase()}
                    </h3>
                    <p>System is {healthData.status === 'healthy' ? 'running smoothly' : 'experiencing issues'}</p>
                    <p className="health-timestamp">
                      <Clock size={14} />
                      Last checked: {new Date(healthData.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-grid">
                {/* CPU */}
                <div className="metric-card">
                  <div className="metric-header">
                    <Cpu className="metric-icon" style={{ color: '#3b82f6' }} />
                    <h4>CPU Usage</h4>
                  </div>
                  <div className="metric-value">{healthData.server.cpu_usage.toFixed(1)}%</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-bar-fill" 
                      style={{ 
                        width: `${healthData.server.cpu_usage}%`,
                        backgroundColor: healthData.server.cpu_usage > 70 ? '#ef4444' : '#3b82f6'
                      }}
                    />
                  </div>
                </div>

                {/* Memory */}
                <div className="metric-card">
                  <div className="metric-header">
                    <HardDrive className="metric-icon" style={{ color: '#8b5cf6' }} />
                    <h4>Memory</h4>
                  </div>
                  <div className="metric-value">{healthData.server.memory_percent.toFixed(1)}%</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-bar-fill" 
                      style={{ 
                        width: `${healthData.server.memory_percent}%`,
                        backgroundColor: healthData.server.memory_percent > 70 ? '#ef4444' : '#8b5cf6'
                      }}
                    />
                  </div>
                  <p className="metric-detail">
                    {formatBytes(healthData.server.memory_used)} / {formatBytes(healthData.server.memory_total)}
                  </p>
                </div>

                {/* Disk */}
                <div className="metric-card">
                  <div className="metric-header">
                    <Database className="metric-icon" style={{ color: '#10b981' }} />
                    <h4>Disk Usage</h4>
                  </div>
                  <div className="metric-value">{healthData.server.disk_percent.toFixed(1)}%</div>
                  <div className="metric-bar">
                    <div 
                      className="metric-bar-fill" 
                      style={{ 
                        width: `${healthData.server.disk_percent}%`,
                        backgroundColor: healthData.server.disk_percent > 70 ? '#ef4444' : '#10b981'
                      }}
                    />
                  </div>
                  <p className="metric-detail">
                    {formatBytes(healthData.server.disk_used)} / {formatBytes(healthData.server.disk_total)}
                  </p>
                </div>
              </div>

              {/* Application Info */}
              <div className="info-grid">
                <div className="info-card">
                  <h4>Database</h4>
                  <div className="info-item">
                    <span>Size:</span>
                    <strong>{healthData.database.size}</strong>
                  </div>
                  <div className="info-item">
                    <span>Active Connections:</span>
                    <strong>{healthData.database.active_connections}</strong>
                  </div>
                  <div className="info-item">
                    <span>Query Response:</span>
                    <strong>{healthData.database.query_response_time_ms}ms</strong>
                  </div>
                </div>

                <div className="info-card">
                  <h4>Application</h4>
                  <div className="info-item">
                    <span>Total Users:</span>
                    <strong>{healthData.application.total_users.toLocaleString()}</strong>
                  </div>
                  <div className="info-item">
                    <span>Total Stories:</span>
                    <strong>{healthData.application.total_stories.toLocaleString()}</strong>
                  </div>
                  <div className="info-item">
                    <span>Django:</span>
                    <strong>v{healthData.application.django_version}</strong>
                  </div>
                  <div className="info-item">
                    <span>Python:</span>
                    <strong>v{healthData.application.python_version}</strong>
                  </div>
                </div>
          </div>
        </>
      )}
    </div>
  );
}
