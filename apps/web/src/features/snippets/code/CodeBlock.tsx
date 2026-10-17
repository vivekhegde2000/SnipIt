import { memo, type ComponentProps } from 'react'
import type { LanguageId } from '@snipit/shared'
import { cn } from '@/lib/utils'
import { useHighlightedCode } from './use-highlighted-code'

type CodeBlockProps = Omit<ComponentProps<'pre'>, 'children'> & {
  code: string
  language: LanguageId
}

/**
 * Read-only, syntax-highlighted code (same colours as the editor). Shows the raw text instantly and
 * upgrades to highlighted tokens once the grammar is ready. Wraps long lines; never uses ligatures.
 */
export const CodeBlock = memo(function CodeBlock({ code, language, className, ...props }: CodeBlockProps) {
  const segments = useHighlightedCode(code, language)

  return (
    <pre
      className={cn(
        'font-mono text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap',
        className,
      )}
      {...props}
    >
      <code>
        {segments
          ? segments.map((segment, index) =>
              segment.className ? (
                <span key={index} className={segment.className}>
                  {segment.text}
                </span>
              ) : (
                segment.text
              ),
            )
          : code}
      </code>
    </pre>
  )
})
