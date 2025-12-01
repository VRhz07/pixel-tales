import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Admin-only build configuration
// This creates a separate build optimized for the admin dashboard only
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Specify public directory to copy static files
  publicDir: 'public',
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
    // Specify the admin HTML entry point
    rollupOptions: {
      input: path.resolve(__dirname, 'index.admin.html'),
    },
  },
  // Environment variables
  define: {
    'import.meta.env.VITE_ADMIN_ONLY': JSON.stringify('true'),
  },
  server: {
    port: 5174, // Different port for admin dev server
  },
});
