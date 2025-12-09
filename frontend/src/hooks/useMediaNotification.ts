import { useEffect, useCallback } from 'react';
import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

interface MediaNotificationPlugin {
  showNotification(options: {
    title: string;
    text: string;
    isPlaying: boolean;
  }): Promise<void>;
  
  hideNotification(): Promise<void>;
  
  updateNotification(options: {
    title: string;
    text: string;
    isPlaying: boolean;
  }): Promise<void>;
  
  addListener(
    eventName: 'play' | 'pause' | 'stop' | 'next' | 'previous',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;
  
  removeAllListeners(): Promise<void>;
}

const MediaNotification = registerPlugin<MediaNotificationPlugin>('MediaNotification');

interface UseMediaNotificationOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const useMediaNotification = (options: UseMediaNotificationOptions = {}) => {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Temporarily disable media notification listeners until plugin is properly implemented
    // This prevents app crashes
    if (!isNative) return;
    
    console.log('📱 Media notification: Listeners temporarily disabled to prevent crashes');
    
    // TODO: Re-enable when MediaNotificationPlugin is properly implemented
    /*
    const listeners: Array<{ remove: () => void }> = [];

    const setupListeners = async () => {
      try {
        if (options.onPlay) {
          const playListener = await MediaNotification.addListener('play', options.onPlay);
          listeners.push(playListener);
        }

        if (options.onPause) {
          const pauseListener = await MediaNotification.addListener('pause', options.onPause);
          listeners.push(pauseListener);
        }

        if (options.onStop) {
          const stopListener = await MediaNotification.addListener('stop', options.onStop);
          listeners.push(stopListener);
        }

        if (options.onNext) {
          const nextListener = await MediaNotification.addListener('next', options.onNext);
          listeners.push(nextListener);
        }

        if (options.onPrevious) {
          const previousListener = await MediaNotification.addListener('previous', options.onPrevious);
          listeners.push(previousListener);
        }
      } catch (error) {
        console.error('📱 Media notification: Failed to setup listeners (plugin not implemented):', error);
      }
    };

    setupListeners();

    return () => {
      try {
        listeners.forEach(listener => listener.remove());
        MediaNotification.removeAllListeners();
      } catch (error) {
        console.error('📱 Media notification: Failed to cleanup listeners:', error);
      }
    };
    */
  }, [isNative, options.onPlay, options.onPause, options.onStop, options.onNext, options.onPrevious]);

  const showNotification = useCallback(async (title: string, text: string, isPlaying: boolean) => {
    if (!isNative) return;
    
    try {
      await MediaNotification.showNotification({
        title,
        text,
        isPlaying
      });
    } catch (error) {
      console.error('Failed to show media notification:', error);
    }
  }, [isNative]);

  const hideNotification = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await MediaNotification.hideNotification();
    } catch (error) {
      console.error('Failed to hide media notification:', error);
    }
  }, [isNative]);

  const updateNotification = useCallback(async (title: string, text: string, isPlaying: boolean) => {
    if (!isNative) return;
    
    try {
      await MediaNotification.updateNotification({
        title,
        text,
        isPlaying
      });
    } catch (error) {
      console.error('Failed to update media notification:', error);
    }
  }, [isNative]);

  return {
    showNotification,
    hideNotification,
    updateNotification,
    isSupported: false // Temporarily disabled until plugin is properly implemented
  };
};
