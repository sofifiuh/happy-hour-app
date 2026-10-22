import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `npm run build` makes the portable preview (hash URLs, relative paths);
// `npm run build:site` makes alittlehang.com (real paths) into dist-site.
const site = process.env.VITE_ROUTER === 'browser'

export default defineConfig({
  base: site ? '/' : './',
  build: { outDir: site ? 'dist-site' : 'dist' },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
