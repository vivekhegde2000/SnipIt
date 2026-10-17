import { RouterProvider } from 'react-router/dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
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
            position="bottom-right"
            closeButton
            // Keep toasts clear of the mobile bottom navigation.
            mobileOffset={{
              bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 0.75rem)',
            }}
          />
        </TooltipProvider>
      </MotionProvider>
    </ThemeProvider>
  )
}
