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
    build: {
        outDir: 'dist-admin',
        sourcemap: false, // Disable source maps for admin (security)
        minify: 'terser',
        // Admin dashboard optimizations
        rollupOptions: {
            output: {
                manualChunks: {
                    'admin-core': [
                        './src/pages/AdminDashboardPage.tsx',
                        './src/services/admin.service.ts',
                        './src/services/adminAuth.service.ts',
                    ],
                    'admin-components': [
                        './src/components/admin/DashboardStats.tsx',
                        './src/components/admin/UserManagement.tsx',
                        './src/components/admin/ProfanityManagement.tsx',
                    ],
                    'vendor': [
                        'react',
                        'react-dom',
                        'react-router-dom',
                    ],
                },
            },
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
