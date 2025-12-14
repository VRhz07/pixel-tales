/**
 * Sound Settings Component
 * Allows users to control sound effects and volume
 */

import { useState, useEffect } from 'react';
import soundService, { BackgroundMusicTrack } from '../../services/soundService';
import { useSoundEffects } from '../../hooks/useSoundEffects';

interface SoundSettingsProps {
  isDarkMode: boolean;
}

export const SoundSettings: React.FC<SoundSettingsProps> = ({ isDarkMode }) => {
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [volume, setVolume] = useState(soundService.getGlobalVolume());
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(soundService.isBackgroundMusicEnabled());
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(soundService.getBackgroundMusicVolume());
  const [selectedTrack, setSelectedTrack] = useState<BackgroundMusicTrack>(soundService.getSelectedMusicTrack());
  const [currentTrackName, setCurrentTrackName] = useState<string | null>(soundService.getCurrentTrackName());
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

  const handleToggleBackgroundMusic = () => {
    const newValue = !backgroundMusicEnabled;
    setBackgroundMusicEnabled(newValue);
    soundService.setBackgroundMusicEnabled(newValue);
    
    if (newValue) {
      playButtonToggle();
    }
  };

  const handleBackgroundMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setBackgroundMusicVolume(newVolume);
    soundService.setBackgroundMusicVolume(newVolume);
  };

  const handleTrackChange = (track: BackgroundMusicTrack) => {
    setSelectedTrack(track);
    soundService.setBackgroundMusicTrack(track);
    playButtonClick();
    
    // Update current track name after a short delay (to let the track switch)
    setTimeout(() => {
      setCurrentTrackName(soundService.getCurrentTrackName());
    }, 1000);
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

      {/* Background Music Section */}
      <div 
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: `1px solid ${isDarkMode ? '#3d3349' : '#e5e7eb'}`,
        }}
      >
        <h4 
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
          }}
        >
          🎵 Background Music
        </h4>

        {/* Enable/Disable Background Music */}
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
              Enable Background Music
            </label>
            <p 
              style={{
                fontSize: '0.75rem',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
              }}
            >
              {backgroundMusicEnabled ? 'Playful music while you create' : 'Music disabled'}
            </p>
          </div>
          
          <button
            onClick={() => {
              playButtonClick();
              handleToggleBackgroundMusic();
            }}
            style={{
              width: '3rem',
              height: '1.75rem',
              borderRadius: '9999px',
              backgroundColor: backgroundMusicEnabled 
                ? '#8b5cf6' 
                : (isDarkMode ? '#3d3349' : '#d1d5db'),
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
            aria-label="Toggle background music"
          >
            <div
              style={{
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                position: 'absolute',
                top: '0.25rem',
                left: backgroundMusicEnabled ? '1.5rem' : '0.25rem',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            />
          </button>
        </div>

        {/* Background Music Volume Slider */}
        {backgroundMusicEnabled && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: isDarkMode ? '#e5e7eb' : '#374151',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                Adjust background music volume ({Math.round(backgroundMusicVolume * 100)}%)
              </label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1rem' }}>🔈</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={backgroundMusicVolume}
                  onChange={handleBackgroundMusicVolumeChange}
                  style={{
                    flex: 1,
                    accentColor: '#8b5cf6',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '1rem' }}>🔊</span>
              </div>
            </div>

            {/* Track Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label 
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: isDarkMode ? '#e5e7eb' : '#374151',
                  display: 'block',
                  marginBottom: '0.75rem',
                }}
              >
                Choose Music Track
              </label>
              
              {currentTrackName && (
                <p 
                  style={{
                    fontSize: '0.75rem',
                    color: isDarkMode ? '#a78bfa' : '#8b5cf6',
                    marginBottom: '0.75rem',
                    fontStyle: 'italic',
                  }}
                >
                  ♪ Now playing: {currentTrackName}
                </p>
              )}

              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                }}
              >
                {soundService.getAvailableTracks().map((track) => (
                  <button
                    key={track}
                    onClick={() => handleTrackChange(track)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: selectedTrack === track
                        ? (isDarkMode ? '#6d28d9' : '#a78bfa')
                        : (isDarkMode ? '#3d3349' : '#f3f4f6'),
                      border: `2px solid ${
                        selectedTrack === track
                          ? (isDarkMode ? '#7c3aed' : '#8b5cf6')
                          : (isDarkMode ? '#4b4560' : '#d1d5db')
                      }`,
                      borderRadius: '0.5rem',
                      color: selectedTrack === track
                        ? '#ffffff'
                        : (isDarkMode ? '#e5e7eb' : '#374151'),
                      fontSize: '0.75rem',
                      fontWeight: selectedTrack === track ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTrack !== track) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#4b4560' : '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTrack !== track) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#3d3349' : '#f3f4f6';
                      }
                    }}
                  >
                    {soundService.getTrackDisplayName(track)}
                  </button>
                ))}
              </div>
            </div>

            <p 
              style={{
                fontSize: '0.75rem',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                marginTop: '0.75rem',
                lineHeight: '1.5',
              }}
            >
              💡 Select "Random" to hear a different song each time, or choose your favorite track!
            </p>
          </>
        )}
      </div>
    </div>
  );
};
