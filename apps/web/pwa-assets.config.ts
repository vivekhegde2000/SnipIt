import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

/**
 * App icons, generated once from `public/logo.svg` and committed (`npm run generate:pwa-assets`).
 * Maskable and Apple icons are full-bleed on the brand colour; the logo keeps its glyph inside the
 * maskable safe zone, so Android's circle/squircle masks never clip it.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, padding: 0, resizeOptions: { background: '#6366f1' } },
    apple: { ...preset.apple, padding: 0, resizeOptions: { background: '#6366f1' } },
  },
  images: ['public/logo.svg'],
})
