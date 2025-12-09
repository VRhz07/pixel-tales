import React, { useState } from 'react';
import { 
  SpeakerWaveIcon, 
  PauseIcon, 
  PlayIcon, 
  StopIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useI18nStore } from '../../stores/i18nStore';
import { CustomDropdown } from './CustomDropdown';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';
import { useMediaNotification } from '../../hooks/useMediaNotification';

interface TTSControlsProps {
  text: string;
  autoPlay?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  storyTitle?: string; // For media notification
  storyLanguage?: 'en' | 'tl'; // Story's language for proper voice selection
}

export const TTSControls: React.FC<TTSControlsProps> = ({ 
  text, 
  autoPlay = false,
  showProgress = true,
  compact = false,
  storyTitle = 'Story',
  storyLanguage // Story language for TTS
}) => {
  const { t } = useI18nStore();
  const {
    speak,
    pause,
    resume,
    stop,
    seek,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentVoice,
    setVoice,
    rate,
    setRate,
    volume,
    setVolume,
    progress,
    cloudVoiceId,
    setCloudVoiceId,
    useCloudTTS,
    setUseCloudTTS,
    isOnline
  } = useTextToSpeech({ storyLanguage });

  const [showSettings, setShowSettings] = useState(false);
  const isNativePlatform = Capacitor.isNativePlatform();

  // Media notification integration
  const {
    showNotification,
    hideNotification,
    updateNotification,
    isSupported: isNotificationSupported
  } = useMediaNotification({
    onPlay: () => {
      console.log('📱 Media notification: Play pressed');
      if (isPaused) {
        resume();
      } else if (!isSpeaking && text) {
        speak(text);
      }
    },
    onPause: () => {
      console.log('📱 Media notification: Pause pressed');
      pause();
    },
    onStop: () => {
      console.log('📱 Media notification: Stop pressed');
      stop();
    }
  });

  // Update notification when TTS state changes
  React.useEffect(() => {
    if (!isNotificationSupported || !isNativePlatform) return;

    if (isSpeaking || isPaused) {
      const notificationText = `${isPaused ? 'Paused' : 'Playing'} - ${Math.round(progress)}%`;
      
      if (isSpeaking && !isPaused) {
        // Currently playing
        showNotification(storyTitle, notificationText, true);
      } else if (isPaused) {
        // Paused
        updateNotification(storyTitle, notificationText, false);
      }
    } else {
      // Stopped
      hideNotification();
    }
  }, [isSpeaking, isPaused, progress, storyTitle, isNotificationSupported, isNativePlatform]);

  // Clean up notification on unmount
  React.useEffect(() => {
    return () => {
      if (isNotificationSupported && isNativePlatform) {
        hideNotification();
      }
    };
  }, [isNotificationSupported, isNativePlatform]);
  
  const handleInstallTTS = async () => {
    if (!isNativePlatform) {
      alert('This feature is only available on mobile devices.');
      return;
    }
    
    try {
      await TextToSpeech.openInstall();
    } catch (error) {
      console.error('Error opening TTS install:', error);
      alert('Please install "Google Text-to-Speech" from the Play Store for better voice quality, including Filipino voices.');
    }
  };

  // Auto-play on mount if enabled
  React.useEffect(() => {
    if (autoPlay && text && isSupported) {
      speak(text);
    }
  }, [autoPlay]); // Only run once on mount

  if (!isSupported) {
    return null; // Hide controls if TTS not supported
  }

  const handlePlayPause = () => {
    if (!isSpeaking) {
      speak(text);
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleVoiceChange = (value: string) => {
    const voice = voices.find(v => v.name === value) || null;
    setVoice(voice);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    seek(newProgress);
  };

  const handleProgressBarDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Only handle left mouse button
    handleProgressBarClick(e);
  };

  if (compact) {
    return (
      <div className="tts-controls-compact">
        <button
          onClick={handlePlayPause}
          className="tts-button-compact"
          title={isSpeaking ? (isPaused ? t('tts.resume') : t('tts.pause')) : t('tts.play')}
        >
          {isSpeaking ? (
            isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5" />
          )}
        </button>
        {isSpeaking && (
          <button
            onClick={handleStop}
            className="tts-button-compact"
            title={t('tts.stop')}
          >
            <StopIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="tts-controls">
      {/* Main Controls */}
      <div className="tts-controls-main">
        <button
          onClick={handlePlayPause}
          className="tts-button-primary"
          disabled={!text}
        >
          {isSpeaking ? (
            isPaused ? (
              <>
                <PlayIcon className="w-5 h-5" />
                <span>{t('tts.resume')}</span>
              </>
            ) : (
              <>
                <PauseIcon className="w-5 h-5" />
                <span>{t('tts.pause')}</span>
              </>
            )
          ) : (
            <>
              <SpeakerWaveIcon className="w-5 h-5" />
              <span>{t('tts.listen')}</span>
            </>
          )}
        </button>

        {isSpeaking && (
          <button
            onClick={handleStop}
            className="tts-button-secondary"
          >
            <StopIcon className="w-5 h-5" />
            <span>{t('tts.stop')}</span>
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="tts-button-icon"
          title={t('tts.settings')}
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      {showProgress && isSpeaking && (
        <div className="tts-progress-container">
          <div 
            className="tts-progress-bar"
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressBarDrag}
            style={{ cursor: 'pointer' }}
          >
            <div 
              className="tts-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="tts-progress-text">{Math.round(progress)}%</span>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="tts-settings-panel">
          <div className="tts-settings-header">
            <h3>{t('tts.settings')}</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="tts-button-close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="tts-settings-content">
            {/* TTS Provider Selection */}
            <div className="tts-setting-item">
              <label htmlFor="tts-provider">Voice Quality</label>
              <CustomDropdown
                options={[
                  { value: 'cloud', label: `☁️ Cloud Voice (${isOnline ? 'Online' : 'Offline'})` },
                  { value: 'device', label: '📱 Device Voice (Offline)' }
                ]}
                value={useCloudTTS ? 'cloud' : 'device'}
                onChange={(value) => setUseCloudTTS(value === 'cloud')}
                className="tts-select"
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                {useCloudTTS 
                  ? isOnline 
                    ? '✅ Premium quality (Google WaveNet)' 
                    : '⚠️ Offline - will use device voice'
                  : '📱 Uses installed TTS engine'}
              </p>
            </div>

            {/* Voice Selection (for Cloud TTS) */}
            {useCloudTTS && (
              <div className="tts-setting-item">
                <label htmlFor="tts-cloud-voice">Voice</label>
                <CustomDropdown
                  options={[
                    { value: 'female_english', label: '👩 Female (US English)' },
                    { value: 'female_filipino', label: '👩 Female (Filipino Tagalog)' },
                    { value: 'male_english', label: '👨 Male (US English)' },
                    { value: 'male_filipino', label: '👨 Male (Filipino Tagalog)' }
                  ]}
                  value={cloudVoiceId}
                  onChange={(value) => {
                    console.log('🎤 Voice changed to:', value);
                    setCloudVoiceId(value);
                  }}
                  className="tts-select"
                />
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>
                  {cloudVoiceId.includes('english') ? '🇺🇸 Natural US English voice' : '🇵🇭 Native Filipino/Tagalog voice'}
                </p>
              </div>
            )}

            {/* Device Voice Selection (for Device TTS) */}
            {!useCloudTTS && (
              <div className="tts-setting-item">
                <label htmlFor="tts-voice">{t('tts.voice')}</label>
                {voices.length === 0 ? (
                  <div className="tts-no-voices">
                    <p style={{ color: '#f59e0b', marginBottom: '8px', fontSize: '14px' }}>
                      ⚠️ No voices available. Install a TTS engine for better quality.
                    </p>
                    {isNativePlatform && (
                      <button
                        onClick={handleInstallTTS}
                        className="tts-button-primary"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        📥 Install TTS Engine
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <CustomDropdown
                      options={(() => {
                        // Build voice options (will only log on re-render, not continuously)
                        const options = voices.map((voice, index) => {
                          // Count how many voices of the same language we have
                          const sameLanguageVoices = voices.filter(v => v.lang === voice.lang);
                          // Use the actual position in the filtered same-language list
                          const voiceNumber = sameLanguageVoices.indexOf(voice) + 1;
                          
                          // Create user-friendly label
                          let languageLabel = voice.lang;
                          if (voice.lang?.toLowerCase().includes('en')) {
                            languageLabel = 'English (US)';
                          } else if (voice.lang?.toLowerCase().includes('fil') || voice.lang?.toLowerCase().includes('tl')) {
                            languageLabel = 'Filipino';
                          }
                          
                          // Extract a more readable identifier from the voice name
                          // Voice names are like: "fil-ph-x-fie-local", "fil-ph-x-fid-local"
                          let voiceIdentifier = '';
                          if (voice.name) {
                            // Try to get a unique part from the voice name
                            const nameParts = voice.name.split('-');
                            if (nameParts.length > 3) {
                              // Get the unique identifier (usually the 4th part)
                              voiceIdentifier = ` (${nameParts[3]?.toUpperCase() || ''})`;
                            } else {
                              voiceIdentifier = ` (${voice.name.substring(0, 8)}...)`;
                            }
                          }
                          
                          // Add number if there are multiple voices for same language
                          const label = sameLanguageVoices.length > 1 
                            ? `${languageLabel} - Voice ${voiceNumber}${voiceIdentifier}` 
                            : languageLabel;
                          
                          return {
                            value: `${voice.name}|||${voice.lang}|||${index}`,
                            label: label,
                            voiceData: {
                              index,
                              voiceNumber,
                              name: voice.name,
                              lang: voice.lang,
                              label,
                              originalIndex: (voice as any).originalIndex
                            }
                          };
                        });
                        
                        // Log once when dropdown opens (not on every render)
                        if (options.length > 0 && !window.__voicesLogged) {
                          console.log('🎤 TTS: Voice dropdown options:', JSON.stringify(options.map(o => o.voiceData), null, 2));
                          window.__voicesLogged = true;
                          setTimeout(() => { window.__voicesLogged = false; }, 1000); // Reset after 1 second
                        }
                        
                        return options;
                      })()}
                      value={currentVoice ? `${currentVoice.name}|||${currentVoice.lang}|||${voices.indexOf(currentVoice)}` : ''}
                      onChange={(value) => {
                        const [name, lang, indexStr] = value.split('|||');
                        const index = parseInt(indexStr);
                        if (index >= 0 && index < voices.length) {
                          console.log('🎤 TTS: User selected voice:', JSON.stringify({
                            index,
                            name: voices[index].name,
                            lang: voices[index].lang,
                            originalIndex: (voices[index] as any).originalIndex
                          }, null, 2));
                          setVoice(voices[index]);
                        }
                      }}
                      className="tts-select"
                    />
                    {isNativePlatform && (
                      <button
                        onClick={handleInstallTTS}
                        style={{ 
                          marginTop: '8px', 
                          padding: '6px 12px', 
                          fontSize: '12px',
                          background: '#4b5563',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        🔊 Need more Filipino voices? Install from Play Store
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Speed Control */}
            <div className="tts-setting-item">
              <label htmlFor="tts-rate">
                {t('tts.speed')}: {rate.toFixed(1)}x
              </label>
              <input
                id="tts-rate"
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="tts-slider"
              />
              <div className="tts-slider-labels">
                <span>{t('tts.slow')}</span>
                <span>{t('tts.normal')}</span>
                <span>{t('tts.fast')}</span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="tts-setting-item">
              <label htmlFor="tts-volume">
                {t('tts.volume')}: {Math.round(volume * 100)}%
              </label>
              <input
                id="tts-volume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="tts-slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
