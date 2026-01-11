import { useState, useEffect } from 'react';
import { Zap, Save, AlertTriangle, CheckCircle, Settings, TestTube } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import './AIServicesConfig.css';

interface AIConfig {
  ai_story_generation: {
    provider: string;
    model: string;
    enabled: boolean;
    max_tokens: number;
    temperature: number;
  };
  image_generation: {
    provider: string;
    enabled: boolean;
    default_model: string;
    max_requests_per_day: number;
  };
  ocr: {
    provider: string;
    enabled: boolean;
    languages: string[];
    confidence_threshold: number;
  };
  rate_limits: {
    ai_generation_per_user_per_day: number;
    image_generation_per_user_per_day: number;
    ocr_per_user_per_day: number;
  };
  api_keys: {
    gemini_key_set: boolean;
    google_vision_key_set: boolean;
  };
}

export default function AIServicesConfig() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { theme } = useThemeStore();

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/ai-services/config/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load AI services configuration');
      }
      
      const data = await response.json();
      setConfig(data.config);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading AI config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/ai-services/config/update/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save AI services configuration');
      }
      
      setSuccess('AI services configuration saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving AI config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestService = async (serviceType: string) => {
    try {
      setTesting(serviceType);
      setError(null);
      
      const response = await fetch('/api/admin/ai-services/test/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service_type: serviceType }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`${serviceType} test successful!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(`${serviceType} test failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Test failed: ${err.message}`);
    } finally {
      setTesting(null);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;
    
    const keys = path.split('.');
    const newConfig = JSON.parse(JSON.stringify(config));
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="ai-config-loading">
        <div className="loading-spinner"></div>
        <p>Loading AI services configuration...</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="ai-config-container">
      <div className="ai-config-header">
        <div className="ai-config-header-content">
          <div className="ai-config-icon-wrapper">
            <Zap />
          </div>
          <div>
            <h2 className="ai-config-title">AI Services Configuration</h2>
            <p className="ai-config-subtitle">Manage AI, OCR, and image generation settings</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="save-config-button"
        >
          <Save />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {error && (
        <div className="config-alert config-alert-error">
          <AlertTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="config-alert config-alert-success">
          <CheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* API Keys Status */}
      <div className="config-section">
        <div className="config-section-header">
          <Settings />
          <h3>API Keys Status</h3>
        </div>
        
        <div className="api-keys-status">
          <div className={`api-key-status ${config.api_keys.gemini_key_set ? 'configured' : 'missing'}`}>
            <div className="status-indicator"></div>
            <div className="status-info">
              <span className="status-label">Gemini API Key</span>
              <span className="status-value">
                {config.api_keys.gemini_key_set ? 'Configured' : 'Not Set'}
              </span>
            </div>
          </div>
          
          <div className={`api-key-status ${config.api_keys.google_vision_key_set ? 'configured' : 'missing'}`}>
            <div className="status-indicator"></div>
            <div className="status-info">
              <span className="status-label">Google Vision API Key</span>
              <span className="status-value">
                {config.api_keys.google_vision_key_set ? 'Configured' : 'Not Set'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="api-keys-note">
          <span>💡 API keys are managed through environment variables for security.</span>
        </div>
      </div>

      {/* AI Story Generation */}
      <div className="config-section">
        <div className="config-section-header">
          <Settings />
          <h3>AI Story Generation</h3>
          <button
            onClick={() => handleTestService('ai_generation')}
            disabled={testing === 'ai_generation' || !config.ai_story_generation.enabled}
            className="test-service-button"
          >
            <TestTube size={16} />
            <span>{testing === 'ai_generation' ? 'Testing...' : 'Test'}</span>
          </button>
        </div>
        
        <div className="config-grid">
          <div className="config-input-group">
            <label>Provider</label>
            <select
              value={config.ai_story_generation.provider}
              onChange={(e) => updateConfig('ai_story_generation.provider', e.target.value)}
            >
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          
          <div className="config-input-group">
            <label>Model</label>
            <select
              value={config.ai_story_generation.model}
              onChange={(e) => updateConfig('ai_story_generation.model', e.target.value)}
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
          </div>
          
          <div className="config-input-group">
            <label>Max Tokens</label>
            <input
              type="number"
              value={config.ai_story_generation.max_tokens}
              onChange={(e) => updateConfig('ai_story_generation.max_tokens', parseInt(e.target.value))}
              min="100"
              max="8000"
            />
          </div>
          
          <div className="config-input-group">
            <label>Temperature</label>
            <input
              type="number"
              step="0.1"
              value={config.ai_story_generation.temperature}
              onChange={(e) => updateConfig('ai_story_generation.temperature', parseFloat(e.target.value))}
              min="0"
              max="2"
            />
            <span className="input-hint">Controls creativity (0-2)</span>
          </div>
        </div>
        
        <div className="config-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.ai_story_generation.enabled}
              onChange={(e) => updateConfig('ai_story_generation.enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Enable AI Story Generation</span>
          </label>
        </div>
      </div>

      {/* Image Generation */}
      <div className="config-section">
        <div className="config-section-header">
          <Settings />
          <h3>Image Generation</h3>
          <button
            onClick={() => handleTestService('image_generation')}
            disabled={testing === 'image_generation' || !config.image_generation.enabled}
            className="test-service-button"
          >
            <TestTube size={16} />
            <span>{testing === 'image_generation' ? 'Testing...' : 'Test'}</span>
          </button>
        </div>
        
        <div className="config-grid">
          <div className="config-input-group">
            <label>Provider</label>
            <select
              value={config.image_generation.provider}
              onChange={(e) => updateConfig('image_generation.provider', e.target.value)}
            >
              <option value="pollinations">Pollinations AI</option>
              <option value="replicate">Replicate</option>
            </select>
          </div>
          
          <div className="config-input-group">
            <label>Default Model</label>
            <select
              value={config.image_generation.default_model}
              onChange={(e) => updateConfig('image_generation.default_model', e.target.value)}
            >
              <option value="flux">FLUX</option>
              <option value="turbo">Turbo</option>
            </select>
          </div>
          
          <div className="config-input-group">
            <label>Max Requests Per Day</label>
            <input
              type="number"
              value={config.image_generation.max_requests_per_day}
              onChange={(e) => updateConfig('image_generation.max_requests_per_day', parseInt(e.target.value))}
              min="10"
              max="1000"
            />
          </div>
        </div>
        
        <div className="config-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.image_generation.enabled}
              onChange={(e) => updateConfig('image_generation.enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Enable Image Generation</span>
          </label>
        </div>
      </div>

      {/* OCR */}
      <div className="config-section">
        <div className="config-section-header">
          <Settings />
          <h3>OCR (Optical Character Recognition)</h3>
          <button
            onClick={() => handleTestService('ocr')}
            disabled={testing === 'ocr' || !config.ocr.enabled}
            className="test-service-button"
          >
            <TestTube size={16} />
            <span>{testing === 'ocr' ? 'Testing...' : 'Test'}</span>
          </button>
        </div>
        
        <div className="config-grid">
          <div className="config-input-group">
            <label>Provider</label>
            <select
              value={config.ocr.provider}
              onChange={(e) => updateConfig('ocr.provider', e.target.value)}
            >
              <option value="google_vision">Google Vision API</option>
            </select>
          </div>
          
          <div className="config-input-group">
            <label>Confidence Threshold</label>
            <input
              type="number"
              step="0.1"
              value={config.ocr.confidence_threshold}
              onChange={(e) => updateConfig('ocr.confidence_threshold', parseFloat(e.target.value))}
              min="0"
              max="1"
            />
            <span className="input-hint">Minimum confidence (0-1)</span>
          </div>
        </div>
        
        <div className="config-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.ocr.enabled}
              onChange={(e) => updateConfig('ocr.enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Enable OCR</span>
          </label>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="config-section">
        <div className="config-section-header">
          <Settings />
          <h3>Rate Limits (Per User Per Day)</h3>
        </div>
        
        <div className="config-grid">
          <div className="config-input-group">
            <label>AI Story Generation</label>
            <input
              type="number"
              value={config.rate_limits.ai_generation_per_user_per_day}
              onChange={(e) => updateConfig('rate_limits.ai_generation_per_user_per_day', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
          
          <div className="config-input-group">
            <label>Image Generation</label>
            <input
              type="number"
              value={config.rate_limits.image_generation_per_user_per_day}
              onChange={(e) => updateConfig('rate_limits.image_generation_per_user_per_day', parseInt(e.target.value))}
              min="1"
              max="200"
            />
          </div>
          
          <div className="config-input-group">
            <label>OCR Processing</label>
            <input
              type="number"
              value={config.rate_limits.ocr_per_user_per_day}
              onChange={(e) => updateConfig('rate_limits.ocr_per_user_per_day', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
