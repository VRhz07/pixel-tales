import React, { useState } from 'react';
import { FilteredInput } from './FilteredInput';
import { VoiceInput } from './VoiceInput';
import { useI18nStore } from '../../stores/i18nStore';

interface VoiceFilteredInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showWarning?: boolean;
  onProfanityDetected?: (hasProfanity: boolean) => void;
  className?: string;
  maxLength?: number;
}

export const VoiceFilteredInput: React.FC<VoiceFilteredInputProps> = ({
  value,
  onChange,
  placeholder,
  showWarning = true,
  onProfanityDetected,
  className = '',
  maxLength,
  ...props
}) => {
  const { language } = useI18nStore();
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const handleVoiceTranscript = (transcript: string) => {
    // Append voice transcript to existing value
    const newValue = value ? `${value} ${transcript}` : transcript;
    onChange(newValue);
    setVoiceError(null);
  };

  const handleVoiceError = (error: string) => {
    setVoiceError(error);
    setTimeout(() => setVoiceError(null), 3000);
  };

  return (
    <div className="voice-filtered-input-outer-wrapper">
      <div className="voice-filtered-input-container">
        <FilteredInput
          {...props}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          showWarning={showWarning}
          onProfanityDetected={onProfanityDetected}
          className={`${className} voice-filtered-input-field`}
          maxLength={maxLength}
        />
        
        <div className="voice-filtered-input-button">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onError={handleVoiceError}
            size="md"
          />
        </div>
      </div>

      {voiceError && (
        <div className="voice-filtered-input-error">
          ⚠️ {voiceError}
        </div>
      )}
    </div>
  );
};
