import { lazy, startTransition, Suspense, useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { CodeEditorProps } from './CodeEditor'
import { EDITOR_HEIGHT } from './editor-constants'
import { loadCodeEditor } from './editor-loader'

// CodeMirror stays out of the main bundle; it is preloaded right after first paint.
const CodeEditor = lazy(() => loadCodeEditor().then((module) => ({ default: module.CodeEditor })))

function EditorPlaceholder({ height }: { height?: string }) {
  return (
    // Same height as the real editor, so nothing shifts when it arrives.
    <div
      role="status"
      aria-label="Loading editor"
      className="space-y-2.5 p-3"
      style={{ height: height ?? EDITOR_HEIGHT }}
    >
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  )
}

/**
 * Mounts CodeMirror one frame *after* its container appears, as a low-priority transition.
 * Building the editor view is the most expensive part of opening the dialog; deferring it lets
 * the dialog paint (and start animating) immediately.
 */
export function LazyCodeEditor(props: CodeEditorProps) {
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => startTransition(() => setShouldMount(true)))
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!shouldMount) return <EditorPlaceholder height={props.height} />

  return (
    <Suspense fallback={<EditorPlaceholder height={props.height} />}>
      <CodeEditor {...props} />
    </Suspense>
  )
}

export type { CodeEditorHandle, CodeEditorProps } from './CodeEditor'
