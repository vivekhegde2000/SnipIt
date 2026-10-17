import { syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighter } from '../code/syntax-highlighter'

const MONO_FONT = "'JetBrains Mono Variable', ui-monospace, 'Cascadia Code', Consolas, monospace"

/** Editor chrome driven entirely by our CSS variables, so it follows light/dark automatically. */
export const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    fontSize: '13px',
  },
  '&.cm-focused': { outline: 'none' },
  // No ligatures: what you see must be exactly what gets copied (`=>` must not render as ⇒).
  '.cm-scroller': { fontFamily: MONO_FONT, lineHeight: '1.65', fontVariantLigatures: 'none' },
  '.cm-content': { padding: '10px 0', caretColor: 'var(--primary)' },
  '.cm-line': { padding: '0 12px 0 6px' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--primary)', borderLeftWidth: '2px' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'color-mix(in oklch, var(--muted-foreground) 70%, transparent)',
    border: 'none',
    paddingLeft: '4px',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklch, var(--muted) 55%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--foreground)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'color-mix(in oklch, var(--primary) 24%, transparent) !important' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'color-mix(in oklch, var(--primary) 18%, transparent)',
    outline: 'none',
  },
  '.cm-placeholder': { color: 'var(--muted-foreground)' },
  '.cm-searchMatch': { backgroundColor: 'color-mix(in oklch, var(--favorite) 30%, transparent)' },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'color-mix(in oklch, var(--favorite) 55%, transparent)',
  },
  '.cm-panels': {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    borderColor: 'var(--border)',
  },
  '.cm-panel input, .cm-panel button': { fontFamily: 'inherit', fontSize: '12px' },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
  },
})

/** Token colours: the shared tag → class mapping (styled by the `.sx-*` rules in index.css). */
export const editorHighlighting = syntaxHighlighting(syntaxHighlighter)
