import React, { useState } from 'react';
import { FilteredTextarea } from './FilteredTextarea';
import { VoiceInput } from './VoiceInput';
import { useI18nStore } from '../../stores/i18nStore';

interface VoiceFilteredTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showWarning?: boolean;
  onProfanityDetected?: (hasProfanity: boolean) => void;
  className?: string;
  rows?: number;
  maxLength?: number;
}

export const VoiceFilteredTextarea: React.FC<VoiceFilteredTextareaProps> = ({
  value,
  onChange,
  placeholder,
  showWarning = true,
  onProfanityDetected,
  className = '',
  rows = 4,
  maxLength,
  ...props
}) => {
  const { language } = useI18nStore();
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const handleVoiceTranscript = (transcript: string) => {
    // Append voice transcript to existing value with proper spacing
    const newValue = value ? `${value} ${transcript}` : transcript;
    onChange(newValue);
    setVoiceError(null);
  };

  const handleVoiceError = (error: string) => {
    setVoiceError(error);
    setTimeout(() => setVoiceError(null), 3000);
  };

  return (
    <div className="voice-filtered-textarea-wrapper">
      <div className="voice-filtered-textarea-container">
        <FilteredTextarea
          {...props}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          showWarning={showWarning}
          onProfanityDetected={onProfanityDetected}
          className={className}
          rows={rows}
          maxLength={maxLength}
        />
        
        <div className="voice-filtered-textarea-button">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onError={handleVoiceError}
            size="lg"
          />
        </div>
      </div>

      {voiceError && (
        <div className="voice-filtered-textarea-error">
          ⚠️ {voiceError}
        </div>
      )}
    </div>
  );
};
