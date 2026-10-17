import { useState } from 'react'
import { Check, ChevronDown, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { TagCount } from '@/features/library/library-context'
import { cn } from '@/lib/utils'

type TagFilterProps = {
  tags: readonly TagCount[]
  selected: readonly string[]
  onChange: (tags: string[]) => void
}

/** Searchable multi-select of tags (snippets must have all selected tags). */
export function TagFilter({ tags, selected, onChange }: TagFilterProps) {
  const [open, setOpen] = useState(false)
  const toggle = (tag: string) =>
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'shrink-0 gap-1.5',
            selected.length > 0 && 'border-primary/40 bg-accent text-accent-foreground',
          )}
          disabled={tags.length === 0}
        >
          <Hash aria-hidden="true" />
          Tags
          {selected.length > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums">
              {selected.length}
            </span>
          )}
          <ChevronDown className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Filter tags…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tags.map(({ tag, count }) => {
                const isSelected = selected.includes(tag)
                return (
                  <CommandItem key={tag} value={tag} onSelect={() => toggle(tag)} data-checked={isSelected}>
                    <span
                      className={cn(
                        'grid size-4 place-items-center rounded-[5px] border transition-colors',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{tag}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{count}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => onChange([])}>
              Clear tags
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
