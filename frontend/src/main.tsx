import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Detect if running in Capacitor and apply body class for safe areas
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  document.body.classList.add('capacitor');
  
  // Initialize status bar for mobile
  const initializeStatusBar = async () => {
    try {
      const { StatusBar } = (window as any).Capacitor.Plugins;
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#1a0d2e' });
      await StatusBar.setStyle({ style: 'dark' });
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
