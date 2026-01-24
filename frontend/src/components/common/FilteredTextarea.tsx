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
 * OPTIMIZED: Uses debounced profanity checking to improve typing performance
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
  const [localValue, setLocalValue] = useState(value);
  const warningTimeoutRef = useRef<number | null>(null);
  const filterTimeoutRef = useRef<number | null>(null);

  // Sync local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle textarea change - immediate update without filtering
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    
    // Immediately update local state for responsive typing
    setLocalValue(inputValue);
    
    // Clear any pending filter timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Debounce the profanity filtering (300ms)
    filterTimeoutRef.current = window.setTimeout(() => {
      const { censored, hasProfanity, warning: warningMsg } = validateAndCensor(inputValue);
      
      // Only update parent if text was actually censored
      if (censored !== inputValue) {
        onChange(censored);
        setLocalValue(censored);
      } else {
        onChange(inputValue);
      }
      
      // Show warning if profanity detected
      if (hasProfanity && showWarning) {
        setWarning(warningMsg);
        setShowWarningMessage(true);
        onProfanityDetected?.(true);
        
        // Clear warning after 3 seconds
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        warningTimeoutRef.current = window.setTimeout(() => {
          setShowWarningMessage(false);
        }, 3000);
      } else {
        setWarning(null);
        setShowWarningMessage(false);
        onProfanityDetected?.(false);
      }
    }, 300); // 300ms debounce
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="filtered-textarea-wrapper">
      <div className="filtered-textarea-container">
        <textarea
          {...props}
          value={localValue}
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
