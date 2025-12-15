import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to get Android navigation bar height
 * Works with Capacitor on Android devices
 */
export const useAndroidNavBarHeight = (): number => {
  const [navBarHeight, setNavBarHeight] = useState(0);

  useEffect(() => {
    const getNavBarHeight = () => {
      // Only run on Android in Capacitor
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return 0;
      }

      // Get the actual viewport height vs window height
      // The difference is the navigation bar height
      const windowHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || windowHeight;
      
      // On Android, window.innerHeight includes the navigation bar
      // visualViewport.height excludes it
      const navHeight = windowHeight - visualViewportHeight;
      
      // If we can't detect it, use a safe default based on screen density
      if (navHeight <= 0) {
        // Default height based on device pixel ratio
        const pixelRatio = window.devicePixelRatio || 1;
        if (pixelRatio >= 3) {
          return 24; // High DPI devices
        } else if (pixelRatio >= 2) {
          return 20; // Medium DPI devices
        } else {
          return 16; // Low DPI devices
        }
      }
      
      return Math.max(navHeight, 16); // Minimum 16px
    };

    const updateHeight = () => {
      const height = getNavBarHeight();
      setNavBarHeight(height);
      console.log('🔧 Android nav bar height detected:', height);
    };

    // Initial detection
    updateHeight();

    // Update on resize (orientation change, keyboard, etc.)
    window.addEventListener('resize', updateHeight);
    
    // Update on visual viewport changes (more reliable on Android)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  return navBarHeight;
};
