import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { fieldIds } from '@/lib/field-ids'
import { cn } from '@/lib/utils'

type FormFieldProps = {
  /** Id of the control; also used to derive the label/hint/error ids. */
  id: string
  label: ReactNode
  error?: string
  hint?: ReactNode
  optional?: boolean
  /** Extra element on the right of the label row (e.g. a counter). */
  labelAside?: ReactNode
  /** For non-native controls (e.g. CodeMirror) that are labelled via `aria-labelledby`. */
  onLabelClick?: () => void
  className?: string
  children: ReactNode
}

/** Label + control + hint + error, with the accessibility wiring done once. */
export function FormField({
  id,
  label,
  error,
  hint,
  optional,
  labelAside,
  onLabelClick,
  className,
  children,
}: FormFieldProps) {
  const ids = fieldIds(id)
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label id={ids.label} htmlFor={onLabelClick ? undefined : id} onClick={onLabelClick}>
          {label}
          {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
        </Label>
        {labelAside}
      </div>
      {children}
      {hint && !error && (
        <p id={ids.hint} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={ids.error} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
