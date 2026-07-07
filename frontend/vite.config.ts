import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import net from 'net'

// Broad fix: patch Node's Socket prototype so ANY socket in this process
// (Vite's HMR websocket, the /api proxy, etc.) silently ignores ECONNRESET
// instead of crashing the whole dev server. This is needed because mobile
// clients frequently drop connections abruptly (screen lock, backgrounding,
// brief wifi hiccups), and Node treats an unhandled socket 'error' event
// as fatal by default.
const originalSocketEmit = net.Socket.prototype.emit;
// @ts-ignore - overriding emit's signature intentionally
net.Socket.prototype.emit = function (event: string, ...args: any[]) {
  if (event === 'error' && args[0]?.code === 'ECONNRESET') {
    console.warn('[dev-server] Ignored ECONNRESET on socket (client likely disconnected abruptly)');
    return true;
  }
  return originalSocketEmit.call(this, event, ...args);
};
console.log('✅ Socket ECONNRESET patch applied');

// Fallback safety net: catches anything the socket patch above doesn't,
// so an unrelated crash doesn't take down the whole dev server either.
process.on('uncaughtException', (err: any) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    console.warn(`[dev-server] Ignored ${err.code} (uncaughtException fallback)`);
    return;
  }
  throw err;
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('[dev-server] Unhandled rejection:', reason);
});

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
    allowedHosts: true, // Allow Pinggy and other tunnel hosts
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Backend API
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          // Targeted fix: handle proxy socket errors (e.g. client disconnects
          // mid-request from a phone locking/backgrounding) without crashing
          // the whole dev server.
          proxy.on('error', (err: any) => {
            console.warn('Proxy error (likely client disconnect):', err.code);
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            console.warn('[Proxy WS Error] code:', err.code, 'message:', err.message);
          });
          proxy.on('proxyReqWs', (proxyReq, req: any, socket, options, head) => {
            console.log('[Proxy WS Req] Path:', req.url);
            console.log('[Proxy WS Req] Origin header:', req.headers['origin']);
            console.log('[Proxy WS Req] Host header:', req.headers['host']);
            console.log('[Proxy WS Req] Connection header:', req.headers['connection']);
            console.log('[Proxy WS Req] Upgrade header:', req.headers['upgrade']);
            console.log('[Proxy WS Req] Pinggy Headers (if any):', {
              'x-forwarded-for': req.headers['x-forwarded-for'],
              'x-forwarded-proto': req.headers['x-forwarded-proto'],
              'x-forwarded-host': req.headers['x-forwarded-host']
            });
          });
          proxy.on('open', (proxySocket) => {
            console.log('[Proxy WS] Connection opened to target backend');
          });
          proxy.on('close', (res, socket, head) => {
            console.log('[Proxy WS] Connection closed');
          });
        },
      },
    },
  },
})