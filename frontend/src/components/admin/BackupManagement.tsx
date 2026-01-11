import { useState, useEffect } from 'react';
import { Database, Download, Trash2, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import './BackupManagement.css';

interface Backup {
  filename: string;
  size: number;
  created_at: string;
}

export default function BackupManagement() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { theme } = useThemeStore();

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/backups/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load backups');
      }
      
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    if (!confirm('Create a new database backup? This may take a few moments.')) return;
    
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/backups/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create backup');
      }
      
      const data = await response.json();
      setSuccess(`Backup created successfully: ${data.backup.filename}`);
      loadBackups();
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating backup:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Delete backup "${filename}"? This action cannot be undone.`)) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/admin/backups/${filename}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete backup');
      }
      
      setSuccess(`Backup deleted: ${filename}`);
      loadBackups();
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting backup:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="backup-management-container">
      <div className="backup-header">
        <div className="backup-header-content">
          <div className="backup-icon-wrapper">
            <Database />
          </div>
          <div>
            <h2 className="backup-title">Database Backups</h2>
            <p className="backup-subtitle">Manage and restore database backups</p>
          </div>
        </div>
        
        <button 
          onClick={handleCreateBackup} 
          disabled={creating}
          className="create-backup-button"
        >
          <Plus />
          <span>{creating ? 'Creating...' : 'Create Backup'}</span>
        </button>
      </div>

      {error && (
        <div className="backup-alert backup-alert-error">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="backup-alert backup-alert-success">
          <CheckCircle />
          <span>{success}</span>
        </div>
      )}

      <div className="backup-info-box">
        <div className="info-box-icon">ℹ️</div>
        <div className="info-box-content">
          <strong>Important:</strong> Backups are stored locally on the server. 
          For production environments, consider setting up automated backups to external storage 
          (AWS S3, Google Cloud Storage, etc.) for disaster recovery.
        </div>
      </div>

      {loading ? (
        <div className="backup-loading">
          <div className="loading-spinner"></div>
          <p>Loading backups...</p>
        </div>
      ) : backups.length === 0 ? (
        <div className="backup-empty">
          <Database size={64} />
          <h3>No backups found</h3>
          <p>Create your first backup to secure your data</p>
        </div>
      ) : (
        <div className="backups-list">
          {backups.map((backup) => (
            <div key={backup.filename} className="backup-card">
              <div className="backup-card-icon">
                <Database />
              </div>
              
              <div className="backup-card-content">
                <div className="backup-card-header">
                  <h4 className="backup-filename">{backup.filename}</h4>
                  <span className="backup-size">{formatBytes(backup.size)}</span>
                </div>
                
                <div className="backup-card-meta">
                  <div className="backup-meta-item">
                    <Clock size={14} />
                    <span>{formatDate(backup.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="backup-card-actions">
                <button
                  onClick={() => handleDeleteBackup(backup.filename)}
                  className="backup-action-button delete"
                  title="Delete backup"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="backup-footer">
        <div className="backup-stats">
          <div className="backup-stat">
            <span className="stat-label">Total Backups:</span>
            <span className="stat-value">{backups.length}</span>
          </div>
          <div className="backup-stat">
            <span className="stat-label">Total Size:</span>
            <span className="stat-value">
              {formatBytes(backups.reduce((sum, b) => sum + b.size, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
