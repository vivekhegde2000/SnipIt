import { tagHighlighter, tags as t } from '@lezer/highlight'

/**
 * One tag → class mapping for the whole app. The editor (via `syntaxHighlighting`) and the
 * read-only previews (via `highlightTree`) both use it, so code looks identical everywhere.
 * Colours come from the `.sx-*` rules in index.css, which read the theme's `--syntax-*` tokens.
 */
export const syntaxHighlighter = tagHighlighter([
  {
    tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.modifier],
    class: 'sx-keyword',
  },
  { tag: [t.string, t.special(t.string), t.character, t.regexp], class: 'sx-string' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], class: 'sx-comment' },
  { tag: [t.number, t.bool, t.null, t.atom, t.constant(t.variableName), t.unit], class: 'sx-number' },
  {
    // `standard(variableName)` = builtins in legacy grammars (shell commands, PowerShell cmdlets).
    tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName, t.standard(t.variableName)],
    class: 'sx-function',
  },
  { tag: [t.typeName, t.className, t.namespace, t.self, t.definition(t.variableName)], class: 'sx-type' },
  {
    tag: [
      t.propertyName,
      t.definition(t.propertyName),
      t.labelName,
      t.special(t.variableName),
      t.local(t.variableName),
    ],
    class: 'sx-property',
  },
  { tag: [t.tagName, t.angleBracket], class: 'sx-tag' },
  { tag: t.attributeName, class: 'sx-attribute' },
  { tag: [t.meta, t.processingInstruction, t.documentMeta], class: 'sx-meta' },
  { tag: [t.operator, t.punctuation], class: 'sx-punctuation' },
  { tag: t.heading, class: 'sx-heading' },
  { tag: t.strong, class: 'sx-strong' },
  { tag: t.emphasis, class: 'sx-emphasis' },
  { tag: t.strikethrough, class: 'sx-strike' },
  { tag: t.link, class: 'sx-link' },
  { tag: t.invalid, class: 'sx-invalid' },
])
