import React, { useState, useEffect } from 'react';
import { apiConfigService, API_PRESETS, ApiPreset } from '../../services/apiConfig.service';
import './DeveloperModeModal.css';

interface DeveloperModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeveloperModeModal: React.FC<DeveloperModeModalProps> = ({ isOpen, onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [customUrl, setCustomUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = apiConfigService.getApiUrl();
      setCurrentUrl(current);
      
      // Check if current URL matches a preset
      const matchingPreset = API_PRESETS.find(preset => preset.url === current);
      if (matchingPreset) {
        setSelectedPreset(matchingPreset.id);
      } else {
        setSelectedPreset('custom');
        setCustomUrl(current);
      }
      
      setTestResult(null);
    }
  }, [isOpen]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    setTestResult(null);
    
    if (presetId !== 'custom') {
      const preset = API_PRESETS.find(p => p.id === presetId);
      if (preset) {
        setCustomUrl(preset.url);
      }
    }
  };

  const handleSave = () => {
    try {
      // Get the URL to save based on selected preset
      const urlToSave = selectedPreset === 'custom' ? customUrl : 
        API_PRESETS.find(p => p.id === selectedPreset)?.url || customUrl;
      
      if (!urlToSave) {
        alert('Please enter a valid URL');
        return;
      }
      
      // Always save the URL (even for production preset)
      apiConfigService.setApiUrl(urlToSave);
      
      alert('API URL updated! Please restart the app for changes to take effect.');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to save API URL');
      }
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const urlToTest = selectedPreset === 'custom' ? customUrl : 
        API_PRESETS.find(p => p.id === selectedPreset)?.url || customUrl;
      
      if (!urlToTest) {
        setTestResult({ success: false, message: 'Please enter a URL to test' });
        return;
      }
      
      const result = await apiConfigService.testConnection(urlToTest);
      setTestResult(result);
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Test failed' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to production server?')) {
      apiConfigService.resetToDefault();
      setCurrentUrl(apiConfigService.getDefaultUrl());
      setSelectedPreset('production');
      setTestResult(null);
      alert('Reset to production! Please restart the app.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dev-modal-overlay" onClick={onClose}>
      <div className="dev-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="dev-modal-header">
          <h2>🔧 Developer Mode</h2>
          <button className="dev-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="dev-modal-body">
          {/* Current Configuration */}
          <div className="dev-current-config">
            <h3>Current API URL:</h3>
            <div className="dev-current-url">{currentUrl}</div>
            {apiConfigService.isUsingCustomUrl() && (
              <span className="dev-custom-badge">Custom</span>
            )}
          </div>

          {/* Presets */}
          <div className="dev-presets">
            <h3>Quick Presets:</h3>
            {API_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`dev-preset-item ${selectedPreset === preset.id ? 'selected' : ''}`}
                onClick={() => handlePresetChange(preset.id)}
              >
                <div className="dev-preset-icon">{preset.icon}</div>
                <div className="dev-preset-info">
                  <div className="dev-preset-name">{preset.name}</div>
                  <div className="dev-preset-desc">{preset.description}</div>
                  <div className="dev-preset-url">{preset.url}</div>
                </div>
                <div className="dev-preset-radio">
                  {selectedPreset === preset.id && '✓'}
                </div>
              </div>
            ))}

            {/* Custom URL Option */}
            <div
              className={`dev-preset-item ${selectedPreset === 'custom' ? 'selected' : ''}`}
              onClick={() => handlePresetChange('custom')}
            >
              <div className="dev-preset-icon">⚡</div>
              <div className="dev-preset-info">
                <div className="dev-preset-name">Custom URL</div>
                <div className="dev-preset-desc">Enter your own API endpoint</div>
              </div>
              <div className="dev-preset-radio">
                {selectedPreset === 'custom' && '✓'}
              </div>
            </div>
          </div>

          {/* Custom URL Input */}
          {selectedPreset === 'custom' && (
            <div className="dev-custom-input">
              <label>Custom API URL:</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="http://192.168.1.100:8000"
                className="dev-url-input"
              />
              <div className="dev-input-hint">
                💡 Example: http://192.168.1.100:8000
              </div>
            </div>
          )}

          {/* Test Connection */}
          <div className="dev-test-section">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="dev-test-button"
            >
              {isTesting ? '⏳ Testing...' : '🔍 Test Connection'}
            </button>
            
            {testResult && (
              <div className={`dev-test-result ${testResult.success ? 'success' : 'error'}`}>
                <span className="dev-test-icon">
                  {testResult.success ? '✅' : '❌'}
                </span>
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="dev-instructions">
            <h4>📝 How to use:</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>🔌 Method 1: USB (Recommended - Always Works!)</strong>
              <ol style={{ marginTop: '8px' }}>
                <li>Connect phone via USB cable</li>
                <li>Run: <code>setup-usb-testing.bat</code> on laptop</li>
                <li>Select "Localhost (ADB)" preset</li>
                <li>Test & Save - No WiFi needed!</li>
              </ol>
            </div>
            
            <div>
              <strong>📶 Method 2: WiFi (If Router Allows)</strong>
              <ol style={{ marginTop: '8px' }}>
                <li>Find laptop IP: <code>ipconfig</code></li>
                <li>Start backend: <code>python manage.py runserver 0.0.0.0:8000</code></li>
                <li>Test in phone browser first: <code>http://YOUR_IP:8000/api/</code></li>
                <li>If that works, enter custom URL here</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="dev-modal-footer">
          <button onClick={handleReset} className="dev-reset-button">
            🔄 Reset to Production
          </button>
          <div className="dev-footer-actions">
            <button onClick={onClose} className="dev-cancel-button">
              Cancel
            </button>
            <button onClick={handleSave} className="dev-save-button">
              💾 Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperModeModal;
