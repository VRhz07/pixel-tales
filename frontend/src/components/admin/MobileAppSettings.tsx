import { useState, useEffect } from 'react';
import { Smartphone, Save, AlertTriangle, CheckCircle, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import './MobileAppSettings.css';

interface MobileSettings {
  app_version: {
    ios: string;
    android: string;
    min_ios: string;
    min_android: string;
  };
  features: {
    ai_story_generation: boolean;
    photo_story_ocr: boolean;
    collaboration: boolean;
    games: boolean;
    social_features: boolean;
    offline_mode: boolean;
  };
  limits: {
    max_stories_per_day: number;
    max_image_size_mb: number;
    max_story_length: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    scheduled_start: string | null;
    scheduled_end: string | null;
  };
  notifications: {
    push_enabled: boolean;
    marketing_enabled: boolean;
  };
}

export default function MobileAppSettings() {
  const [settings, setSettings] = useState<MobileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { theme } = useThemeStore();

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/mobile/settings/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load mobile settings');
      }
      
      const data = await response.json();
      setSettings(data.settings);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading mobile settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/mobile/settings/update/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save mobile settings');
      }
      
      setSuccess('Mobile settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving mobile settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    if (!settings) return;
    
    const keys = path.split('.');
    const newSettings = JSON.parse(JSON.stringify(settings));
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="mobile-settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading mobile settings...</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="mobile-settings-container">
      <div className="mobile-settings-header">
        <div className="mobile-settings-header-content">
          <div className="mobile-settings-icon-wrapper">
            <Smartphone />
          </div>
          <div>
            <h2 className="mobile-settings-title">Mobile App Configuration</h2>
            <p className="mobile-settings-subtitle">Manage app versions, features, and limits</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="save-settings-button"
        >
          <Save />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {error && (
        <div className="settings-alert settings-alert-error">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="settings-alert settings-alert-success">
          <CheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* App Versions */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Settings />
          <h3>App Versions</h3>
        </div>
        
        <div className="settings-grid">
          <div className="settings-input-group">
            <label>iOS Current Version</label>
            <input
              type="text"
              value={settings.app_version.ios}
              onChange={(e) => updateSetting('app_version.ios', e.target.value)}
              placeholder="1.0.0"
            />
          </div>
          
          <div className="settings-input-group">
            <label>iOS Minimum Version</label>
            <input
              type="text"
              value={settings.app_version.min_ios}
              onChange={(e) => updateSetting('app_version.min_ios', e.target.value)}
              placeholder="1.0.0"
            />
          </div>
          
          <div className="settings-input-group">
            <label>Android Current Version</label>
            <input
              type="text"
              value={settings.app_version.android}
              onChange={(e) => updateSetting('app_version.android', e.target.value)}
              placeholder="1.0.0"
            />
          </div>
          
          <div className="settings-input-group">
            <label>Android Minimum Version</label>
            <input
              type="text"
              value={settings.app_version.min_android}
              onChange={(e) => updateSetting('app_version.min_android', e.target.value)}
              placeholder="1.0.0"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Settings />
          <h3>Feature Toggles</h3>
        </div>
        
        <div className="settings-toggles">
          {Object.entries(settings.features).map(([key, value]) => (
            <div key={key} className="settings-toggle-item">
              <div className="toggle-info">
                <span className="toggle-label">
                  {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
                <span className={`toggle-status ${value ? 'enabled' : 'disabled'}`}>
                  {value ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <button
                onClick={() => updateSetting(`features.${key}`, !value)}
                className={`toggle-button ${value ? 'active' : ''}`}
              >
                {value ? <ToggleRight /> : <ToggleLeft />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Limits */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Settings />
          <h3>User Limits</h3>
        </div>
        
        <div className="settings-grid">
          <div className="settings-input-group">
            <label>Max Stories Per Day</label>
            <input
              type="number"
              value={settings.limits.max_stories_per_day}
              onChange={(e) => updateSetting('limits.max_stories_per_day', parseInt(e.target.value))}
              min="1"
              max="100"
            />
            <span className="input-hint">Stories a user can create daily</span>
          </div>
          
          <div className="settings-input-group">
            <label>Max Image Size (MB)</label>
            <input
              type="number"
              value={settings.limits.max_image_size_mb}
              onChange={(e) => updateSetting('limits.max_image_size_mb', parseInt(e.target.value))}
              min="1"
              max="50"
            />
            <span className="input-hint">Maximum image upload size</span>
          </div>
          
          <div className="settings-input-group">
            <label>Max Story Length</label>
            <input
              type="number"
              value={settings.limits.max_story_length}
              onChange={(e) => updateSetting('limits.max_story_length', parseInt(e.target.value))}
              min="100"
              max="50000"
            />
            <span className="input-hint">Maximum characters in a story</span>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Settings />
          <h3>Maintenance Mode</h3>
        </div>
        
        <div className="maintenance-toggle">
          <div className="toggle-info">
            <span className="toggle-label">Enable Maintenance Mode</span>
            <span className={`toggle-status ${settings.maintenance.enabled ? 'enabled' : 'disabled'}`}>
              {settings.maintenance.enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button
            onClick={() => updateSetting('maintenance.enabled', !settings.maintenance.enabled)}
            className={`toggle-button ${settings.maintenance.enabled ? 'active' : ''}`}
          >
            {settings.maintenance.enabled ? <ToggleRight /> : <ToggleLeft />}
          </button>
        </div>
        
        {settings.maintenance.enabled && (
          <div className="settings-input-group" style={{ marginTop: '16px' }}>
            <label>Maintenance Message</label>
            <textarea
              value={settings.maintenance.message}
              onChange={(e) => updateSetting('maintenance.message', e.target.value)}
              placeholder="App is under maintenance. Please check back later."
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Settings />
          <h3>Push Notifications</h3>
        </div>
        
        <div className="settings-toggles">
          <div className="settings-toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Push Notifications</span>
              <span className={`toggle-status ${settings.notifications.push_enabled ? 'enabled' : 'disabled'}`}>
                {settings.notifications.push_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <button
              onClick={() => updateSetting('notifications.push_enabled', !settings.notifications.push_enabled)}
              className={`toggle-button ${settings.notifications.push_enabled ? 'active' : ''}`}
            >
              {settings.notifications.push_enabled ? <ToggleRight /> : <ToggleLeft />}
            </button>
          </div>
          
          <div className="settings-toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">Marketing Notifications</span>
              <span className={`toggle-status ${settings.notifications.marketing_enabled ? 'enabled' : 'disabled'}`}>
                {settings.notifications.marketing_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <button
              onClick={() => updateSetting('notifications.marketing_enabled', !settings.notifications.marketing_enabled)}
              className={`toggle-button ${settings.notifications.marketing_enabled ? 'active' : ''}`}
            >
              {settings.notifications.marketing_enabled ? <ToggleRight /> : <ToggleLeft />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
