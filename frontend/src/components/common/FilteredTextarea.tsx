import React, { useState, useEffect, useRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { validateAndCensor } from '../../utils/profanityFilter';

interface FilteredTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onProfanityDetected?: (hasProfanity: boolean) => void;
  showWarning?: boolean;
  className?: string;
}

/**
 * FilteredTextarea Component
 * Automatically censors profanity in multi-line text and shows warning indicator
 */
export const FilteredTextarea: React.FC<FilteredTextareaProps> = ({
  value,
  onChange,
  onProfanityDetected,
  showWarning = true,
  className = '',
  ...props
}) => {
  const [warning, setWarning] = useState<string | null>(null);
  const [showWarningMessage, setShowWarningMessage] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Handle textarea change with profanity filtering
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    const { censored, hasProfanity, warning: warningMsg } = validateAndCensor(inputValue);
    
    // Update value with censored version
    onChange(censored);
    
    // Show warning if profanity detected
    if (hasProfanity && showWarning) {
      setWarning(warningMsg);
      setShowWarningMessage(true);
      
      // Notify parent component
      onProfanityDetected?.(true);
      
      // Clear warning after 3 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowWarningMessage(false);
      }, 3000);
    } else {
      setWarning(null);
      setShowWarningMessage(false);
      onProfanityDetected?.(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="filtered-textarea-wrapper">
      <div className="filtered-textarea-container">
        <textarea
          {...props}
          value={value}
          onChange={handleChange}
          className={`filtered-textarea ${warning ? 'filtered-textarea-warning' : ''} ${className}`}
        />
        
        {/* Warning Indicator */}
        {warning && showWarning && (
          <div className="filtered-textarea-indicator">
            <ExclamationTriangleIcon className="filtered-textarea-icon" />
          </div>
        )}
      </div>
      
      {/* Warning Message */}
      {showWarningMessage && warning && showWarning && (
        <div className="filtered-textarea-message">
          <ExclamationTriangleIcon className="filtered-textarea-message-icon" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};
