import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { CodeEditorProps } from './CodeEditor'
import { loadCodeEditor } from './editor-loader'

// CodeMirror is ~140 KB gzipped; load it only when an editor is actually needed.
const CodeEditor = lazy(() => loadCodeEditor().then((module) => ({ default: module.CodeEditor })))

export function LazyCodeEditor(props: CodeEditorProps) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading editor"
          className="p-3"
          style={{ minHeight: props.minHeight ?? '180px' }}
        >
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-2 h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      }
    >
      <CodeEditor {...props} />
    </Suspense>
  )
}

export type { CodeEditorHandle, CodeEditorProps } from './CodeEditor'
