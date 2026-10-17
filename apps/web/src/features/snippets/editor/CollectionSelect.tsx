import type { Ref } from 'react'
import { FolderOpen, Plus } from 'lucide-react'
import type { Collection } from '@snipit/shared'
import { ColorDot } from '@/components/ColorDot'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCollectionEditor } from '@/features/collections/editor/collection-editor-context'

/** Radix Select forbids an empty-string value, so "no collection" needs a sentinel. */
const NONE = '__none__'
/** Pseudo-option that opens the "New collection" dialog instead of selecting. */
const CREATE = '__create__'

type CollectionSelectProps = {
  id?: string
  value: string | null
  onChange: (value: string | null) => void
  collections: readonly Collection[]
  invalid?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function CollectionSelect({ id, value, onChange, collections, invalid, ref }: CollectionSelectProps) {
  const collectionEditor = useCollectionEditor()

  const handleValueChange = (next: string) => {
    if (next === CREATE) {
      // Create without leaving the snippet editor, then select the new collection.
      collectionEditor.create({ onCreated: (created) => onChange(created.id) })
      return
    }
    onChange(next === NONE ? null : next)
  }

  return (
    <Select value={value ?? NONE} onValueChange={handleValueChange}>
      <SelectTrigger id={id} ref={ref} aria-invalid={invalid || undefined} className="w-full">
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
        <SelectSeparator />
        <SelectItem value={CREATE} className="text-primary focus:text-primary">
          <Plus aria-hidden="true" />
          New collection…
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
