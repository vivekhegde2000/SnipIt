import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { LanguageDescription, type LanguageSupport } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { EditorView } from '@codemirror/view'
import type { LanguageId } from '@snipit/shared'
import { CODEMIRROR_LANGUAGE_NAMES } from './code-languages'
import { editorHighlighting, editorTheme } from './code-editor-theme'

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
  minHeight?: string
  maxHeight?: string
  ref?: Ref<CodeEditorHandle>
}

type LoadedLanguage = { id: LanguageId; support: LanguageSupport }

/** Loads (and caches, via CodeMirror) the grammar for `language`. */
function useLanguageSupport(language: LanguageId): LanguageSupport | null {
  const [loaded, setLoaded] = useState<LoadedLanguage | null>(null)

  useEffect(() => {
    const name = CODEMIRROR_LANGUAGE_NAMES[language]
    const description = name ? LanguageDescription.matchLanguageName(languages, name, false) : null
    if (!description) return

    let cancelled = false
    description
      .load()
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
  minHeight = '180px',
  maxHeight = 'min(50dvh, 480px)',
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
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      theme={editorTheme}
      extensions={extensions}
      placeholder={placeholder}
      minHeight={minHeight}
      maxHeight={maxHeight}
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
