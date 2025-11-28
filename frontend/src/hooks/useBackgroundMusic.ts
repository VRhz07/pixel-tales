import { useEffect, useRef } from 'react';
import soundService from '../services/soundService';
import { useAuthStore } from '../stores/authStore';
import { useLocation } from 'react-router-dom';

/**
 * Hook to automatically play background music for child accounts
 */
export const useBackgroundMusic = () => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const hasAttemptedStart = useRef(false);

  useEffect(() => {
    // Don't play music on the authentication page (both /auth and / routes)
    const isAuthPage = location.pathname === '/auth' || location.pathname === '/';
    
    if (isAuthPage) {
      // Stop music if it's playing
      if (soundService.isBackgroundMusicPlaying()) {
        soundService.stopBackgroundMusic(1000);
      }
      return;
    }

    // Only play background music for authenticated child accounts
    if (isAuthenticated && user?.user_type === 'child') {
      // Reset attempt flag for new user
      hasAttemptedStart.current = false;
      
      // If music is already playing, don't restart it
      if (soundService.isBackgroundMusicPlaying()) {
        return;
      }
      
      // If music is disabled, don't try to start
      if (!soundService.isBackgroundMusicEnabled()) {
        return;
      }
      
      // Attempt to start music with user interaction fallback
      const attemptStart = async () => {
        if (hasAttemptedStart.current) {
          return;
        }
        
        hasAttemptedStart.current = true;
        
        try {
          await soundService.startBackgroundMusic(2000);
        } catch (error) {
          // Autoplay blocked - set up listener for user interaction
          const startOnInteraction = async () => {
            // Double-check we're not on auth page before starting
            const currentPath = window.location.pathname;
            if (currentPath === '/auth' || currentPath === '/') {
              return;
            }
            
            // Check conditions again
            if (!soundService.isBackgroundMusicEnabled() || soundService.isBackgroundMusicPlaying()) {
              return;
            }
            
            try {
              await soundService.startBackgroundMusic(2000);
            } catch (err) {
              console.error('Failed to start background music:', err);
            }
          };
          
          // Listen to multiple event types with { once: true }
          document.addEventListener('click', startOnInteraction, { once: true });
          document.addEventListener('touchstart', startOnInteraction, { once: true });
          document.addEventListener('keydown', startOnInteraction, { once: true });
          window.addEventListener('popstate', startOnInteraction, { once: true });
        }
      };
      
      // Small delay to allow page to stabilize
      const timer = setTimeout(attemptStart, 100);

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Stop music if not a child account
      if (soundService.isBackgroundMusicPlaying()) {
        soundService.stopBackgroundMusic(1000);
      }
    }
  }, [isAuthenticated, user?.user_type, user?.id, location.pathname]);

  return {
    isPlaying: soundService.isBackgroundMusicPlaying(),
    isEnabled: soundService.isBackgroundMusicEnabled(),
    volume: soundService.getBackgroundMusicVolume(),
    setVolume: (volume: number) => soundService.setBackgroundMusicVolume(volume),
    setEnabled: (enabled: boolean) => soundService.setBackgroundMusicEnabled(enabled),
    start: () => soundService.startBackgroundMusic(),
    stop: () => soundService.stopBackgroundMusic(),
  };
};
