import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import type { LanguageId } from '@snipit/shared'
import { loadLanguage } from '../code/code-languages'
import { editorHighlighting, editorTheme } from './code-editor-theme'
import { EDITOR_HEIGHT } from './editor-constants'

export type CodeEditorHandle = { focus: () => void }

export type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  language: LanguageId
  placeholder?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  invalid?: boolean
  /** Fixed height (content scrolls inside). Defaults to the `--editor-height` set by the container. */
  height?: string
  ref?: Ref<CodeEditorHandle>
}

type LoadedLanguage = { id: LanguageId; support: Extension }

/** Loads (and caches) the grammar for `language`. */
function useLanguageSupport(language: LanguageId): Extension | null {
  const [loaded, setLoaded] = useState<LoadedLanguage | null>(null)

  useEffect(() => {
    const pending = loadLanguage(language)
    if (!pending) return

    let cancelled = false
    pending
      .then((support) => {
        if (!cancelled) setLoaded({ id: language, support })
      })
      .catch(() => {
        // Highlighting is progressive enhancement: plain text is a fine fallback (e.g. offline).
      })
    return () => {
      cancelled = true
    }
  }, [language])

  // Only use a grammar that matches the current selection (avoids stale highlighting).
  return loaded?.id === language ? loaded.support : null
}

export function CodeEditor({
  value,
  onChange,
  onBlur,
  language,
  placeholder,
  ariaLabel = 'Code editor',
  ariaDescribedBy,
  invalid,
  height = EDITOR_HEIGHT,
  ref,
}: CodeEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const languageSupport = useLanguageSupport(language)

  useImperativeHandle(ref, () => ({ focus: () => editorRef.current?.view?.focus() }), [])

  const extensions = useMemo(() => {
    const attributes: Record<string, string> = { 'aria-label': ariaLabel, 'aria-multiline': 'true' }
    if (ariaDescribedBy) attributes['aria-describedby'] = ariaDescribedBy
    if (invalid) attributes['aria-invalid'] = 'true'

    return [
      EditorView.lineWrapping,
      EditorView.contentAttributes.of(attributes),
      editorHighlighting,
      ...(languageSupport ? [languageSupport] : []),
    ]
  }, [ariaLabel, ariaDescribedBy, invalid, languageSupport])

  return (
    <CodeMirror
      ref={editorRef}
      // Root fills its container so a percentage `height` (e.g. 100% on desktop) resolves.
      className="h-full"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      theme={editorTheme}
      extensions={extensions}
      placeholder={placeholder}
      height={height}
      // Tab moves focus (keyboard accessibility inside dialogs) instead of inserting a tab.
      indentWithTab={false}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        autocompletion: false,
        closeBrackets: false,
        bracketMatching: true,
        searchKeymap: true,
        tabSize: 2,
      }}
    />
  )
}
