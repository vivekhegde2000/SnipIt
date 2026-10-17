import { memo } from 'react'

type HighlightTextProps = {
  text: string
  /** Inclusive [start, end] character ranges to emphasise (e.g. Fuse.js match indices). */
  ranges?: ReadonlyArray<readonly [number, number]>
}

/** Renders `text` with search matches highlighted via `<mark>`. */
export const HighlightText = memo(function HighlightText({ text, ranges }: HighlightTextProps) {
  if (!ranges || ranges.length === 0) return <>{text}</>

  const parts: React.ReactNode[] = []
  let cursor = 0
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  for (const [start, end] of sorted) {
    if (end < cursor) continue
    const from = Math.max(start, cursor)
    if (from > cursor) parts.push(text.slice(cursor, from))
    parts.push(
      <mark key={from} className="rounded-[3px] bg-primary/15 text-inherit dark:bg-primary/25">
        {text.slice(from, end + 1)}
      </mark>,
    )
    cursor = end + 1
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
})
