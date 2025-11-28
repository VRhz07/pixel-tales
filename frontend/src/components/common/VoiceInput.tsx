import React from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useI18nStore } from '../../stores/i18nStore';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTranscript?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  className = '',
  size = 'md',
  showTranscript = false,
}) => {
  const { language } = useI18nStore();
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (text) => {
      onTranscript(text);
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const getTooltipText = () => {
    if (isListening) {
      return language === 'tl' ? 'Ihinto ang recording' : 'Stop recording';
    }
    return language === 'tl' ? 'Magsalita para mag-type' : 'Click to speak';
  };

  return (
    <div className={`voice-input-container ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`voice-input-button ${sizeClasses[size]} ${isListening ? 'listening' : ''}`}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {isListening ? (
          <StopIcon className={iconSizeClasses[size]} />
        ) : (
          <MicrophoneIcon className={iconSizeClasses[size]} />
        )}
        
        {isListening && (
          <span className="voice-input-pulse"></span>
        )}
      </button>

      {showTranscript && (transcript || interimTranscript) && (
        <div className="voice-input-transcript">
          <span className="voice-input-transcript-final">{transcript}</span>
          <span className="voice-input-transcript-interim">{interimTranscript}</span>
        </div>
      )}

      {error && (
        <div className="voice-input-error">
          {error}
        </div>
      )}
    </div>
  );
};
