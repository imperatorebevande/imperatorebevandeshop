import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separare le librerie principali in chunk dedicati
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'query-vendor': ['@tanstack/react-query'],

          'animation-vendor': ['lottie-react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['axios', 'date-fns', 'zod']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    proxy: {
      '/api/calendar': {
        target: 'https://www.imperatorebevande.it',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/calendar/, '/oraricalendarioreact.php'),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/delivery': {
        target: 'https://imperatorebevande.it',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/delivery/, '/wp-json/orddd/v1/delivery_schedule'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'ImperatoreBevande-App/1.0');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Cache-Control', 'no-cache');
          });
        }
      },
      // Stripe API endpoints
      '/api/create-payment-intent': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    }
  }
})
