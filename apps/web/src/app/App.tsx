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
            // Keep toasts clear of the mobile bottom navigation.
            mobileOffset={{
              bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 0.75rem)',
            }}
          />
          <PwaUpdater />
        </TooltipProvider>
      </MotionProvider>
    </ThemeProvider>
  )
}
