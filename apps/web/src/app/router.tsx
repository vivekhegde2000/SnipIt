import { createBrowserRouter } from 'react-router'
import { CollectionsPage } from '@/features/collections/pages/CollectionsPage'
import { SnippetsPage } from '@/features/snippets/pages/SnippetsPage'
import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { RouteErrorPage } from './pages/RouteErrorPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <SnippetsPage view="all" /> },
      { path: 'favorites', element: <SnippetsPage view="favorites" /> },
      { path: 'recent', element: <SnippetsPage view="recent" /> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'collections/:collectionId', element: <SnippetsPage view="collection" /> },
      {
        path: 'settings',
        // Rarely visited: kept out of the startup bundle (precached by the service worker, so it
        // still opens instantly and offline).
        lazy: () =>
          import('@/features/settings/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
