import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages uses subpath; Vercel/Netlify use root
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
})
