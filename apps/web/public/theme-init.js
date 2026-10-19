// Applies the saved theme before first paint (no flash of the wrong theme).
// Loaded as a tiny synchronous script from index.html — an external file rather than inline, so
// the Content Security Policy can forbid inline scripts entirely (see netlify.toml).
// Keep the storage key in sync with src/app/theme/theme-storage.ts.
;(function () {
  try {
    var stored = localStorage.getItem('snipit:theme')
    var theme = stored === 'light' || stored === 'dark' ? stored : 'system'
    var dark =
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  } catch {
    // Storage unavailable (privacy mode): fall back to the system theme via CSS.
  }
})()
