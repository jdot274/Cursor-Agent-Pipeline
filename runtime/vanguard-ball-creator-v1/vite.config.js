import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the built app works when hosted under /creator/ inside the game deployment
export default defineConfig({
  base: './',
  plugins: [react()],
})
