// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/church-connect/', // Set the base path explicitly to the subdirectory
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})