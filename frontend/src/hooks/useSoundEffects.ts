/**
 * Sound Effects Hook
 * Easy-to-use React hook for playing sound effects in components
 */

import { useCallback } from 'react';
import soundService, { SoundType } from '../services/soundService';

export const useSoundEffects = () => {
  const playSound = useCallback((soundType: SoundType, volume?: number) => {
    soundService.playSound(soundType, volume !== undefined ? { volume } : undefined);
  }, []);

  const playButtonClick = useCallback(() => {
    soundService.playSound('button-click');
  }, []);

  const playButtonToggle = useCallback(() => {
    soundService.playSound('button-toggle');
  }, []);

  const playSuccess = useCallback(() => {
    soundService.playSuccessWithHaptic();
  }, []);

  const playError = useCallback(() => {
    soundService.playErrorWithHaptic();
  }, []);

  const playPageTurn = useCallback(() => {
    soundService.playSound('page-turn');
  }, []);

  const playNotification = useCallback(() => {
    soundService.playSound('notification');
  }, []);

  const playAchievement = useCallback(() => {
    soundService.playSound('achievement');
  }, []);

  const playHaptic = useCallback((intensity?: 'light' | 'medium' | 'heavy') => {
    soundService.playHaptic(intensity);
  }, []);

  const preload = useCallback((sounds: SoundType[]) => {
    soundService.preloadSounds(sounds);
  }, []);

  return {
    playSound,
    playButtonClick,
    playButtonToggle,
    playSuccess,
    playError,
    playPageTurn,
    playNotification,
    playAchievement,
    playHaptic,
    preload,
  };
};
