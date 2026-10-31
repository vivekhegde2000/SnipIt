import { toast } from 'sonner'
import { snippetRepository } from '@/db'
import { copyText } from '@/lib/clipboard'

/** Something whose content can be copied: a library snippet (has an `id`) or a shared one. */
export type CopyTarget = {
  /** Library snippets record copy stats; shared (not yet saved) snippets have no id. */
  id?: string
  title: string
  content: string
}

/**
 * Copies `text` on behalf of `target`, with the standard feedback: an error toast if the
 * browser refuses, otherwise copy stats and a "Copied" toast. Resolves `true` on success.
 */
export async function copyWithFeedback(target: CopyTarget, text: string): Promise<boolean> {
  const copied = await copyText(text)
  if (!copied) {
    toast.error('Could not copy. Your browser blocked clipboard access.')
    return false
  }
  // Usage stats are best-effort; never fail the copy because of them.
  if (target.id) snippetRepository.recordCopy(target.id).catch(() => undefined)
  // A fixed id replaces the previous toast instead of stacking one per copy.
  toast.success(`Copied “${target.title}”`, { id: 'snippet-copied' })
  return true
}
