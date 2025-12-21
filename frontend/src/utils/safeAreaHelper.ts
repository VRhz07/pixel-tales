/**
 * Safe Area Helper for Android
 * This helps detect and apply safe area insets on Android devices
 * where env(safe-area-inset-*) might not work automatically
 */

import { Capacitor } from '@capacitor/core';
import { SafeArea } from '@capacitor-community/safe-area';

export const initializeSafeArea = () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Not a native platform, skipping safe area initialization');
    return;
  }

  // Function to update safe area CSS variables
  const updateSafeAreaVars = async () => {
    let bottomInset = 0;

    // Try using Capacitor SafeArea plugin first
    try {
      const safeAreaData = await SafeArea.getSafeAreaInsets();
      console.log('🔧 SafeArea plugin data:', safeAreaData);
      if (safeAreaData && safeAreaData.bottom > 0) {
        bottomInset = safeAreaData.bottom;
        console.log('✅ Using SafeArea plugin bottom inset:', bottomInset);
      }
    } catch (error) {
      console.log('⚠️ SafeArea plugin not available:', error);
    }

    // If SafeArea plugin didn't work, try CSS env()
    if (bottomInset === 0) {
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

      const cssInset = parseFloat(computedPadding);
      if (cssInset > 0) {
        bottomInset = cssInset;
        console.log('✅ Using CSS env() bottom inset:', bottomInset);
      }
    }

    // Final fallback for Android: Use visual viewport detection
    if (bottomInset === 0 && Capacitor.getPlatform() === 'android') {
      console.log('⚠️ Fallback: Using viewport calculation for Android');
      
      // Method 1: Visual viewport vs window height
      if (window.visualViewport) {
        const visualHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const calculated = windowHeight - visualHeight;
        
        console.log(`📱 Window: ${windowHeight}px, Visual: ${visualHeight}px, Diff: ${calculated}px`);
        
        if (calculated > 10 && calculated < 200) { // Reasonable navigation bar range
          bottomInset = calculated;
          console.log('✅ Using visual viewport calculation:', bottomInset);
        }
      }
      
      // Method 2: Screen vs window height (less reliable but backup)
      if (bottomInset === 0) {
        const screenHeight = window.screen.height;
        const windowHeight = window.innerHeight;
        const calculated = screenHeight - windowHeight;
        
        console.log(`📱 Screen: ${screenHeight}px, Window: ${windowHeight}px, Diff: ${calculated}px`);
        
        if (calculated > 10 && calculated < 200) {
          bottomInset = Math.min(calculated, 80); // Cap at reasonable max
          console.log('✅ Using screen calculation (capped):', bottomInset);
        }
      }
      
      // Last resort: Device density-based default
      if (bottomInset === 0) {
        const pixelRatio = window.devicePixelRatio || 1;
        if (pixelRatio >= 3) {
          bottomInset = 32; // High density gesture nav
        } else if (pixelRatio >= 2) {
          bottomInset = 28; // Medium density
        } else {
          bottomInset = 24; // Low density
        }
        console.log('✅ Using density-based default:', bottomInset, 'px (ratio:', pixelRatio, ')');
      }
    }

    // Apply the calculated inset
    if (bottomInset > 0) {
      const insetPx = `${bottomInset}px`;
      document.documentElement.style.setProperty('--safe-area-inset-bottom', insetPx);
      
      // Also set a backup CSS variable for older implementations
      document.documentElement.style.setProperty('--android-nav-height', insetPx);
      
      console.log(`🎯 Final safe area bottom inset set to: ${insetPx}`);
    } else {
      console.log('❌ Could not determine safe area inset, using 0px');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
      document.documentElement.style.setProperty('--android-nav-height', '0px');
    }
  };

  // Update on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateSafeAreaVars);
  } else {
    updateSafeAreaVars();
  }

  // Update on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(updateSafeAreaVars, 100);
  });

  // Update on resize (for edge cases)
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateSafeAreaVars, 100);
  });

  console.log('🎯 Safe area helper initialized');
};
