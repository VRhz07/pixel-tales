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
      const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
        console.log('📱 Back button pressed:', { 
          pathname: location.pathname, 
          canGoBack 
        });

        // Define main/home routes where we should show exit confirmation
        const mainRoutes = [
          '/',
          '/home',
          '/auth',
          '/library',
          '/profile',
          '/social',
          '/parent-dashboard'
        ];

        const isMainRoute = mainRoutes.includes(location.pathname);

        // If we're on a main route, show exit confirmation
        if (isMainRoute) {
          const currentTime = Date.now();
          const timeSinceLastPress = currentTime - lastBackPressRef.current;
          
          // If back pressed twice within 2 seconds, exit
          if (timeSinceLastPress < 2000) {
            console.log('📱 Exiting app...');
            App.exitApp();
          } else {
            // First press - show toast message
            lastBackPressRef.current = currentTime;
            
            const toastMessage = 'Press back again to exit';
            console.log('📱 Showing exit toast');
            
            // Create a temporary toast element
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
              animation: slideUp 0.3s ease-out;
            `;
            
            // Add animation
            const style = document.createElement('style');
            style.textContent = `
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateX(-50%) translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(-50%) translateY(0);
                }
              }
            `;
            document.head.appendChild(style);
            document.body.appendChild(toast);
            
            // Remove toast after 2 seconds
            setTimeout(() => {
              if (toast.parentNode) {
                toast.style.animation = 'slideUp 0.3s ease-out reverse';
                setTimeout(() => {
                  if (toast.parentNode) {
                    document.body.removeChild(toast);
                  }
                  if (style.parentNode) {
                    document.head.removeChild(style);
                  }
                }, 300);
              }
            }, 2000);
          }
        } else {
          // For sub-pages, navigate back in history
          console.log('📱 Navigating back...');
          
          // Reset the double-tap timer when navigating back from sub-pages
          lastBackPressRef.current = 0;
          
          // Use navigate(-1) to go back in history
          navigate(-1);
        }
      });

      return () => {
        backButtonListener.remove();
      };
    }
  }, [navigate, location]);
};
