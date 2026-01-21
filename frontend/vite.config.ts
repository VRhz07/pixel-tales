import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Optimize bundle size for Android
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'canvas-vendor': ['paper', 'html2canvas'],
          'ui-vendor': ['framer-motion', '@headlessui/react', '@heroicons/react'],
          'capacitor-vendor': ['@capacitor/core', '@capacitor/app', '@capacitor/filesystem', '@capacitor/share'],
        },
      },
    },
    // Increase chunk size warning limit (we know some chunks are large)
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    strictPort: false, // If 3000 is taken, try next available port
    host: '0.0.0.0', // Allow network access from any IP
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Backend API
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
