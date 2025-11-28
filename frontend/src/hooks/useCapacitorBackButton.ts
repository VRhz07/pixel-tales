import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook to handle Android back button in Capacitor
 * Prevents app from closing and navigates back in history
 */
export const useCapacitorBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if running in Capacitor
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { App } = (window as any).Capacitor.Plugins;

      const backButtonListener = App.addListener('backButton', () => {
        // If we're on the home page, minimize the app instead of closing
        if (location.pathname === '/' || location.pathname === '/home') {
          App.minimizeApp();
        } else {
          // Navigate back in history
          navigate(-1);
        }
      });

      return () => {
        backButtonListener.remove();
      };
    }
  }, [navigate, location]);
};
