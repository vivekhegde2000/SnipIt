/** Derived element ids for a form control, so label/hint/error wiring is consistent. */
export const fieldIds = (id: string) => ({
  label: `${id}-label`,
  hint: `${id}-hint`,
  error: `${id}-error`,
})

/** `aria-describedby` value pointing at a control's visible hint and/or error. */
export function describedBy(
  id: string,
  { hint, error }: { hint?: unknown; error?: unknown },
): string | undefined {
  const ids = fieldIds(id)
  if (error) return ids.error
  return hint ? ids.hint : undefined
}
