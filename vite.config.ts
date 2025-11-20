import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // optimizeDeps: {
  //   exclude: ['@ai-sdk/openai', 'ai'],
  // },
  build: {
    commonjsOptions: {
        include: [/epubjs/, /node_modules/],
    }
  },
  base: './',
})
