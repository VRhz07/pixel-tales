import { useEffect } from 'react';
import { useTextToSpeech } from './useTextToSpeech';
import { useMediaNotification } from './useMediaNotification';

interface UseTextToSpeechWithNotificationOptions {
  storyTitle?: string;
  currentText?: string;
}

/**
 * Enhanced TTS hook with media notification support for background playback
 */
export const useTextToSpeechWithNotification = (options: UseTextToSpeechWithNotificationOptions = {}) => {
  const tts = useTextToSpeech();
  const { storyTitle = 'Story', currentText = '' } = options;

  const {
    showNotification,
    hideNotification,
    updateNotification,
    isSupported: isNotificationSupported
  } = useMediaNotification({
    onPlay: () => {
      console.log('📱 Media notification: Play pressed');
      if (tts.isPaused) {
        tts.resume();
      } else if (!tts.isSpeaking && currentText) {
        tts.speak(currentText);
      }
    },
    onPause: () => {
      console.log('📱 Media notification: Pause pressed');
      tts.pause();
    },
    onStop: () => {
      console.log('📱 Media notification: Stop pressed');
      tts.stop();
    }
  });

  // Show/update notification when TTS state changes
  useEffect(() => {
    if (!isNotificationSupported) return;

    if (tts.isSpeaking || tts.isPaused) {
      const notificationText = `${tts.isPaused ? 'Paused' : 'Playing'} - ${Math.round(tts.progress)}%`;
      
      if (tts.isSpeaking && !tts.isPaused) {
        // Currently playing
        showNotification(storyTitle, notificationText, true);
      } else if (tts.isPaused) {
        // Paused
        updateNotification(storyTitle, notificationText, false);
      }
    } else {
      // Stopped
      hideNotification();
    }
  }, [tts.isSpeaking, tts.isPaused, tts.progress, storyTitle, isNotificationSupported]);

  // Clean up notification on unmount
  useEffect(() => {
    return () => {
      if (isNotificationSupported) {
        hideNotification();
      }
    };
  }, [isNotificationSupported]);

  return {
    ...tts,
    hasMediaNotification: isNotificationSupported
  };
};
