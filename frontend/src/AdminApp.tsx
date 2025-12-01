import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useThemeStore } from './stores/themeStore';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

/**
 * Admin-Only Application
 * This is a simplified version of the main app that only includes the admin dashboard.
 * Used for deploying a separate admin web interface that connects to the same backend.
 */
function AdminApp() {
  const { initializeTheme, isDarkMode } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <ToastProvider>
      <Router>
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
          <Routes>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default AdminApp;
