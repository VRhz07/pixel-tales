import { useState, useEffect } from 'react';

/**
 * Custom hook to get status bar height and apply safe area padding
 */
export const useStatusBarHeight = () => {
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    const checkCapacitor = async () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        setIsCapacitor(true);
        
        try {
          const { StatusBar } = (window as any).Capacitor.Plugins;
          const info = await StatusBar.getInfo();
          setStatusBarHeight(info.height || 0);
        } catch (error) {
          console.error('Error getting status bar height:', error);
          // Fallback to CSS env() variable
          const computedHeight = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0'
          );
          setStatusBarHeight(computedHeight);
        }
      }
    };

    checkCapacitor();
  }, []);

  return { statusBarHeight, isCapacitor };
};
