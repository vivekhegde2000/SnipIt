import { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { bundleGuard } from './vite-plugins/bundle-guard.ts'

/**
 * The app directory with its canonical on-disk spelling. On Windows a terminal can report the
 * drive letter in lower case (`d:\…`) while packages resolve to their real path (`D:\…`); mixing
 * the two gives one file two module ids, so React was bundled twice and the production build
 * crashed on start. Anchoring `root` and the aliases here keeps every id on the same spelling.
 */
const appDir = realpathSync.native(path.dirname(fileURLToPath(import.meta.url)))

/**
 * Long-term caching: stable third-party code gets its own chunks, so a deploy that only changes
 * app code doesn't make users re-download React & co. The patterns are deliberately narrow —
 * a broad /node_modules/ group would also capture lazily loaded CodeMirror and make it eager.
 *
 * Groups also capture their dependencies, so a module reachable from several groups (React is
 * imported by all of them) gets an explicit owner: the higher `priority` wins.
 * `bundleGuard()` fails the build if the result could break start-up.
 */
const vendorChunks = [
  {
    name: 'vendor-react',
    test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
    priority: 30,
  },
  { name: 'vendor-data', test: /node_modules[\\/](dexie|dexie-react-hooks|zod)[\\/]/, priority: 20 },
  {
    name: 'vendor-ui',
    test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui|sonner|cn)[\\/]/,
    priority: 10,
  },
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

/**
 * Installable PWA. `registerType: 'prompt'` → a new deploy shows an "Update available" toast
 * (src/features/pwa) instead of silently reloading. Everything the app needs is precached —
 * including lazily loaded grammar chunks — so it works fully offline.
 */
const pwa = VitePWA({
  registerType: 'prompt',
  injectRegister: false, // registered from React (useRegisterSW) to drive the update toast
  includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png', 'theme-init.js'],
  manifest: {
    id: '/',
    name: 'SnipIt — Snippet manager',
    short_name: 'SnipIt',
    description:
      'Save, search and one-click copy your reusable commands, queries, code and message templates.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#6366f1',
    background_color: '#fafafa',
    lang: 'en',
    categories: ['productivity', 'developer', 'utilities'],
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'New snippet',
        short_name: 'New',
        url: '/?new=1',
        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
      },
      { name: 'Favorites', url: '/favorites', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
    navigateFallback: '/index.html',
    cleanupOutdatedCaches: true,
    // The largest chunk (CodeMirror core) is ~320 KB; leave head-room.
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  },
  devOptions: { enabled: false },
})

// https://vite.dev/config/
export default defineConfig({
  root: appDir,
  plugins: [react(), tailwindcss(), pwa, bundleGuard()],
  resolve: {
    alias: {
      '@': path.join(appDir, 'src'),
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
