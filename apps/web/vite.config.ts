import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Long-term caching: stable third-party code gets its own chunks, so a deploy that only changes
 * app code doesn't make users re-download React & co. The patterns are deliberately narrow —
 * a broad /node_modules/ group would also capture lazily loaded CodeMirror and make it eager.
 */
const vendorChunks = [
  { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
  { name: 'vendor-data', test: /node_modules[\\/](dexie|dexie-react-hooks|zod)[\\/]/ },
  { name: 'vendor-ui', test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui|sonner|cn)[\\/]/ },
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        codeSplitting: { groups: vendorChunks },
      },
    },
  },
})
