# Phase 1 — Local-first PWA (Frontend)

**Goal:** a complete, polished snippet manager that runs entirely in the browser, works offline,
can be installed on desktop and mobile, and is deployed to Netlify.
**Estimate:** ~3 days. **Location:** `apps/web` (plus `packages/shared` for schemas).

Back to [plan index](README.md) · Next: [Phase 2 — Backend](phase-2-backend.md)

---

## 1. Features (MVP scope)

| # | Feature | Details |
|---|---|---|
| F1 | **Snippet CRUD** | Title (required), content (required), description, language, tags, collection. Create, edit, duplicate, delete. |
| F2 | **One-click copy** | The main button on every card. Icon changes to ✓ for 1.5 s, "Copied" toast, `copyCount++`, `lastCopiedAt = now`. |
| F3 | **Instant search** | Fuzzy (Fuse.js) over title, tags, description and content. Results update on every keystroke and match words highlighted. |
| F4 | **Filters and sort** | Filter by collection, tags (multi), language and favorites. Sort by recently used, most copied, recently updated, or A–Z. Stored in the URL. |
| F5 | **Collections** | Create, rename, recolour and delete (snippets move to "Unsorted"). Colour dot and optional emoji. Count badge. |
| F6 | **Tags** | Tag input with autocomplete. Tags are normalized (trimmed, lowercased, spaces become `-`, de-duplicated). The sidebar lists tags with counts. |
| F7 | **Favorites** | Star toggle; "Favorites" view in the navigation. |
| F8 | **Import / export** | Versioned JSON backup. Import validates with zod, shows a preview, then applies with **Merge** or **Replace**. |
| F9 | **Keyboard shortcuts** | Command palette, navigation and actions (see §6). `?` opens a cheat sheet. |
| F10 | **PWA** | Installable, fully offline, "Update available → Reload" prompt. |
| F11 | **Themes** | Light, dark or system; remembered per device. |
| F12 | **Data safety** | `navigator.storage.persist()` request, "Last backup N days ago" reminder, Undo on delete. |

### Stretch features (Phase 1.5, optional)
- **Template variables:** content like `Hi {{name}}, order {{orderId}}` opens a small fill-in form before copying.
- **Trash:** soft-deleted snippets are restorable for 30 days.
- **Grid/list view toggle**; drag-and-drop collection ordering (dnd-kit).
- **Bulk select:** move, tag or delete many snippets at once.
- **Share by URL:** a snippet is compressed into the link hash (lz-string), no server needed.

---

## 2. UI / UX design

### 2.1 Design principles
1. **Copy is the hero.** Every card has one obvious primary action. Secondary actions (edit, duplicate,
   export, delete) live in a `⋯` menu.
2. **Calm and content-first.** Neutral surfaces, one accent colour, generous whitespace, readable monospace.
3. **Forgiving.** Destructive actions offer Undo rather than "Are you sure?" dialogs (except Replace-import).
4. **Keyboard and touch are first-class.** Every action is reachable by keyboard; touch targets are at least 44 px.

### 2.2 Visual system
| Token | Value |
|---|---|
| Base palette | Tailwind **zinc** (backgrounds, borders, text) |
| Accent | **indigo** (`indigo-600` in light, `indigo-400` in dark) for primary buttons, focus rings, active nav |
| Semantic | green (success/copied), amber (favorite star), red (destructive) |
| Radius | `12px` cards and dialogs, `8px` inputs and buttons, full pills for tags |
| Elevation | 1 px border plus a very soft shadow; card lifts slightly on hover (`translate-y-[-1px]`, stronger shadow) |
| Fonts | **Inter** (UI), **JetBrains Mono** (code) |
| Type scale | 12 / 14 (body) / 16 / 20 / 24 / 30 |
| Spacing | 4 px grid; page gutter 16 px on mobile, 24–32 px on desktop |
| Motion | 150–200 ms ease-out; disabled under `prefers-reduced-motion` |
| Contrast | WCAG AA (4.5:1 for text) in both themes |

Colours are defined as CSS variables (the shadcn theme convention), so changing the accent later is a one-file change.

### 2.3 Responsive layouts
Breakpoints follow Tailwind: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

**Desktop (≥ 1024 px):** persistent sidebar + content + optional detail panel
```
┌───────────────┬──────────────────────────────────────────────────┐
│ ◇ SnipIt      │ 🔍 Search snippets…  (Ctrl+K)    [Sort ▾] [⊞|☰] │
│ [+ New   N]   │ Chips: [All langs ▾] [#sql ×] [#git ×]           │
│               ├──────────────────────────────────────────────────┤
│ ▸ All      42 │ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│ ★ Favorites 6 │ │ Git undo    ⋯│ │ Welcome mail⋯│ │ SQL top N ⋯│ │
│ ⏱ Recent      │ │ ┌──────────┐ │ │ Hi {{name}}, │ │ SELECT …   │ │
│               │ │ │git reset │ │ │ Thanks for…  │ │            │ │
│ COLLECTIONS + │ │ └──────────┘ │ │              │ │            │ │
│ ● Git      12 │ │ #git  bash   │ │ #email  text │ │ #sql  sql  │ │
│ ● SQL       8 │ │ ★   [⧉ Copy] │ │ ☆   [⧉ Copy] │ │ ★  [⧉ Copy]│ │
│ ● Emails    5 │ └──────────────┘ └──────────────┘ └────────────┘ │
│ TAGS          │                                                  │
│ #git #sql …   │                                                  │
│ ⚙ Settings    │                                                  │
└───────────────┴──────────────────────────────────────────────────┘
```
Clicking a card opens a **detail panel** on the right (`xl` and up) or a dialog (smaller screens) with
the full highlighted content, metadata, Copy and Edit buttons.

**Tablet (768–1023 px):** the sidebar collapses to an icon rail and expands on hover or tap. Two-column grid.

**Mobile (< 768 px):**
```
┌─────────────────────────┐
│ ☰  SnipIt          🌓   │
│ 🔍 Search…              │
│ [Git][SQL][Emails] →    │  ← collection chips you scroll sideways
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Git undo          ⋯ │ │
│ │ git reset --soft…   │ │
│ │ #git     [⧉ Copy]   │ │  ← 44 px+ tap targets
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ …                   │ │
│                    (+)  │  ← floating "new" button
├─────────────────────────┤
│  ▤ All  ★ Fav  ▣ Coll ⚙ │  ← bottom navigation
└─────────────────────────┘
```
- The sidebar becomes a slide-in **Sheet** (☰).
- Filters, sort and the `⋯` menu open as **bottom sheets** (thumb-friendly).
- The editor opens **full-screen**, with Save in the top bar.
- Single-column cards; the bottom nav respects the safe area (`env(safe-area-inset-bottom)`).

### 2.4 Snippet card anatomy
```
┌─────────────────────────────────┐
│ Title (1 line, ellipsis)      ⋯ │
│ Description (max 2 lines)       │
│ ┌─────────────────────────────┐ │
│ │ highlighted code, max 6     │ │  ← fades out at the bottom (gradient mask)
│ │ lines, monospace            │ │
│ └─────────────────────────────┘ │
│ ● Collection  #tag #tag +2      │
│ SQL · 2d ago · 14×   ★ [⧉ Copy] │
└─────────────────────────────────┘
```

### 2.5 Key states
| State | Design |
|---|---|
| First run (no data) | Friendly empty state, "Create your first snippet" + "Import backup" buttons + "Load sample snippets" |
| No search results | "No snippets match 'xyz'", plus a button to clear filters |
| Loading | Skeleton cards (Dexie is fast, so this is rarely seen) |
| Copied | Button becomes a ✓ in green for 1.5 s; toast "Copied 'Git undo'" |
| Deleted | Card animates out; toast "Snippet deleted · Undo" (5 s) |
| Offline | Small "Offline" badge (the app still works fully) |
| Update available | Toast "New version available · Reload" |

---

## 3. Routes

| Path | View |
|---|---|
| `/` | All snippets |
| `/favorites` | Favorites |
| `/recent` | Sorted by `lastCopiedAt`, then `updatedAt` |
| `/collections/:collectionId` | One collection |
| `/settings` | Theme, backup and import, storage info, shortcuts, about |

URL query parameters keep views shareable and bookmarkable:
`?q=git&tags=sql,prod&lang=sql&sort=copied&snippet=<id>` (`snippet` opens the detail panel).

---

## 4. Data model

Defined once as **zod schemas in `packages/shared`**, and TS types are inferred from them (`z.infer`).

```ts
type Snippet = {
  id: string;               // crypto.randomUUID(), generated on the client (needed for sync later)
  title: string;            // 1–120 chars
  content: string;          // 1–100 000 chars
  description?: string;     // ≤ 500 chars
  language: string;         // 'plaintext' | 'markdown' | 'bash' | 'sql' | 'javascript' | ...
  tags: string[];           // normalized, ≤ 20 tags
  collectionId: string | null;
  isFavorite: boolean;
  copyCount: number;
  lastCopiedAt: number | null;  // epoch ms
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;     // soft delete → Undo, Trash, and Phase 2 sync
};

type Collection = {
  id: string;
  name: string;             // 1–60 chars, unique (case-insensitive)
  color: string;            // one of a fixed palette key, e.g. 'indigo' | 'emerald' | 'amber' ...
  icon?: string;            // optional emoji
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

type Settings = {           // stored as a single row in a key-value table
  theme: 'light' | 'dark' | 'system';
  defaultLanguage: string;
  lastBackupAt: number | null;
};
```

**Tags are derived** from snippets (no separate table), so there is nothing to keep in sync.
`normalizeTag(" My Tag ") → "my-tag"`.

### 4.1 Dexie schema
```ts
db.version(1).stores({
  snippets:    'id, collectionId, *tags, language, isFavorite, updatedAt, lastCopiedAt, deletedAt',
  collections: 'id, sortOrder, deletedAt',
  settings:    'key',
});
```
`*tags` is a multi-entry index, so "all snippets with tag X" is a fast indexed lookup.
Future changes add `db.version(2)` with an upgrade function and never edit version 1.

### 4.2 Repository pattern (the bridge to Phase 2)
UI code never touches Dexie directly. It goes through repositories:

```ts
interface SnippetRepository {
  list(): Promise<Snippet[]>;
  get(id: string): Promise<Snippet | undefined>;
  create(input: SnippetInput): Promise<Snippet>;
  update(id: string, patch: Partial<SnippetInput>): Promise<Snippet>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  recordCopy(id: string): Promise<void>;
}
// + CollectionRepository, SettingsRepository
```
React hooks (`useSnippets()`, `useCollections()`) wrap `useLiveQuery` so the UI updates automatically
after any write. Phase 2 keeps these hooks and adds a sync layer underneath.

### 4.3 Backup file format
```json
{
  "app": "snipit",
  "version": 1,
  "exportedAt": "2026-10-17T10:00:00.000Z",
  "collections": [ /* Collection[] */ ],
  "snippets":    [ /* Snippet[] */ ]
}
```
- **Export:** downloads `snipit-backup-YYYY-MM-DD.json` (all collections, or just the current one) and updates `lastBackupAt`.
- **Import:** parse, check `app`/`version` (migrate older versions), validate every record with zod, then show a **preview**
  ("15 new · 3 updated · 2 invalid skipped").
  - **Merge** (default): match by `id`; the newer `updatedAt` wins.
  - **Replace:** wipe and restore (confirmation dialog, plus an automatic backup of current data first).
- Import never crashes on bad files. It shows a clear error instead.

---

## 5. Search, filter and sort

- A Fuse.js index is built from the non-deleted snippets with `useMemo` and rebuilt when data changes
  (fine for thousands of snippets).
- Keys and weights: `title 0.5`, `tags 0.25`, `description 0.15`, `content 0.1`. Options: `threshold ≈ 0.35`,
  `ignoreLocation: true`, `includeMatches: true` (to highlight matches).
- Pipeline: **filter** (collection → tags → language → favorites) → **search** (if `q`) → **sort**
  (search relevance first when `q` is set, otherwise the selected sort).
- Input is debounced by ~100 ms only if profiling shows a need; otherwise update immediately.
- Search logic lives in plain functions (`features/search/lib`) so it is easy to unit test.

---

## 6. Keyboard shortcuts

Single-key shortcuts are **disabled while typing** in inputs (react-hotkeys-hook default).
`Mod` = `Ctrl` on Windows/Linux and `⌘` on macOS.

| Keys | Action |
|---|---|
| `Mod+K` | Open command palette: search snippets, **Enter = copy**, `Mod+Enter` = open; also has commands like "New snippet" and "Toggle theme" |
| `/` | Focus the search box |
| `N` | New snippet |
| `↑ ↓` or `J K` | Move selection in the list |
| `Enter` or `C` | Copy the selected snippet |
| `O` | Open the selected snippet's details |
| `E` | Edit the selected snippet |
| `F` | Toggle favorite on the selected snippet |
| `Delete` | Delete the selected snippet (with Undo) |
| `Mod+S` / `Mod+Enter` | Save in the editor |
| `Esc` | Close dialog / panel / palette; clear search |
| `G` then `A` / `F` / `S` | Go to All / Favorites / Settings |
| `?` | Shortcut cheat sheet |

Shortcuts are defined in **one registry file** (`lib/shortcuts.ts`) that is used both to bind them and to
render the cheat sheet, so the two never drift apart.

---

## 7. Copy-to-clipboard

```ts
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);       // needs HTTPS or localhost
  } catch {
    // fallback: hidden <textarea> + document.execCommand('copy')
  }
}
```
Wrapped in a reusable `<CopyButton>` and a `useCopySnippet()` hook (copy, toast, and `recordCopy`).

---

## 8. PWA

- **vite-plugin-pwa** with `registerType: 'prompt'`: when a new version is deployed, show the "Update
  available · Reload" toast instead of reloading silently. *(Check its peer-dependency support for
  Vite 8 at install time.)*
- **Manifest:** name "SnipIt", `display: standalone`, `theme_color` and `background_color` matching the
  theme, icons 192/512 + maskable + Apple touch icon (generated with `@vite-pwa/assets-generator` from one SVG).
- **Offline:** precache the app shell, fonts and lazy chunks. All data lives in IndexedDB, so everything works offline.
- **Install button** in Settings (uses the `beforeinstallprompt` event where supported; iOS shows
  "Share → Add to Home Screen" instructions).
- **Storage persistence:** call `navigator.storage.persist()` after the first snippet is saved, and show
  usage via `navigator.storage.estimate()` in Settings.
  > ⚠️ Safari can delete site data after ~7 days of no use **unless the app is installed to the home screen.**
  > The backup reminder and the install prompt mitigate this. Phase 2 sync removes the risk completely.

---

## 9. Folder structure (`apps/web/src`)

```
src/
├─ app/
│  ├─ App.tsx                 # providers + router
│  ├─ routes.tsx
│  ├─ layouts/AppLayout.tsx   # sidebar / top bar / bottom nav / outlet
│  └─ providers/ThemeProvider.tsx
├─ components/
│  ├─ ui/                     # shadcn primitives: button, dialog, sheet, dropdown-menu, command, ...
│  ├─ CopyButton.tsx
│  ├─ CodeBlock.tsx           # highlighted, read-only
│  ├─ TagInput.tsx
│  ├─ TagBadge.tsx
│  ├─ ColorDot.tsx
│  ├─ EmptyState.tsx
│  ├─ Kbd.tsx                 # renders key hints like ⌘K
│  └─ ResponsiveDialog.tsx    # Dialog on desktop, bottom Sheet on mobile
├─ features/
│  ├─ snippets/
│  │  ├─ components/          # SnippetCard, SnippetGrid, SnippetDetail, SnippetEditor, SnippetActionsMenu
│  │  ├─ hooks/               # useSnippets, useSnippet, useCopySnippet, useSnippetMutations
│  │  └─ lib/                 # normalizeTag, languages list, sample data
│  ├─ collections/            # CollectionList, CollectionDialog, useCollections
│  ├─ search/                 # SearchBar, FilterBar, CommandPalette, lib/searchSnippets.ts
│  ├─ backup/                 # ExportButton, ImportDialog, lib/backup.ts (parse/validate/merge)
│  └─ settings/               # SettingsPage, ShortcutsDialog, InstallAppCard
├─ db/
│  ├─ db.ts                   # Dexie instance + schema versions
│  └─ repositories/           # snippetRepo.ts, collectionRepo.ts, settingsRepo.ts
├─ lib/
│  ├─ clipboard.ts
│  ├─ shortcuts.ts            # shortcut registry
│  ├─ dates.ts                # relative time via Intl.RelativeTimeFormat
│  └─ utils.ts                # cn() helper etc.
├─ styles/index.css           # Tailwind import + theme CSS variables
└─ main.tsx
```

`packages/shared/src`: `schemas/snippet.ts`, `schemas/collection.ts`, `schemas/backup.ts`, `index.ts`.

---

## 10. Performance and quality targets

| Target | Value |
|---|---|
| Lighthouse (Performance, Accessibility, Best Practices, SEO, PWA checks) | ≥ 95 |
| Initial JS (gzip) | ≤ ~200 KB. CodeMirror and its language packs are **lazy-loaded** when the editor opens |
| Search latency with 2 000 snippets | < 50 ms per keystroke |
| Accessibility | Keyboard-only usable, visible focus rings, labelled icon buttons, `aria-live` for toasts |

### Testing
| Layer | What | Tools |
|---|---|---|
| Unit | `normalizeTag`, search/filter/sort pipeline, backup parse/validate/merge, date formatting | Vitest |
| Component | `CopyButton`, `TagInput`, `SnippetEditor` validation, `ImportDialog` preview | React Testing Library |
| Data | Repositories against an in-memory IndexedDB | `fake-indexeddb` |
| E2E (optional) | Create, then search, then copy; import/export round-trip; mobile viewport | Playwright |

---

## 11. Deployment (Netlify)

`netlify.toml` at the repo root:
```toml
[build]
  command = "npm run build"
  publish = "apps/web/dist"

[build.environment]
  NODE_VERSION = "22"

# SPA fallback: every unknown path serves index.html
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
Steps: push to GitHub → Netlify "Add new site → Import from Git" → select repo → deploy.
Each PR gets an automatic **deploy preview** URL.

> If you ever switch to GitHub Pages: set `base: '/SnipIt/'` in `vite.config.ts`, use a matching PWA
> `scope`/`start_url`, and handle SPA routing (HashRouter or a `404.html` copy).

---

## 12. Task checklist

### Day 1 — Foundation
- [x] Scaffold Vite + React + TS in `apps/web`, npm workspaces root
- [ ] Add Prettier; confirm oxlint config
- [ ] Tailwind CSS v4 (`@tailwindcss/vite`), `@/` path alias in `tsconfig` + `vite.config`
- [ ] `shadcn init`; add button, input, textarea, dialog, sheet, dropdown-menu, command, select, badge, tooltip, sonner, skeleton
- [ ] Theme tokens (zinc + indigo), Inter + JetBrains Mono, ThemeProvider (light/dark/system)
- [ ] App shell: desktop sidebar, tablet rail, mobile top bar + Sheet + bottom nav + FAB
- [ ] React Router routes + layout
- [ ] `packages/shared`: zod schemas for Snippet, Collection, Backup
- [ ] Dexie DB + repositories + `useSnippets` / `useCollections` hooks
- [ ] Sample data loader (for development and the empty state)
- [ ] `SnippetEditor` (react-hook-form + zod, lazy CodeMirror, `TagInput`, language and collection selects)

### Day 2 — Core features
- [ ] `SnippetCard` + `SnippetGrid` with highlighted, fading preview
- [ ] `SnippetDetail` panel/dialog
- [ ] `CopyButton` + `useCopySnippet` (clipboard fallback, toast, copy stats)
- [ ] Actions menu: edit, duplicate, favorite, move to collection, export, delete with Undo
- [ ] Search (Fuse.js) + `FilterBar` (collection, tags, language, favorites) + sort, synced to the URL
- [ ] Collections CRUD + sidebar list with counts; tags list with counts
- [ ] Command palette (`Mod+K`) + shortcut registry + list keyboard navigation + `?` cheat sheet

### Day 3 — Polish and ship
- [ ] Export / Import (preview, merge/replace, error handling) in Settings
- [ ] PWA: manifest, generated icons, offline precache, update prompt, install card
- [ ] Storage persistence + backup reminder
- [ ] Empty, no-results, offline and loading states
- [ ] Accessibility pass (keyboard only, screen reader labels, contrast) in both themes
- [ ] Responsive QA at 360, 768, 1024 and 1440 px
- [ ] Unit and component tests for logic-heavy code
- [ ] `netlify.toml`, first deploy, Lighthouse check
- [ ] Root README: screenshots/GIF, features, shortcuts, tech stack, live link

### Phase 1.5 — Stretch (optional)
- [ ] Template variables `{{name}}` with a fill-in form before copy
- [ ] Trash view (restore / delete forever, auto-purge after 30 days)
- [ ] Grid/list toggle; dnd-kit collection ordering
- [ ] Bulk select actions
- [ ] Share snippet via URL (lz-string)

### Phase 1 definition of done
The app is deployed on Netlify, is installable, works offline, every MVP feature (F1–F12) works on mobile
and desktop in both themes, tests pass, lint is clean and Lighthouse is ≥ 95.
