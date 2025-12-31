import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: 'client',
  server: {
    host: '0.0.0.0',
    port: 5000
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
