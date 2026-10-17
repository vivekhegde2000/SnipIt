import { z } from 'zod'
import { COLLECTION_COLORS, DEFAULT_COLLECTION_COLOR, LIMITS } from './constants.ts'
import { DEFAULT_LANGUAGE, LANGUAGE_IDS } from './languages.ts'
import { normalizeTags } from './tags.ts'

/* -------------------------------------------------------------------------------------------------
 * Primitives
 * -----------------------------------------------------------------------------------------------*/

export const idSchema = z.string().trim().min(1).max(LIMITS.idMax)

/** Unix epoch milliseconds. */
export const timestampSchema = z.number().int().nonnegative()

export const languageIdSchema = z.enum(LANGUAGE_IDS)

export const collectionColorSchema = z.enum(COLLECTION_COLORS)

/** Accepts raw user tags (bounded to stop abuse) and outputs the normalized, de-duplicated list. */
export const tagListSchema = z.array(z.string().max(200)).max(100).transform(normalizeTags)

/* -------------------------------------------------------------------------------------------------
 * Snippet
 * -----------------------------------------------------------------------------------------------*/

/** Fields a user can edit. Used by forms and by repositories before any write. */
export const snippetInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(LIMITS.titleMax, `Title must be ${LIMITS.titleMax} characters or fewer`),
  // Content is stored verbatim (whitespace is meaningful) but must not be blank.
  content: z
    .string()
    .max(
      LIMITS.contentMax,
      `Content must be ${LIMITS.contentMax.toLocaleString('en-US')} characters or fewer`,
    )
    .refine((value) => value.trim().length > 0, 'Content is required'),
  description: z
    .string()
    .trim()
    .max(LIMITS.descriptionMax, `Description must be ${LIMITS.descriptionMax} characters or fewer`),
  language: languageIdSchema,
  tags: tagListSchema,
  collectionId: idSchema.nullable(),
  isFavorite: z.boolean(),
})

/**
 * A persisted snippet. Lenient where it is safe to be (defaults, unknown language → plain text)
 * so that older or hand-edited backups still import cleanly.
 */
export const snippetSchema = z.object({
  id: idSchema,
  title: snippetInputSchema.shape.title,
  content: snippetInputSchema.shape.content,
  description: snippetInputSchema.shape.description.default(''),
  language: languageIdSchema.catch(DEFAULT_LANGUAGE),
  tags: tagListSchema.default([]),
  collectionId: idSchema.nullable().default(null),
  isFavorite: z.boolean().default(false),
  copyCount: z.number().int().nonnegative().default(0),
  lastCopiedAt: timestampSchema.nullable().default(null),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable().default(null),
})

/* -------------------------------------------------------------------------------------------------
 * Collection
 * -----------------------------------------------------------------------------------------------*/

export const collectionInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(LIMITS.collectionNameMax, `Name must be ${LIMITS.collectionNameMax} characters or fewer`),
  color: collectionColorSchema,
  icon: z
    .string()
    .trim()
    .max(LIMITS.collectionIconMax)
    .nullable()
    .transform((value) => value || null),
})

export const collectionSchema = z.object({
  id: idSchema,
  name: collectionInputSchema.shape.name,
  color: collectionColorSchema.catch(DEFAULT_COLLECTION_COLOR),
  icon: collectionInputSchema.shape.icon.default(null),
  sortOrder: z.number().int().default(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable().default(null),
})

/* -------------------------------------------------------------------------------------------------
 * Settings
 * -----------------------------------------------------------------------------------------------*/

export const settingsSchema = z.object({
  defaultLanguage: languageIdSchema.catch(DEFAULT_LANGUAGE),
  lastBackupAt: timestampSchema.nullable().catch(null),
})

export const DEFAULT_SETTINGS: Settings = {
  defaultLanguage: DEFAULT_LANGUAGE,
  lastBackupAt: null,
}

/* -------------------------------------------------------------------------------------------------
 * Backup file
 * -----------------------------------------------------------------------------------------------*/

export const BACKUP_APP_ID = 'snipit'
export const BACKUP_VERSION = 1

/**
 * Envelope of a backup file. Records are validated one by one on import (so a single bad record
 * is skipped and reported instead of rejecting the whole file).
 */
export const backupEnvelopeSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  version: z.number().int().positive(),
  exportedAt: z.iso.datetime(),
  collections: z.array(z.unknown()),
  snippets: z.array(z.unknown()),
})

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

export type SnippetInput = z.output<typeof snippetInputSchema>
export type SnippetFormValues = z.input<typeof snippetInputSchema>
export type Snippet = z.output<typeof snippetSchema>

export type CollectionInput = z.output<typeof collectionInputSchema>
export type CollectionFormValues = z.input<typeof collectionInputSchema>
export type Collection = z.output<typeof collectionSchema>

export type Settings = z.output<typeof settingsSchema>

export type Backup = {
  app: typeof BACKUP_APP_ID
  version: typeof BACKUP_VERSION
  exportedAt: string
  collections: Collection[]
  snippets: Snippet[]
}
