/**
 * Sound Settings Component
 * Allows users to control sound effects and volume
 */

import { useState, useEffect } from 'react';
import soundService from '../../services/soundService';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface SoundSettingsProps {
  isDarkMode: boolean;
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ isDarkMode }) => {
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [volume, setVolume] = useState(soundService.getGlobalVolume());
  const { playButtonClick, playButtonToggle, playSuccess } = useSoundEffects();

  useEffect(() => {
    // Update service when settings change
    soundService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    soundService.setGlobalVolume(volume);
  }, [volume]);

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    
    // Play toggle sound if enabling
    if (newValue) {
      setTimeout(() => playButtonToggle(), 100);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleTestSound = () => {
    playSuccess();
  };

  return (
    <div 
      className="settings-section"
      style={{
        backgroundColor: isDarkMode ? '#2a2435' : '#ffffff',
        padding: '1.5rem',
        borderRadius: '1rem',
        marginBottom: '1rem',
        border: `1px solid ${isDarkMode ? '#3d3349' : '#e5e7eb'}`,
      }}
    >
      <h3 
        style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
        }}
      >
        🔊 Sound Effects
      </h3>

      {/* Enable/Disable Toggle */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <label 
            style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDarkMode ? '#e5e7eb' : '#374151',
              display: 'block',
              marginBottom: '0.25rem',
            }}
          >
            Enable Sound Effects
          </label>
          <p 
            style={{
              fontSize: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            Play sounds for buttons, notifications, and actions
          </p>
        </div>
        
        <button
          onClick={() => {
            playButtonClick();
            handleToggleSound();
          }}
          style={{
            width: '3rem',
            height: '1.75rem',
            borderRadius: '9999px',
            backgroundColor: soundEnabled 
              ? '#8b5cf6' 
              : (isDarkMode ? '#3d3349' : '#d1d5db'),
            border: 'none',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: '0.25rem',
              left: soundEnabled ? '1.5rem' : '0.25rem',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          />
        </button>
      </div>

      {/* Volume Slider */}
      {soundEnabled && (
        <div style={{ marginBottom: '1rem' }}>
          <label 
            style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isDarkMode ? '#e5e7eb' : '#374151',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Volume: {Math.round(volume * 100)}%
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1rem' }}>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                flex: 1,
                accentColor: '#8b5cf6',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '1rem' }}>🔊</span>
          </div>
        </div>
      )}

      {/* Test Sound Button */}
      {soundEnabled && (
        <button
          onClick={handleTestSound}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: isDarkMode ? '#3d3349' : '#f3f4f6',
            border: `1px solid ${isDarkMode ? '#4b4560' : '#d1d5db'}`,
            borderRadius: '0.5rem',
            color: isDarkMode ? '#e5e7eb' : '#374151',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#4b4560' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#3d3349' : '#f3f4f6';
          }}
        >
          🎵 Test Sound
        </button>
      )}

      {/* Info Text */}
      <p 
        style={{
          fontSize: '0.75rem',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          marginTop: '1rem',
          lineHeight: '1.5',
        }}
      >
        💡 Tip: Sounds enhance the app experience with subtle feedback for your actions. 
        {' '}You can adjust the volume or turn them off completely.
      </p>
    </div>
  );
};
