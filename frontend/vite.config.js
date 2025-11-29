import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    resolve: {
        alias: {
            '@': '/src',
        },
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
});
