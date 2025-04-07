// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/church-connect/', // Adds the repository name as the base path
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})