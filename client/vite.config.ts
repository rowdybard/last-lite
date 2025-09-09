import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Use esbuild for faster builds and avoid Rollup issues
    minify: 'esbuild',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      external: ['/socket.io/socket.io.js'],
    },
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  // Optimize dependencies to avoid Rollup native issues
  optimizeDeps: {
    exclude: ['@rollup/rollup-linux-x64-gnu'],
  },
});
