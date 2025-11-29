import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// Detect if running in Capacitor and apply body class for safe areas
if (Capacitor.isNativePlatform()) {
  document.body.classList.add('capacitor');
  
  // Initialize status bar for mobile
  const initializeStatusBar = async () => {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#1a0d2e' });
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (error) {
      console.error('Error initializing status bar:', error);
    }
  };
  
  initializeStatusBar();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
