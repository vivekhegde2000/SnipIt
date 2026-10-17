import type { Ref } from 'react'
import { LANGUAGES, type LanguageId } from '@snipit/shared'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type LanguageSelectProps = {
  id?: string
  value: LanguageId
  onChange: (value: LanguageId) => void
  invalid?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function LanguageSelect({ id, value, onChange, invalid, ref }: LanguageSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as LanguageId)}>
      <SelectTrigger id={id} ref={ref} aria-invalid={invalid || undefined} className="h-10 w-full sm:h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {LANGUAGES.map((language) => (
          <SelectItem key={language.id} value={language.id}>
            {language.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
