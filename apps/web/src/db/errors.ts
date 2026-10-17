import type { z } from 'zod'

export type RepositoryErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION'

/** Expected, user-presentable failure from the data layer. `message` is safe to show in the UI. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode

  constructor(code: RepositoryErrorCode, message: string) {
    super(message)
    this.name = 'RepositoryError'
    this.code = code
  }
}

/** Validates `value` with `schema`, throwing a {@link RepositoryError} with the first issue. */
export function parseOrThrow<Schema extends z.ZodType>(schema: Schema, value: unknown): z.output<Schema> {
  const result = schema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new RepositoryError('VALIDATION', issue?.message ?? 'Invalid data')
  }
  return result.data
}

/** Turns any thrown value into a message suitable for a toast. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof RepositoryError) return error.message
  if (error instanceof Error && error.name === 'QuotaExceededError') {
    return 'Your browser storage is full. Free up space or export a backup.'
  }
  return fallback
}
