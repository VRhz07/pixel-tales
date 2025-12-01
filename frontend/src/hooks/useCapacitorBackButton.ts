import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Custom hook to handle Android back button in Capacitor
 * Prevents app from closing and navigates back in history
 * Shows confirmation dialog on home page before exiting
 */
export const useCapacitorBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    // Check if running in Capacitor
    if (Capacitor.isNativePlatform()) {
      const backButtonListener = App.addListener('backButton', () => {
        // If we're on the home page or auth page, show exit confirmation
        if (location.pathname === '/' || location.pathname === '/home' || location.pathname === '/auth') {
          const currentTime = Date.now();
          const timeSinceLastPress = currentTime - lastBackPressRef.current;
          
          // If back pressed twice within 2 seconds, exit
          if (timeSinceLastPress < 2000) {
            App.exitApp();
          } else {
            // First press - show toast message
            lastBackPressRef.current = currentTime;
            
            // Show native toast or alert
            const toastMessage = 'Press back again to exit';
            
            // Try to show a native toast (if available)
            if ((window as any).plugins?.toast) {
              (window as any).plugins.toast.showShortBottom(toastMessage);
            } else {
              // Fallback: Create a temporary toast element
              const toast = document.createElement('div');
              toast.textContent = toastMessage;
              toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 14px;
                z-index: 10000;
                font-family: 'Fredoka', sans-serif;
              `;
              document.body.appendChild(toast);
              
              // Remove toast after 2 seconds
              setTimeout(() => {
                if (toast.parentNode) {
                  document.body.removeChild(toast);
                }
              }, 2000);
            }
          }
        } else {
          // Navigate back in history for other pages
          navigate(-1);
        }
      });

      return () => {
        backButtonListener.remove();
      };
    }
  }, [navigate, location]);
};
