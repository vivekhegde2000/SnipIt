import { Braces } from 'lucide-react'
import { getLanguageLabel, type Snippet } from '@snipit/shared'
import { formatDateTime, formatRelativeTime } from '@/lib/dates'
import { cn } from '@/lib/utils'

/** "SQL · Template · 2 days ago · 14×" — shared by cards and list rows. */
export function SnippetMeta({
  snippet,
  isTemplate,
  className,
}: {
  snippet: Snippet
  isTemplate: boolean
  className?: string
}) {
  return (
    <p
      className={cn('flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground', className)}
    >
      <span className="font-medium">{getLanguageLabel(snippet.language)}</span>
      {isTemplate && (
        <>
          <span aria-hidden="true">·</span>
          <span
            className="inline-flex items-center gap-1 font-medium text-primary"
            title="Template: you fill in its fields when copying"
          >
            <Braces className="size-3" aria-hidden="true" />
            Template
          </span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <time dateTime={new Date(snippet.updatedAt).toISOString()} title={formatDateTime(snippet.updatedAt)}>
        {formatRelativeTime(snippet.updatedAt)}
      </time>
      {snippet.copyCount > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span title="Times copied">{snippet.copyCount}×</span>
        </>
      )}
    </p>
  )
}
