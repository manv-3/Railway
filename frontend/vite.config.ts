import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// V3-06: Rollup manual chunks separate vendor libs into cacheable bundles,
// targeting initial entry chunk < 180 kB after code splitting.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PROXY_URL || 'http://backend:8000',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.VITE_BACKEND_PROXY_URL || 'http://backend:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_BACKEND_PROXY_URL || 'http://backend:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // MUI + emotion in one vendor chunk (tree-shaken at build time)
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Recharts is large — separate it
          'vendor-charts': ['recharts'],
          // Leaflet mapping libraries
          'vendor-maps': ['leaflet', 'react-leaflet'],
          // React core (shared across all routes)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
