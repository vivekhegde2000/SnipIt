/**
 * Generates an RFC 4122 v4 UUID.
 *
 * `crypto.randomUUID()` is only exposed in secure contexts (HTTPS / localhost), so when the app is
 * opened over plain HTTP (e.g. testing on a phone via a LAN IP) we fall back to
 * `crypto.getRandomValues()`, which is available everywhere.
 */
export function createId(): string {
  if (typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80 // variant 10xx

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
