/**
 * Template variables: `{{name}}` placeholders that are filled in before a snippet is copied.
 *
 * The syntax is deliberately strict, so code that uses double braces for its own templating is
 * left alone:
 * - a name is letters, digits and `_` (not starting with a digit), so dotted expressions such as
 *   `{{ .Values.image }}` (Helm) or `{{ user.name }}` (Jinja, Liquid) are not variables;
 * - `${{ github.ref }}` (GitHub Actions) and `{{{raw}}}` (Handlebars) are ignored;
 * - spaces inside the braces are allowed: `{{ name }}`;
 * - `{{name=there}}` gives a default, used when the field is left empty.
 */
const VARIABLE_PATTERN =
  /(?<![$\\{])\{\{[ \t]*([A-Za-z_][A-Za-z0-9_]{0,39})[ \t]*(?:=([^{}\n]{0,200}?))?[ \t]*\}\}(?!\})/g

/** More distinct variables than this are left as plain text (keeps the fill-in form usable). */
export const TEMPLATE_VARIABLES_MAX = 30

export type TemplateVariable = {
  name: string
  /** Value used when the field is left empty (`{{name=default}}`), else `''`. */
  defaultValue: string
}

export type TemplatePart =
  { type: 'text'; text: string } | { type: 'variable'; name: string; defaultValue: string }

/** Cheap check, e.g. to badge a card. */
export function hasTemplateVariables(content: string): boolean {
  return content.search(VARIABLE_PATTERN) !== -1
}

/** Splits content into literal text and variable placeholders, in order. */
export function splitTemplate(content: string): TemplatePart[] {
  const parts: TemplatePart[] = []
  const names = new Set<string>()
  let last = 0
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]!
    if (!names.has(name) && names.size >= TEMPLATE_VARIABLES_MAX) continue
    names.add(name)
    if (match.index > last) parts.push({ type: 'text', text: content.slice(last, match.index) })
    parts.push({ type: 'variable', name, defaultValue: (match[2] ?? '').trim() })
    last = match.index + match[0].length
  }
  if (last < content.length) parts.push({ type: 'text', text: content.slice(last) })
  return parts
}

/**
 * The distinct variables in order of first appearance. When a name appears more than once, the
 * first default given wins.
 */
export function parseTemplateVariables(content: string): TemplateVariable[] {
  const byName = new Map<string, TemplateVariable>()
  for (const part of splitTemplate(content)) {
    if (part.type !== 'variable') continue
    const existing = byName.get(part.name)
    if (!existing) byName.set(part.name, { name: part.name, defaultValue: part.defaultValue })
    else if (!existing.defaultValue && part.defaultValue) existing.defaultValue = part.defaultValue
  }
  return [...byName.values()]
}

/** The value a variable resolves to: what the user typed, else its default, else empty. */
export function resolveTemplateValue(
  variable: TemplateVariable,
  values: Readonly<Record<string, string>>,
): string {
  const value = values[variable.name]
  return value ? value : variable.defaultValue
}

/** Replaces every placeholder with its value. Text outside placeholders is kept verbatim. */
export function fillTemplate(content: string, values: Readonly<Record<string, string>>): string {
  const defaults = new Map(parseTemplateVariables(content).map((v) => [v.name, v]))
  return splitTemplate(content)
    .map((part) => {
      if (part.type === 'text') return part.text
      const variable = defaults.get(part.name) ?? part
      return resolveTemplateValue(variable, values)
    })
    .join('')
}
