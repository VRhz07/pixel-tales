import { useState, useEffect } from 'react';
import { Activity, Database, Cpu, HardDrive, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import adminService from '../../services/admin.service';
import './SystemHealthDashboard.css';

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

interface SystemHealthDashboardProps {
  onRefresh?: () => void;
}

export default function SystemHealthDashboard({ onRefresh }: SystemHealthDashboardProps) {
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
      console.error('Error loading system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="status-icon" />;
      case 'warning':
        return <AlertTriangle className="status-icon" />;
      case 'critical':
        return <AlertTriangle className="status-icon" />;
      default:
        return <Activity className="status-icon" />;
    }
  };

  const getMetricStatus = (percent: number) => {
    if (percent < 70) return 'healthy';
    if (percent < 85) return 'warning';
    return 'critical';
  };

  if (loading && !healthData) {
    return (
      <div className="system-health-loading">
        <div className="loading-spinner"></div>
        <p>Loading system health...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-health-error">
        <AlertTriangle />
        <p>{error}</p>
        <button onClick={loadHealthData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className="system-health-container">
      {/* Overall Status Card */}
      <div className="health-overview-card" style={{ borderColor: getStatusColor(healthData.status) }}>
        <div className="health-overview-header">
          <div className="health-status-badge" style={{ backgroundColor: getStatusColor(healthData.status) }}>
            {getStatusIcon(healthData.status)}
            <span>{healthData.status.toUpperCase()}</span>
          </div>
          <button onClick={loadHealthData} className="refresh-button" disabled={loading}>
            <RefreshCw className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
        
        <div className="health-score-display">
          <div className="health-score-circle" style={{ 
            background: `conic-gradient(${getStatusColor(healthData.status)} ${healthData.health_score}%, ${theme === 'dark' ? '#374151' : '#e5e7eb'} 0)` 
          }}>
            <div className="health-score-inner">
              <span className="health-score-value">{healthData.health_score}</span>
              <span className="health-score-label">Health Score</span>
            </div>
          </div>
        </div>

        <div className="health-timestamp">
          <Clock size={14} />
          <span>Last updated: {new Date(healthData.timestamp).toLocaleString()}</span>
        </div>
      </div>

      {/* Server Resources */}
      <div className="health-section">
        <div className="health-section-header">
          <Cpu />
          <h3>Server Resources</h3>
        </div>
        
        <div className="health-metrics-grid">
          {/* CPU Usage */}
          <div className="health-metric-card">
            <div className="metric-header">
              <span className="metric-label">CPU Usage</span>
              <span className={`metric-status ${getMetricStatus(healthData.server.cpu_usage)}`}>
                {healthData.server.cpu_usage.toFixed(1)}%
              </span>
            </div>
            <div className="metric-progress-bar">
              <div 
                className={`metric-progress-fill ${getMetricStatus(healthData.server.cpu_usage)}`}
                style={{ width: `${healthData.server.cpu_usage}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="health-metric-card">
            <div className="metric-header">
              <span className="metric-label">Memory Usage</span>
              <span className={`metric-status ${getMetricStatus(healthData.server.memory_percent)}`}>
                {healthData.server.memory_percent.toFixed(1)}%
              </span>
            </div>
            <div className="metric-progress-bar">
              <div 
                className={`metric-progress-fill ${getMetricStatus(healthData.server.memory_percent)}`}
                style={{ width: `${healthData.server.memory_percent}%` }}
              />
            </div>
            <div className="metric-details">
              {formatBytes(healthData.server.memory_used)} / {formatBytes(healthData.server.memory_total)}
            </div>
          </div>

          {/* Disk Usage */}
          <div className="health-metric-card">
            <div className="metric-header">
              <span className="metric-label">Disk Usage</span>
              <span className={`metric-status ${getMetricStatus(healthData.server.disk_percent)}`}>
                {healthData.server.disk_percent.toFixed(1)}%
              </span>
            </div>
            <div className="metric-progress-bar">
              <div 
                className={`metric-progress-fill ${getMetricStatus(healthData.server.disk_percent)}`}
                style={{ width: `${healthData.server.disk_percent}%` }}
              />
            </div>
            <div className="metric-details">
              {formatBytes(healthData.server.disk_used)} / {formatBytes(healthData.server.disk_total)}
            </div>
          </div>
        </div>
      </div>

      {/* Database Metrics */}
      <div className="health-section">
        <div className="health-section-header">
          <Database />
          <h3>Database Performance</h3>
        </div>
        
        <div className="health-metrics-grid">
          <div className="health-info-card">
            <div className="info-icon">💾</div>
            <div className="info-content">
              <span className="info-label">Database Size</span>
              <span className="info-value">{healthData.database.size}</span>
            </div>
          </div>

          <div className="health-info-card">
            <div className="info-icon">🔌</div>
            <div className="info-content">
              <span className="info-label">Active Connections</span>
              <span className="info-value">{healthData.database.active_connections}</span>
            </div>
          </div>

          <div className="health-info-card">
            <div className="info-icon">⚡</div>
            <div className="info-content">
              <span className="info-label">Query Response Time</span>
              <span className={`info-value ${healthData.database.query_response_time_ms > 100 ? 'warning' : 'success'}`}>
                {healthData.database.query_response_time_ms.toFixed(2)} ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Application Info */}
      <div className="health-section">
        <div className="health-section-header">
          <Activity />
          <h3>Application Status</h3>
        </div>
        
        <div className="health-metrics-grid">
          <div className="health-info-card">
            <div className="info-icon">👥</div>
            <div className="info-content">
              <span className="info-label">Total Users</span>
              <span className="info-value">{healthData.application.total_users.toLocaleString()}</span>
            </div>
          </div>

          <div className="health-info-card">
            <div className="info-icon">📚</div>
            <div className="info-content">
              <span className="info-label">Total Stories</span>
              <span className="info-value">{healthData.application.total_stories.toLocaleString()}</span>
            </div>
          </div>

          <div className="health-info-card">
            <div className="info-icon">🐍</div>
            <div className="info-content">
              <span className="info-label">Python Version</span>
              <span className="info-value">{healthData.application.python_version}</span>
            </div>
          </div>

          <div className="health-info-card">
            <div className="info-icon">🎸</div>
            <div className="info-content">
              <span className="info-label">Django Version</span>
              <span className="info-value">{healthData.application.django_version}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
