import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

const MONO_FONT = "'JetBrains Mono Variable', ui-monospace, 'Cascadia Code', Consolas, monospace"

/** Editor chrome driven entirely by our CSS variables, so it follows light/dark automatically. */
export const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    fontSize: '13px',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: MONO_FONT, lineHeight: '1.65' },
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

/** Token colours shared with read-only previews via the `--syntax-*` variables. */
export const editorHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.modifier],
      color: 'var(--syntax-keyword)',
    },
    { tag: [t.string, t.special(t.string), t.character, t.regexp], color: 'var(--syntax-string)' },
    {
      tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
      color: 'var(--syntax-comment)',
      fontStyle: 'italic',
    },
    {
      tag: [t.number, t.bool, t.null, t.atom, t.constant(t.variableName), t.unit],
      color: 'var(--syntax-number)',
    },
    {
      tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName],
      color: 'var(--syntax-function)',
    },
    { tag: [t.typeName, t.className, t.namespace, t.self], color: 'var(--syntax-type)' },
    { tag: [t.propertyName, t.definition(t.propertyName), t.labelName], color: 'var(--syntax-property)' },
    { tag: [t.tagName, t.angleBracket], color: 'var(--syntax-tag)' },
    { tag: t.attributeName, color: 'var(--syntax-attribute)' },
    { tag: [t.meta, t.processingInstruction, t.documentMeta], color: 'var(--syntax-comment)' },
    { tag: t.heading, color: 'var(--syntax-number)', fontWeight: '700' },
    { tag: t.strong, fontWeight: '700' },
    { tag: t.emphasis, fontStyle: 'italic' },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.link, color: 'var(--syntax-function)', textDecoration: 'underline' },
    { tag: t.invalid, color: 'var(--syntax-invalid)' },
  ]),
)
