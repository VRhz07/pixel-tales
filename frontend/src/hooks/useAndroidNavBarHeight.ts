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

      // Method 1: Use CSS variable set by safeAreaHelper
      const cssInset = getComputedStyle(document.documentElement)
        .getPropertyValue('--safe-area-inset-bottom')
        .trim();
      
      if (cssInset && cssInset !== '0px') {
        const insetValue = parseFloat(cssInset);
        if (insetValue > 0) {
          console.log('🎯 Using CSS safe area variable:', insetValue);
          return insetValue;
        }
      }

      // Method 2: Try CSS env() directly
      const testElement = document.createElement('div');
      testElement.style.position = 'fixed';
      testElement.style.top = '0';
      testElement.style.left = '0';
      testElement.style.width = '1px';
      testElement.style.height = '1px';
      testElement.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
      document.body.appendChild(testElement);

      const computedPadding = window.getComputedStyle(testElement).paddingBottom;
      document.body.removeChild(testElement);

      const envInset = parseFloat(computedPadding);
      if (envInset > 0) {
        console.log('🎯 Using CSS env() detection:', envInset);
        return envInset;
      }

      // Method 3: Visual viewport calculation (original logic but improved)
      const windowHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || windowHeight;
      const calculated = windowHeight - visualViewportHeight;
      
      if (calculated > 10 && calculated < 200) {
        console.log('🎯 Using visual viewport calculation:', calculated);
        return calculated;
      }

      // Method 4: Screen vs window height
      const screenHeight = window.screen.height;
      const screenDiff = screenHeight - windowHeight;
      
      if (screenDiff > 10 && screenDiff < 200) {
        const cappedHeight = Math.min(screenDiff, 80);
        console.log('🎯 Using screen height calculation (capped):', cappedHeight);
        return cappedHeight;
      }
      
      // Fallback: Use density-based default
      const pixelRatio = window.devicePixelRatio || 1;
      const fallback = pixelRatio >= 3 ? 32 : pixelRatio >= 2 ? 28 : 24;
      console.log('🎯 Using density fallback:', fallback, '(ratio:', pixelRatio, ')');
      return fallback;
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
