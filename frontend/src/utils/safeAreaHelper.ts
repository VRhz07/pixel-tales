/**
 * Safe Area Helper for Android
 * This helps detect and apply safe area insets on Android devices
 * where env(safe-area-inset-*) might not work automatically
 */

import { Capacitor } from '@capacitor/core';

export const initializeSafeArea = () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Not a native platform, skipping safe area initialization');
    return;
  }

  // Function to update safe area CSS variables
  const updateSafeAreaVars = () => {
    // Try to get safe area insets from CSS env()
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

    const insetBottom = computedPadding !== '0px' ? computedPadding : null;

    if (insetBottom) {
      console.log('✅ Safe area inset detected:', insetBottom);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', insetBottom);
    } else {
      // Fallback: Calculate based on window dimensions
      console.log('⚠️ Safe area not detected, using fallback calculation');
      
      // For Android with translucent navigation bar, estimate the navigation bar height
      if (Capacitor.getPlatform() === 'android') {
        // Standard Android navigation bar heights (in dp):
        // - 3-button navigation: 48dp
        // - Gesture navigation: 20-24dp
        // Assuming 1dp = 1px at default density, but this varies by device
        
        const screenHeight = window.screen.height;
        const windowHeight = window.innerHeight;
        const navBarHeight = screenHeight - windowHeight;
        
        console.log(`📱 Screen height: ${screenHeight}px, Window height: ${windowHeight}px`);
        console.log(`📏 Calculated nav bar height: ${navBarHeight}px`);
        
        if (navBarHeight > 0) {
          document.documentElement.style.setProperty('--safe-area-inset-bottom', `${navBarHeight}px`);
          console.log(`✅ Set safe area inset to: ${navBarHeight}px`);
        } else {
          // Use a reasonable default for gesture navigation
          const defaultInset = '24px';
          document.documentElement.style.setProperty('--safe-area-inset-bottom', defaultInset);
          console.log(`✅ Using default safe area inset: ${defaultInset}`);
        }
      }
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
