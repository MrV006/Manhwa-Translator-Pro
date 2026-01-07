import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are linked correctly with relative paths
  define: {
    // Prevents "process is not defined" error in browser
    'process.env': {}
  },
  server: {
    port: 3000
  }
});