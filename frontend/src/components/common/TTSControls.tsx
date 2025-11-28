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

interface TTSControlsProps {
  text: string;
  autoPlay?: boolean;
  showProgress?: boolean;
  compact?: boolean;
}

export const TTSControls: React.FC<TTSControlsProps> = ({ 
  text, 
  autoPlay = false,
  showProgress = true,
  compact = false
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
  } = useTextToSpeech();

  const [showSettings, setShowSettings] = useState(false);

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
            {/* Voice Selection */}
            <div className="tts-setting-item">
              <label htmlFor="tts-voice">{t('tts.voice')}</label>
              <CustomDropdown
                options={voices.map((voice) => ({
                  value: voice.name,
                  label: `${voice.name} (${voice.lang})`
                }))}
                value={currentVoice?.name || ''}
                onChange={handleVoiceChange}
                className="tts-select"
              />
            </div>

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
