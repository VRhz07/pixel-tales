import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp.tsx';
import './index.css';

/**
 * Admin Application Entry Point
 * This is the entry point for the admin-only build
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
