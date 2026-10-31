import { z } from 'zod'
import { snippetSchema, type LanguageId } from '@snipit/shared'

/**
 * Share links carry the snippet itself, compressed into the URL *fragment*:
 *   https://<site>/share#v1.<lz-string, URI-safe>
 * Browsers never send the fragment to the server, so sharing uploads nothing anywhere.
 */
export const SHARE_PATH = '/share'
const FORMAT_PREFIX = 'v1.'
/** Links longer than this get a warning: some chat apps and email clients cut long URLs. */
export const LONG_SHARE_LINK_CHARS = 8000
/** Refuse absurd fragments before trying to decompress them. */
const MAX_FRAGMENT_CHARS = 1_000_000

/** What a link shares: content and metadata only — no id, stats or collection. */
export type SharedSnippet = {
  title: string
  content: string
  description: string
  language: LanguageId
  tags: string[]
}

/** Short keys keep links shorter. Lenient where safe (unknown language → plain text). */
const payloadSchema = z.object({
  t: snippetSchema.shape.title,
  c: snippetSchema.shape.content,
  d: snippetSchema.shape.description,
  l: snippetSchema.shape.language,
  g: snippetSchema.shape.tags,
})

/** Expected, user-presentable problem with a share link. */
export class ShareLinkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShareLinkError'
  }
}

/* -------------------------------------------------------------------------------------------------
 * Codec (lz-string, loaded on demand)
 * -----------------------------------------------------------------------------------------------*/

type LzString = typeof import('lz-string')

let codec: LzString | null = null
let loading: Promise<LzString> | null = null

/** Loads lz-string once. It is only needed for sharing, so it stays out of the startup bundle. */
export function loadShareCodec(): Promise<LzString> {
  loading ??= import('lz-string')
    .then((module) => {
      // CommonJS package: depending on the bundler the API is the namespace or its default.
      codec = (module as LzString & { default?: LzString }).default ?? module
      return codec
    })
    .catch((error: unknown) => {
      loading = null // allow a retry
      throw error
    })
  return loading
}

/**
 * Warm the codec on intent (menu opened, share button hovered), so creating the link and copying
 * it happen within the click's user activation — Safari drops clipboard writes after long awaits.
 */
export function preloadShareCodec(): void {
  loadShareCodec().catch(() => undefined)
}

/* -------------------------------------------------------------------------------------------------
 * Encode / decode
 * -----------------------------------------------------------------------------------------------*/

export async function createShareLink(
  snippet: SharedSnippet,
  origin: string = window.location.origin,
): Promise<string> {
  const lz = codec ?? (await loadShareCodec())
  const payload = {
    t: snippet.title,
    c: snippet.content,
    ...(snippet.description ? { d: snippet.description } : {}),
    l: snippet.language,
    ...(snippet.tags.length ? { g: snippet.tags } : {}),
  }
  return `${origin}${SHARE_PATH}#${FORMAT_PREFIX}${lz.compressToEncodedURIComponent(JSON.stringify(payload))}`
}

const DAMAGED = 'This share link is damaged or incomplete. Ask for the whole link again.'

/** Some apps percent-encode characters in links they pass on; undo that before decoding. */
function normalizeFragment(fragment: string): string {
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment
  if (!raw.includes('%')) return raw
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** Reads a snippet from a share link's fragment (`location.hash`). Throws {@link ShareLinkError}. */
export async function readShareFragment(fragment: string): Promise<SharedSnippet> {
  const raw = normalizeFragment(fragment)
  if (!raw) throw new ShareLinkError('This share link is incomplete. Ask for the whole link again.')
  if (!raw.startsWith(FORMAT_PREFIX)) {
    throw new ShareLinkError(
      /^v\d+\./.test(raw)
        ? 'This link was made by a newer version of SnipIt. Reload the app to update, then open it again.'
        : 'This is not a SnipIt share link.',
    )
  }
  if (raw.length > MAX_FRAGMENT_CHARS) throw new ShareLinkError('This share link is too large to open.')

  const lz = codec ?? (await loadShareCodec())
  let data: unknown
  try {
    const json = lz.decompressFromEncodedURIComponent(raw.slice(FORMAT_PREFIX.length))
    if (!json) throw new ShareLinkError(DAMAGED)
    data = JSON.parse(json)
  } catch {
    throw new ShareLinkError(DAMAGED)
  }

  const result = payloadSchema.safeParse(data)
  if (!result.success) throw new ShareLinkError(DAMAGED)
  const { t, c, d, l, g } = result.data
  return { title: t, content: c, description: d, language: l, tags: g }
}
