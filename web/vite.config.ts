import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `npm run build` makes the portable preview (hash URLs, relative paths);
// `npm run build:site` makes alittlehang.com (real paths) into dist-site.
const site = process.env.VITE_ROUTER === 'browser'

export default defineConfig({
  base: site ? '/' : './',
  build: {
    outDir: site ? 'dist-site' : 'dist',
    // The static best-of pages' map (src/best-map.ts) is its own small entry,
    // at a fixed name so scripts/prerender.mjs can link it.
    rollupOptions: {
      input: { index: path.resolve(__dirname, 'index.html'), 'best-map': path.resolve(__dirname, 'src/best-map.ts') },
      output: { entryFileNames: (chunk) => (chunk.name === 'best-map' ? 'assets/best-map.js' : 'assets/[name]-[hash].js') },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
