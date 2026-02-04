import React, { useState, useEffect, useRef, useCallback } from 'react';
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
 * HIGHLY OPTIMIZED: Uses controlled local state with aggressive debouncing for APK performance
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
  const parentUpdateTimeoutRef = useRef<number | null>(null);
  const lastEmittedValueRef = useRef<string>(value);

  // Sync local value when prop value changes externally (but not from our own updates)
  useEffect(() => {
    if (value !== lastEmittedValueRef.current && value !== localValue) {
      setLocalValue(value);
      lastEmittedValueRef.current = value;
    }
  }, [value]);

  // Memoized handler to update parent (debounced)
  const updateParent = useCallback((inputValue: string) => {
    if (parentUpdateTimeoutRef.current) {
      clearTimeout(parentUpdateTimeoutRef.current);
    }
    
    // Debounce parent updates to reduce store operations (150ms for better responsiveness)
    parentUpdateTimeoutRef.current = window.setTimeout(() => {
      const { censored, hasProfanity, warning: warningMsg } = validateAndCensor(inputValue);
      
      // Only update parent if value actually changed
      if (censored !== lastEmittedValueRef.current) {
        lastEmittedValueRef.current = censored;
        onChange(censored);
        
        // Update local value if censored
        if (censored !== inputValue) {
          setLocalValue(censored);
        }
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
    }, 150); // Reduced to 150ms for better balance
  }, [onChange, onProfanityDetected, showWarning]);

  // Handle textarea change - immediate local update only
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    
    // Immediately update local state for instant visual feedback
    setLocalValue(inputValue);
    
    // Debounce parent update
    updateParent(inputValue);
  }, [updateParent]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      if (parentUpdateTimeoutRef.current) {
        clearTimeout(parentUpdateTimeoutRef.current);
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
