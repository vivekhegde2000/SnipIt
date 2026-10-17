import { useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type Ref } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Hash, X } from 'lucide-react'
import { LIMITS, normalizeTag, normalizeTags } from '@snipit/shared'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

const MAX_SUGGESTIONS = 8

type TagInputProps = {
  id?: string
  value: readonly string[]
  onChange: (tags: string[]) => void
  onBlur?: () => void
  /** Existing tags offered as autocomplete options (most relevant first). */
  suggestions?: readonly string[]
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
  'aria-describedby'?: string
}

/**
 * Chip-style tag editor with autocomplete.
 * Enter / comma / Tab adds a tag, Backspace on an empty field removes the last one, pasting a
 * comma-separated list adds them all. Tags are normalized the same way as on save.
 */
export function TagInput({
  id,
  value,
  onChange,
  onBlur,
  suggestions = [],
  placeholder = 'Add tags…',
  disabled,
  invalid,
  ref,
  'aria-describedby': ariaDescribedBy,
}: TagInputProps) {
  const listboxId = useId()
  const optionIdPrefix = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [draft, setDraft] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  /** Suggestions were dismissed (Escape / outside click) until the user types or presses ↓. */
  const [isDismissed, setIsDismissed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const isFull = value.length >= LIMITS.tagsPerSnippetMax

  const options = useMemo(() => {
    if (isFull) return []
    const query = normalizeTag(draft)
    const selected = new Set(value)
    const matches: string[] = []
    for (const tag of suggestions) {
      if (selected.has(tag) || (query && !tag.includes(query))) continue
      matches.push(tag)
      if (matches.length === MAX_SUGGESTIONS) break
    }
    return matches
  }, [draft, suggestions, value, isFull])

  const isOpen = isFocused && !isDismissed && options.length > 0
  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined

  const addTags = (raw: readonly string[]) => {
    const next = normalizeTags([...value, ...raw])
    if (next.length !== value.length || next.some((tag, i) => tag !== value[i])) onChange(next)
    setDraft('')
    setActiveIndex(-1)
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
    inputRef.current?.focus()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value
    setIsDismissed(false)
    // A comma (typed or pasted) completes every tag before it.
    if (text.includes(',')) {
      const parts = text.split(',')
      const rest = parts.pop() ?? ''
      addTags(parts)
      setDraft(rest.trimStart())
      return
    }
    setDraft(text)
    setActiveIndex(-1)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter': {
        // Never let Enter submit the surrounding form from inside the tag field.
        event.preventDefault()
        if (activeOption) addTags([activeOption])
        else if (draft.trim()) addTags([draft])
        break
      }
      case 'Tab': {
        if (draft.trim()) addTags([draft])
        break
      }
      case 'Backspace': {
        if (!draft && value.length > 0) {
          event.preventDefault()
          onChange(value.slice(0, -1))
        }
        break
      }
      case 'ArrowDown': {
        if (options.length === 0) break
        event.preventDefault()
        if (!isOpen) {
          setIsDismissed(false)
          setActiveIndex(0)
          break
        }
        setActiveIndex((index) => (index + 1) % options.length)
        break
      }
      case 'ArrowUp': {
        if (!isOpen) break
        event.preventDefault()
        setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1))
        break
      }
      case 'Escape': {
        if (isOpen) {
          // Close only the suggestions; a second Escape closes the surrounding dialog as usual.
          event.preventDefault()
          event.stopPropagation()
          setIsDismissed(true)
          setActiveIndex(-1)
        }
        break
      }
    }
  }

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsDismissed(true)
          setActiveIndex(-1)
        }
      }}
    >
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          onClick={() => inputRef.current?.focus()}
          aria-disabled={disabled}
          className={cn(
            'flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs transition-[border-color,box-shadow] dark:bg-input/30 pointer-coarse:min-h-10',
            'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
            invalid &&
              'border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <AnimatePresence initial={false}>
            {value.map((tag) => (
              <m.span
                key={tag}
                layout="position"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7, transition: TRANSITION.fast }}
                transition={TRANSITION.pop}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-accent pr-1 pl-2 text-xs font-medium text-accent-foreground"
              >
                <Hash className="size-3 opacity-60" aria-hidden="true" />
                {tag}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeTag(tag)
                  }}
                  disabled={disabled}
                  aria-label={`Remove tag ${tag}`}
                  className="grid size-4 place-items-center rounded-full opacity-60 transition hover:bg-foreground/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </m.span>
            ))}
          </AnimatePresence>
          <input
            id={id}
            ref={setRefs}
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              setIsDismissed(false)
            }}
            onBlur={() => {
              setIsFocused(false)
              if (draft.trim()) addTags([draft])
              onBlur?.()
            }}
            disabled={disabled}
            // Read-only (not disabled) when full, so Backspace can still remove the last tag.
            readOnly={isFull}
            placeholder={
              isFull ? `Maximum ${LIMITS.tagsPerSnippetMax} tags` : value.length ? '' : placeholder
            }
            maxLength={LIMITS.tagMax + 8}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="enter"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={activeOption ? `${optionIdPrefix}-${activeIndex}` : undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={ariaDescribedBy}
            className="h-6 min-w-24 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed sm:text-sm"
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) gap-0 p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // Clicking inside the field itself must not count as an "outside" dismissal.
        onInteractOutside={(event) => {
          if (anchorRef.current?.contains(event.target as Node)) event.preventDefault()
        }}
      >
        <ul id={listboxId} role="listbox" aria-label="Tag suggestions" className="max-h-56 overflow-y-auto">
          {options.map((tag, index) => (
            <li
              key={tag}
              id={`${optionIdPrefix}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // Keep focus in the input while clicking an option.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => addTags([tag])}
              // mousemove (not mouseenter): a list opening under a resting pointer must not
              // silently highlight an option and hijack the next Enter.
              onMouseMove={() => index !== activeIndex && setActiveIndex(index)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                index === activeIndex && 'bg-accent text-accent-foreground',
              )}
            >
              <Hash className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {tag}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
