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
  // Motion is intentionally NOT grouped: its feature bundle is loaded lazily by <MotionProvider>,
  // and a group would pull it back into an eager chunk.
]

/**
 * Dev only: pre-bundle everything that is imported lazily (editor, grammars, motion features).
 * Otherwise Vite discovers them on first use, re-optimizes and reloads the page — which feels
 * like a slow/broken first click in `npm run dev`.
 */
const lazyDevDependencies = [
  '@uiw/react-codemirror',
  '@codemirror/state',
  '@codemirror/view',
  '@codemirror/language',
  '@lezer/highlight',
  '@codemirror/lang-markdown',
  '@codemirror/lang-sql',
  '@codemirror/lang-javascript',
  '@codemirror/lang-json',
  '@codemirror/lang-yaml',
  '@codemirror/lang-html',
  '@codemirror/lang-css',
  '@codemirror/lang-python',
  '@codemirror/lang-java',
  '@codemirror/lang-cpp',
  '@codemirror/lang-go',
  '@codemirror/lang-rust',
  '@codemirror/lang-php',
  '@codemirror/lang-xml',
  '@codemirror/legacy-modes/mode/shell',
  '@codemirror/legacy-modes/mode/powershell',
  '@codemirror/legacy-modes/mode/clike',
  '@codemirror/legacy-modes/mode/ruby',
  '@codemirror/legacy-modes/mode/swift',
  '@codemirror/legacy-modes/mode/dockerfile',
  '@codemirror/legacy-modes/mode/toml',
  'motion/react',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: lazyDevDependencies,
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
