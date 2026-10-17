import { Link } from 'react-router'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      className="mt-8"
    >
      <Button asChild>
        <Link to="/">Back to snippets</Link>
      </Button>
    </EmptyState>
  )
}
