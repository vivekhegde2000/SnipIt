import { toast } from 'sonner'
import { copyText } from '@/lib/clipboard'
import { LONG_SHARE_LINK_CHARS, createShareLink, type SharedSnippet } from './share-link'

/** The system share sheet suits phones and tablets; desktops get "link copied" instead. */
function canUseShareSheet(): boolean {
  return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
}

/** Shares a snippet as a self-contained link: system share sheet on touch devices, else clipboard. */
export async function shareSnippet(snippet: SharedSnippet): Promise<void> {
  let url: string
  try {
    url = await createShareLink(snippet)
  } catch {
    toast.error('Could not create a share link. Please try again.')
    return
  }

  if (canUseShareSheet()) {
    try {
      await navigator.share({ title: snippet.title, url })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return // user closed the sheet
      // Sharing unavailable (e.g. permission policy): fall back to copying the link.
    }
  }

  if (!(await copyText(url))) {
    toast.error('Could not copy the link. Your browser blocked clipboard access.')
    return
  }
  toast.success('Share link copied', {
    id: 'share-link',
    description:
      url.length > LONG_SHARE_LINK_CHARS
        ? `It's a long link (${url.length.toLocaleString()} characters), so some apps may cut it off.`
        : 'Anyone with the link can see this snippet. Nothing is uploaded.',
  })
}
