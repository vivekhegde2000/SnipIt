import { RouterProvider } from 'react-router/dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PwaUpdater } from '@/features/pwa/PwaUpdater'
import { MotionProvider } from './motion/MotionProvider'
import { router } from './router'
import { ThemeProvider } from './theme/ThemeProvider'

export function App() {
  return (
    <ThemeProvider>
      <MotionProvider>
        <TooltipProvider delayDuration={300}>
          <RouterProvider router={router} />
          <Toaster
            // Bottom-left: the detail panel opens on the right and dialogs are centred, so toasts
            // (often with an Undo action) never cover their primary buttons.
            position="bottom-left"
            closeButton
            // Clear of the bottom navigation (and the selection bar) on phones; see
            // `--toast-bottom` in index.css. Same value for both, so 600–767px is covered too.
            offset={{ bottom: 'var(--toast-bottom)' }}
            mobileOffset={{ bottom: 'var(--toast-bottom)' }}
          />
          <PwaUpdater />
        </TooltipProvider>
      </MotionProvider>
    </ThemeProvider>
  )
}
