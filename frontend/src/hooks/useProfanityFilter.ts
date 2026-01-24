import { useState, useCallback } from 'react';
import { validateAndCensor, containsProfanitySync } from '../utils/profanityFilter';

/**
 * Custom hook for profanity filtering
 * Provides state management and validation for filtered inputs
 */
export const useProfanityFilter = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [hasProfanity, setHasProfanity] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  /**
   * Updates value with automatic censoring
   */
  const updateValue = useCallback((newValue: string) => {
    const { censored, hasProfanity: detected, warning: warningMsg } = validateAndCensor(newValue);
    
    setValue(censored);
    setHasProfanity(detected);
    setWarning(warningMsg);
    
    return {
      censored,
      hasProfanity: detected,
      warning: warningMsg,
    };
  }, []);

  /**
   * Checks if text contains profanity without updating state
   * Uses synchronous check with cached profanity list
   */
  const checkProfanity = useCallback((text: string): boolean => {
    return containsProfanitySync(text);
  }, []);

  /**
   * Resets the filter state
   */
  const reset = useCallback(() => {
    setValue('');
    setHasProfanity(false);
    setWarning(null);
  }, []);

  return {
    value,
    setValue: updateValue,
    hasProfanity,
    warning,
    checkProfanity,
    reset,
  };
};
