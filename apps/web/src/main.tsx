import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { z } from 'zod'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import { App } from './app/App'
import { db } from './db/db'
import { initInstallPrompt } from './features/pwa/install-prompt'
import { trackInitialScreen } from './lib/initial-screen'

// The Content Security Policy forbids eval; zod's JIT would otherwise probe `new Function`.
z.config({ jitless: true })

// Before React renders: the browser's install prompt event fires once, early.
initInstallPrompt()
trackInitialScreen()

// Open IndexedDB while React renders the shell, instead of on the first query. A failure is
// rethrown by the library's live queries and shown by the route error page, so it is not handled here.
db.open().catch(() => {})

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
