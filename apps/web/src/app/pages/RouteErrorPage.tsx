import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

function describeError(error: unknown): { title: string; message: string } {
  if (isRouteErrorResponse(error)) {
    return { title: `${error.status} ${error.statusText}`, message: 'The page could not be loaded.' }
  }
  if (error instanceof Error && /indexeddb|database|dexie/i.test(`${error.name} ${error.message}`)) {
    return {
      title: 'Storage unavailable',
      message:
        'SnipIt could not open its local database. Private browsing or blocked site data can cause this — try a normal window or allow site storage.',
    }
  }
  return {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Reloading usually fixes it.',
  }
}

/** Last-resort error screen for anything thrown while rendering a route. */
export function RouteErrorPage() {
  const error = useRouteError()
  const { title, message } = describeError(error)

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <Logo className="mb-8" />
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {import.meta.env.DEV && error instanceof Error && (
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border bg-code p-3 text-left text-xs">
            {error.stack}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => window.location.reload()} className="gap-1.5">
            <RefreshCw aria-hidden="true" />
            Reload
          </Button>
          <Button variant="outline" onClick={() => window.location.assign('/')}>
            Go home
          </Button>
        </div>
      </div>
    </main>
  )
}
