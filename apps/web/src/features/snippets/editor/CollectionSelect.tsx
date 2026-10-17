import type { Ref } from 'react'
import { FolderOpen } from 'lucide-react'
import type { Collection } from '@snipit/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorDot } from '@/components/ColorDot'

/** Radix Select forbids an empty-string value, so "no collection" needs a sentinel. */
const NONE = '__none__'

type CollectionSelectProps = {
  id?: string
  value: string | null
  onChange: (value: string | null) => void
  collections: readonly Collection[]
  invalid?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function CollectionSelect({ id, value, onChange, collections, invalid, ref }: CollectionSelectProps) {
  return (
    <Select value={value ?? NONE} onValueChange={(next) => onChange(next === NONE ? null : next)}>
      <SelectTrigger id={id} ref={ref} aria-invalid={invalid || undefined} className="h-10 w-full sm:h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        <SelectItem value={NONE}>
          <FolderOpen className="text-muted-foreground" aria-hidden="true" />
          No collection
        </SelectItem>
        {collections.length > 0 && <SelectSeparator />}
        {collections.map((collection) => (
          <SelectItem key={collection.id} value={collection.id}>
            <ColorDot color={collection.color} />
            <span className="truncate">
              {collection.icon && <span aria-hidden="true">{collection.icon} </span>}
              {collection.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
