import {
  createId,
  snippetSchema,
  type Collection,
  type CollectionColor,
  type LanguageId,
  type Snippet,
} from '@snipit/shared'
import { db } from './db'

type SampleCollection = { key: string; name: string; color: CollectionColor; icon: string }

type SampleSnippet = {
  title: string
  description: string
  language: LanguageId
  tags: string[]
  collection: string | null
  isFavorite?: boolean
  content: string
}

const SAMPLE_COLLECTIONS: SampleCollection[] = [
  { key: 'git', name: 'Git', color: 'orange', icon: '🌿' },
  { key: 'sql', name: 'SQL', color: 'sky', icon: '🗄️' },
  { key: 'email', name: 'Email templates', color: 'emerald', icon: '✉️' },
  { key: 'docker', name: 'Docker', color: 'violet', icon: '🐳' },
]

const SAMPLE_SNIPPETS: SampleSnippet[] = [
  {
    title: 'Undo last commit (keep changes)',
    description: 'Moves HEAD back one commit; your changes stay staged.',
    language: 'bash',
    tags: ['git', 'undo'],
    collection: 'git',
    isFavorite: true,
    content: 'git reset --soft HEAD~1',
  },
  {
    title: 'Delete merged local branches',
    description: 'Removes every local branch already merged into main.',
    language: 'bash',
    tags: ['git', 'cleanup'],
    collection: 'git',
    content: 'git branch --merged main | grep -vE "^\\*|\\bmain$" | xargs -r git branch -d',
  },
  {
    title: 'Pretty commit graph',
    description: 'Compact, decorated history of all branches.',
    language: 'bash',
    tags: ['git', 'log'],
    collection: 'git',
    content: 'git log --oneline --graph --decorate --all -20',
  },
  {
    title: 'Top N rows per group',
    description: 'Latest 3 orders per customer using a window function.',
    language: 'sql',
    tags: ['sql', 'window-functions', 'postgres'],
    collection: 'sql',
    isFavorite: true,
    content: `SELECT *
FROM (
  SELECT o.*,
         ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
  FROM orders o
) ranked
WHERE rn <= 3;`,
  },
  {
    title: 'Find duplicate emails',
    description: 'Lists emails used by more than one user.',
    language: 'sql',
    tags: ['sql', 'data-quality'],
    collection: 'sql',
    content: `SELECT LOWER(email) AS email, COUNT(*) AS total
FROM users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1
ORDER BY total DESC;`,
  },
  {
    title: 'PostgreSQL table sizes',
    description: 'Largest tables including indexes and TOAST.',
    language: 'sql',
    tags: ['sql', 'postgres', 'ops'],
    collection: 'sql',
    content: `SELECT relname AS table_name,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;`,
  },
  {
    title: 'Meeting follow-up',
    description: 'Friendly recap after a call.',
    language: 'plaintext',
    tags: ['email', 'meetings'],
    collection: 'email',
    isFavorite: true,
    content: `Hi {{name}},

Thanks for your time today. A quick recap of what we agreed:

• {{point_1}}
• {{point_2}}

Next step: {{next_step}} by {{date}}.

Best regards,
{{my_name}}`,
  },
  {
    title: 'Out of office reply',
    description: 'Automatic reply while on leave.',
    language: 'plaintext',
    tags: ['email', 'auto-reply'],
    collection: 'email',
    content: `Hello,

I'm out of the office until {{return_date}} with limited access to email.
For anything urgent, please contact {{backup_name}} at {{backup_email}}.

Thanks,
{{my_name}}`,
  },
  {
    title: 'Clean up Docker disk space',
    description: 'Removes stopped containers, unused networks and dangling images.',
    language: 'bash',
    tags: ['docker', 'cleanup'],
    collection: 'docker',
    content: 'docker system prune -f && docker image prune -f',
  },
  {
    title: 'Node.js multi-stage Dockerfile',
    description: 'Small production image with a non-root user.',
    language: 'dockerfile',
    tags: ['docker', 'node'],
    collection: 'docker',
    content: `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]`,
  },
  {
    title: 'Free a port on Windows',
    description: 'Finds and stops the process listening on a port.',
    language: 'powershell',
    tags: ['windows', 'networking'],
    collection: null,
    content:
      'Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }',
  },
  {
    title: 'Typed debounce',
    description: 'Delays a function until calls stop for `wait` ms.',
    language: 'typescript',
    tags: ['typescript', 'utils'],
    collection: null,
    content: `export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, wait = 200) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}`,
  },
]

const HOUR = 60 * 60 * 1000

/**
 * Adds the sample library. Collections that already exist (same name) are reused, so running it
 * twice never creates duplicate collections. Returns the number of snippets added.
 */
export async function seedSampleData(): Promise<number> {
  return db.transaction('rw', db.collections, db.snippets, async () => {
    const now = Date.now()
    const existing = (await db.collections.toArray()).filter((c) => c.deletedAt === null)
    const byName = new Map(existing.map((c) => [c.name.toLocaleLowerCase(), c]))
    let nextOrder = existing.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1

    const idsByKey = new Map<string, string>()
    const newCollections: Collection[] = []

    for (const sample of SAMPLE_COLLECTIONS) {
      const match = byName.get(sample.name.toLocaleLowerCase())
      if (match) {
        idsByKey.set(sample.key, match.id)
        continue
      }
      const collection: Collection = {
        id: createId(),
        name: sample.name,
        color: sample.color,
        icon: sample.icon,
        sortOrder: nextOrder++,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      idsByKey.set(sample.key, collection.id)
      newCollections.push(collection)
    }

    const snippets: Snippet[] = SAMPLE_SNIPPETS.map((sample, index) => {
      const timestamp = now - index * HOUR
      return snippetSchema.parse({
        id: createId(),
        title: sample.title,
        content: sample.content,
        description: sample.description,
        language: sample.language,
        tags: sample.tags,
        collectionId: sample.collection ? (idsByKey.get(sample.collection) ?? null) : null,
        isFavorite: sample.isFavorite ?? false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    })

    await db.collections.bulkAdd(newCollections)
    await db.snippets.bulkAdd(snippets)
    return snippets.length
  })
}
