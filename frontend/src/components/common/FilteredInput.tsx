import React, { useState, useEffect, useRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { validateAndCensor } from '../../utils/profanityFilter';

interface FilteredInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onProfanityDetected?: (hasProfanity: boolean) => void;
  showWarning?: boolean;
  className?: string;
}

/**
 * FilteredInput Component
 * Automatically censors profanity and shows warning indicator
 */
export const FilteredInput: React.FC<FilteredInputProps> = ({
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

  // Handle input change with profanity filtering
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="filtered-input-wrapper">
      <div className="filtered-input-container">
        <input
          {...props}
          value={value}
          onChange={handleChange}
          className={`filtered-input ${warning ? 'filtered-input-warning' : ''} ${className}`}
        />
        
        {/* Warning Indicator */}
        {warning && showWarning && (
          <div className="filtered-input-indicator">
            <ExclamationTriangleIcon className="filtered-input-icon" />
          </div>
        )}
      </div>
      
      {/* Warning Message */}
      {showWarningMessage && warning && showWarning && (
        <div className="filtered-input-message">
          <ExclamationTriangleIcon className="filtered-input-message-icon" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};
