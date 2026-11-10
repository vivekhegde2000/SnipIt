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
| `/trash` | Deleted snippets: restore, delete forever, empty (Phase 1.5) |
| `/share#v1.<data>` | Opens a shared snippet from a link (Phase 1.5) |
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

**Deleted snippets** keep their row with `deletedAt` set: they are in the Trash for
`TRASH_RETENTION_DAYS` (30) and then purged for good (Phase 1.5).

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

Single-key shortcuts are **disabled while typing** (inputs, the code editor) and while a dialog or
menu is open. `Mod` = `Ctrl` on Windows/Linux and `⌘` on macOS.

| Keys | Action |
|---|---|
| `Mod+K` | Command palette: search snippets, **Enter = copy**, `Mod+Enter` = open details; also commands (new snippet/collection, navigation, theme, shortcuts) |
| `/` | Focus the search box (opens the palette on pages without one) |
| `N` | New snippet |
| `J` / `K` | Next / previous snippet card |
| `← ↑ → ↓` | Move between cards (↑/↓ move by a whole row of the grid) |
| `Enter` or `O` | Open the focused snippet's details |
| `C` | Copy the focused snippet |
| `E` / `F` / `D` | Edit / favorite / duplicate the focused snippet |
| `Delete` | Delete the focused snippet (with Undo) |
| `X` | Select / deselect the focused snippet (Phase 1.5) |
| `Mod+A` | Select every listed snippet (library views and Trash) |
| `V` | Switch between grid and list view |
| `Mod+S` / `Mod+Enter` | Save in the editor |
| `Esc` | Close dialog / panel / palette; clear search; exit selection |
| `G` then `A` / `F` / `R` / `C` / `T` / `S` | Go to All / Favorites / Recent / Collections / Trash / Settings |
| `?` | Shortcut cheat sheet |

> Change from the original plan: **Enter opens** and **C copies** (the plan had Enter = copy). Enter
> activating the focused button is what keyboard and screen-reader users expect; in the command
> palette Enter still copies.

The reference lives in **one registry** (`features/commands/shortcuts.ts`) that renders the cheat sheet;
global keys are handled in `use-global-shortcuts.ts`, focused-snippet keys in `snippet-shortcuts.ts`.

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
  available · Reload" toast instead of reloading silently. (vite-plugin-pwa 2.0 supports Vite 8.)
- **Manifest:** name "SnipIt", `display: standalone`, `theme_color` and `background_color` matching the
  theme, icons 192/512 + maskable + Apple touch icon (generated with `@vite-pwa/assets-generator` from one SVG).
- **Offline:** precache the app shell, fonts and lazy chunks. All data lives in IndexedDB, so everything works offline.
- **Install button** in Settings (uses the `beforeinstallprompt` event where supported; iOS shows
  "Share → Add to Home Screen" instructions).
- **Storage persistence:** call `navigator.storage.persist()` once the library has its first snippet, and
  show usage via `navigator.storage.estimate()` in Settings (with a "Protect my data" button).
  > ⚠️ Safari can delete site data after ~7 days of no use **unless the app is installed to the home screen.**
  > The backup reminder and the install prompt mitigate this. Phase 2 sync removes the risk completely.

---

## 9. Folder structure (`apps/web/src`)

```
src/
├─ app/
│  ├─ App.tsx                 # providers (theme, motion, tooltips, toasts, PWA updater) + router
│  ├─ router.tsx              # route table (Settings is lazy-loaded)
│  ├─ layout/                 # AppLayout, Sidebar (full + rail), MobileHeader, BottomNav,
│  │                          #   NewSnippetFab, ThemeToggle, ScrollToTop, nav-items,
│  │                          #   AppLaunchEffects (?new=1 shortcut, storage persistence)
│  ├─ motion/                 # MotionProvider (LazyMotion), lazily loaded feature bundle
│  ├─ pages/                  # NotFoundPage, RouteErrorPage
│  └─ theme/                  # ThemeProvider, theme-context, theme-storage, theme-options
├─ components/
│  ├─ ui/                     # shadcn primitives (generated; edit sparingly)
│  ├─ CopyButton.tsx  FavoriteButton.tsx  HighlightText.tsx  RadioGrid.tsx
│  ├─ TagInput.tsx            # chip input + autocomplete combobox
│  ├─ FormField.tsx  ConfirmDialog.tsx
│  └─ EmptyState.tsx  PageHeader.tsx  ColorDot.tsx  Kbd.tsx  Logo.tsx  OfflineBadge.tsx
├─ features/
│  ├─ library/                # LibraryProvider (live data + counts + tags)
│  ├─ selection/              # multi-select store (per-card subscriptions), SelectionProvider
│  │                          #   (Mod+A / Esc, cleared on page change), use-selectable-item
│  │                          #   (click/Shift/Ctrl/X/long press), SelectionCheckbox, SelectionBar
│  ├─ snippets/
│  │  ├─ actions/             # use-snippet-actions (copy, favorite, move, share, delete+undo…),
│  │  │                       #   copy-snippet, SnippetActionsMenu, snippet-shortcuts
│  │  ├─ bulk/                # lazy BulkActionBar, BulkTagsPopover, use-bulk-actions, bulk-loader
│  │  ├─ template/            # TemplateFillProvider + lazy TemplateFillDialog, remembered values
│  │  ├─ code/                # language loaders, shared syntax highlighter, CodeBlock
│  │  ├─ detail/              # SnippetDetailHost/Sheet, URL-driven detail state
│  │  ├─ editor/              # SnippetEditorProvider/Dialog, lazy CodeEditor, selects
│  │  ├─ components/          # SnippetCard, SnippetRow (list view), SnippetMeta, SnippetGrid,
│  │  │                       #   SnippetToolbar, ViewControls, TagFilter, LibraryWelcome
│  │  ├─ view-layout.ts       # grid/list preference (per device, synced across tabs)
│  │  ├─ hooks/               # use-snippet-query (URL state), use-search-text
│  │  ├─ lib/                 # select-snippets (view/filter/sort), snippet-search (Fuse)
│  │  └─ pages/               # SnippetsPage (all / favorites / recent / collection)
│  ├─ collections/            # CollectionsPage (lazy; dnd-kit reordering), editor (dialog,
│  │                          #   provider), actions menu (incl. Move up/down), use-collection-order
│  ├─ commands/               # CommandPalette, ShortcutsDialog, global shortcuts, registry
│  ├─ settings/               # SettingsPage, DeleteAllDataDialog, StorageSection, use-settings
│  ├─ backup/                 # BackupProvider (file picker, drag & drop, import dialog host),
│  │  ├─ components/          #   ImportDialog, BackupSection (Settings), BackupReminder
│  │  └─ lib/                 #   backup-format (export/parse/validate), import-plan (pure
│  │                          #   merge/replace planning), backup-io (Dexie transaction, download)
│  ├─ pwa/                    # install-prompt, InstallAppSection, PwaUpdater (update/offline toasts)
│  ├─ trash/                  # TrashPage (lazy route)
│  └─ share/                  # share-link (encode/decode, lazy lz-string), share-snippet, SharePage
├─ db/
│  ├─ db.ts                   # Dexie instance + schema versions
│  ├─ errors.ts               # RepositoryError, parseOrThrow, getErrorMessage
│  ├─ maintenance.ts          # deleteAllData, purgeExpiredTrash
│  └─ repositories/           # snippet-, collection-, settings-repository
├─ hooks/                     # use-media-query, use-document-title, use-delayed-flag,
│                             #   use-online-status, use-hide-on-scroll
├─ lib/                       # clipboard, download, keyboard, motion, layout, storage, platform,
│                             #   dates, field-ids, persistent-storage, initial-screen,
│                             #   after-paint (warm lazy chunks when idle), utils
├─ index.css                  # Tailwind + design tokens (light/dark, syntax colours, toast offset)
├─ zod-config.ts              # zod `jitless` — main.tsx's first import, bundled with zod (CSP)
└─ main.tsx
```

Outside `src/`: `public/` (icons generated by `pwa-assets.config.ts`, `theme-init.js`, `robots.txt`),
`vite-plugins/bundle-guard.ts` (build-time bundle checks) and `index.html` (boot splash).

`packages/shared/src`: `constants.ts`, `languages.ts`, `tags.ts`, `id.ts`, `schemas.ts`, `template.ts`, `index.ts`.

---

## 10. Performance and quality targets

| Target | Value |
|---|---|
| Lighthouse (Performance, Accessibility, Best Practices, SEO, PWA checks) | ≥ 95 |
| Initial JS (gzip) | ≤ ~200 KB. CodeMirror and its language packs are **lazy-loaded** when the editor opens |
| Search latency with 2 000 snippets | < 50 ms per keystroke |
| Accessibility | Keyboard-only usable, visible focus rings, labelled icon buttons, `aria-live` for toasts |

**Measured at the end of Day 3** (production build, Lighthouse 12, Edge):

| Metric | Result |
|---|---|
| Lighthouse desktop | Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100** |
| Lighthouse mobile (simulated slow 4G, 4× CPU) | Performance **76–78**, Accessibility **100**, Best Practices **100**, SEO **100** |
| Initial JS (gzip) | ~315 KB: app 95 KB + React 99 KB + data (Dexie, zod) 56 KB + UI (Radix, sonner) 64 KB |
| axe (WCAG 2.2 A/AA) | 0 violations, every page and dialog, light and dark, desktop and mobile |

Mobile performance is below the ≥ 95 target. The app has to download and run its JavaScript
before it can read IndexedDB and show the library, and Lighthouse's mobile profile simulates a
slow phone. The remaining options are architectural, not tuning:
- lazy-load the editor form, command palette and dialogs (about −25 KB gzip, but the first open of
  each gets slower, which is what the Day 1 review asked us to fix), or
- move to lighter libraries (for example Preact or no Radix), which is a large rewrite.

After the first visit everything is served by the service worker, so repeat visits start
instantly, even offline.

### Testing
| Layer | What | Tools |
|---|---|---|
| Unit | `normalizeTag`, search/filter/sort pipeline, backup parse/validate/merge, date formatting | Vitest |
| Component | `CopyButton`, `TagInput`, `SnippetEditor` validation, `ImportDialog` preview | React Testing Library |
| Data | Repositories against an in-memory IndexedDB | `fake-indexeddb` |
| E2E (optional) | Create, then search, then copy; import/export round-trip; mobile viewport | Playwright |

> Automated tests were **not added** in Phase 1, at the project owner's request. Each day was
> verified instead with scripted browser checks against the production build (not committed).

---

## 11. Deployment (Netlify)

[`netlify.toml`](../netlify.toml) at the repo root sets:
- **Build:** `npm run build`, publish `apps/web/dist`, Node 22.
- **SPA fallback:** every unknown path serves `index.html`.
- **Security headers:** a strict Content Security Policy (`script-src 'self'`: no inline scripts and
  no eval), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, COOP and
  `Permissions-Policy`.
- **Caching:** hashed `/assets/*` are immutable for a year. `index.html`, `sw.js`,
  `manifest.webmanifest` and `theme-init.js` are always revalidated, so new deploys and the
  update prompt are picked up.

Steps: push to GitHub → Netlify "Add new site → Import an existing project" → select repo → deploy.
Each PR gets an automatic **deploy preview** URL.

**Live:** [simply-snipit.netlify.app](https://simply-snipit.netlify.app/), deployed from `main` of
`vivekhegde2000/SnipIt` with the settings above; every push to `main` redeploys. Roll back from
Netlify → **Deploys** → pick an older deploy → **Publish deploy**.

> If you ever switch to GitHub Pages: set `base: '/SnipIt/'` in `vite.config.ts`, use a matching PWA
> `scope`/`start_url`, and handle SPA routing (HashRouter or a `404.html` copy).

---

## 12. Task checklist

### Day 1 — Foundation ✅
- [x] Scaffold Vite + React + TS in `apps/web`, npm workspaces root
- [x] Add Prettier; confirm oxlint config (`npm run check` = typecheck + lint + format check)
- [x] Tailwind CSS v4 (`@tailwindcss/vite`), `@/` path alias in `tsconfig` + `vite.config`
- [x] `shadcn init` (Radix base, Nova preset); add button, input, textarea, dialog, alert-dialog, sheet, dropdown-menu, command, select, popover, badge, tooltip, sonner, skeleton, separator, scroll-area
- [x] Theme tokens (zinc + indigo, shared `--syntax-*` colours), Inter + JetBrains Mono, ThemeProvider (light/dark/system, no flash, synced across tabs)
- [x] App shell: desktop sidebar, tablet rail, mobile top bar + Sheet + bottom nav + FAB
- [x] React Router routes + layout + route error page + 404
- [x] `packages/shared`: zod schemas for Snippet, Collection, Settings, Backup envelope; tag normalization; ids
- [x] Dexie DB + repositories (validated writes, transactions) + `LibraryProvider` (one live query shared by the app)
- [x] ~~Sample data loader~~ (built on Day 1, removed in Day 1.5 at the reviewer's request)
- [x] `SnippetEditorDialog` (react-hook-form + zod, lazy CodeMirror, `TagInput`, language and collection selects, `Mod+S` save, discard guard)

**Also delivered on Day 1 (ahead of plan):** basic `SnippetCard`/`SnippetGrid`, tag filter via `?tags=`,
Collections page, Settings page (theme, default language, sample data), vendor chunk splitting,
and idle-time preloading of the lazy editor.

**Implementation notes**
- `next-themes` was replaced by a small custom `ThemeProvider` plus a tiny pre-paint script (no flash of the wrong theme in a Vite SPA). It was inline on Day 1 and moved to `public/theme-init.js` on Day 3 for the CSP.
- IndexedDB can't index `null` or booleans, so `deletedAt`/`isFavorite` are filtered in memory. The whole library is loaded once by `LibraryProvider` anyway (fuzzy search needs it in memory).
- `recordCopy` doesn't bump `updatedAt`, so usage stats never win a Phase 2 sync conflict against a real edit.
- Bundle (after Day 1.5): app chunk ~60 KB gzipped (includes the editor form, so it opens instantly) plus cacheable vendor chunks (React, data, UI). CodeMirror (~35 KB + grammars) and Motion's feature bundle (~32 KB) load lazily.

### Day 1.5 — Review feedback ✅
Feedback from the Day 1 review, and what changed. Items that were already part of the Day 2 plan
were deliberately left for Day 2 (see below).

| Feedback | Resolution |
|---|---|
| Editor opens late, interactions not smooth | Editor dialog moved into the main bundle; CodeMirror preloaded after first paint and on hover/focus, mounted one frame after the dialog (no layout jump). Dev: all lazy deps pre-bundled (`optimizeDeps.include`) so Vite never re-optimizes/reloads on first use. Removed full-screen backdrop blur. Cards/buttons transition only cheap properties; hover shadow fades on a pseudo-element. Skeletons appear only after 200 ms. |
| No subtle animations | Motion (`motion/react`, lazy features, `strict`, reduced-motion aware) with shared tokens in `lib/motion.ts`: staggered card entrance + reflow, sliding active indicator (sidebar, bottom nav, theme picker), page fade, tag chip pop, favorite pop, theme icon swap, FAB spring, 200 ms dialog zoom/slide, full drawer slide, shimmer skeletons. |
| Wasted space on large monitors | Removed the 1280 px cap; fluid `auto-fill` grids (1 col phone → 6 cols at 2560 px); larger padding on `2xl`. |
| Remove "load defaults" | Sample data removed completely (seed code deleted); new first-run welcome screen. |
| Components look basic | Consistent sizes in the base components (36 px, 40–44 px on touch via `pointer-coarse`); two-column desktop editor (large code area + details panel); favorite switch; sidebar shows top 8 tags + "Show all"; richer empty states. |
| (found during review) | `=>`/`<=` were rendered as ligatures (⇒/≤) — disabled so code shows exactly what is copied; welcome screen lacked an `h1`; legacy grammars (Shell/PowerShell) now coloured. |

Also added: **Settings → Danger zone → Delete all data** (type `DELETE` to confirm), pulled forward from Day 3.

Measured click → next paint (Event Timing API, production build): open editor 40–80 ms, close 24–32 ms,
navigation 24–32 ms. Dev mode was 520–650 ms for the first open before the fix.

### Day 2 — Core features ✅
- [x] `SnippetCard` + `SnippetGrid`: syntax-highlighted, fading preview (shares the editor's grammars and colours)
- [x] **Card quick actions** (review feedback): **Copy** button and **favorite** star on the card, plus `⋯` menu
- [x] Snippet detail view — **clicking a card opens it** (right-side panel; full screen on phones), URL-driven (`?snippet=`) so Back closes it
- [x] `CopyButton` + shared snippet actions (clipboard fallback incl. inside dialogs, check-mark animation, toast, copy stats)
- [x] Actions menu: open, edit, copy, favorite, duplicate, move to collection (incl. "New collection…"), download as file, delete with Undo
- [x] Search (Fuse.js) + filter bar (language, tags, collection, favorites) + sort, all synced to the URL; active-filter chips; match highlighting
- [x] **Collections CRUD with obvious entry points** (review feedback): "+" in the sidebar (and "Create your first collection"), "New collection" on the Collections page, "+ New collection…" in the editor's Collection select and in Move-to-collection; edit (name, colour, emoji) / delete with Undo via `⋯`
- [x] Command palette (`Mod+K`), keyboard shortcuts (global + focused card + grid arrow keys), `?` cheat sheet, `N` hints restored

**Implementation notes (Day 2)**
- **Search quality:** every word must match (AND). Words of 3 characters or fewer match exactly
  (a typo in "git" is a 33% error — fuzzy matching short words only added noise); longer words
  match fuzzily ("comit" → commit). Content is searched up to 1,500 characters per snippet.
- **Palette ranking:** a command or collection whose name you are typing ranks above fuzzy snippet
  hits ("settings" → Open Settings); "New snippet titled …" is always last.
- **Large libraries:** the grid renders 48 cards at a time and adds more just before you scroll to the
  end. Grid animations avoid Motion's layout projection, which profiling showed was the main cost
  while typing. Measured with 600 snippets (production build): worst keystroke 1,152 ms → **40 ms**.
- **No re-render storms:** card actions read the URL at call time instead of subscribing to it, so
  typing in the search box doesn't re-render every card.
- **Toasts** moved to bottom-left on desktop so they never cover the detail panel's buttons.
- `react-hotkeys-hook` and `prism-react-renderer` from the plan were not needed (see the tech-stack table).

### Day 3 — Polish and ship ✅
- [x] Export / Import (preview, merge/replace, error handling) in Settings, plus the command palette,
      collection menu (export one collection), welcome screen and drag & drop anywhere
- [x] PWA: manifest (with app shortcuts), generated icons, offline precache, update prompt, install card
- [x] Storage persistence + backup reminder
- [x] Empty, no-results, offline (badge) and loading states (plus a boot splash before the JS loads)
- [x] Accessibility pass (keyboard only, screen reader labels, contrast) in both themes: axe reports 0 violations
- [x] Responsive QA at 360, 768, 1024 and 1440 px: no horizontal overflow anywhere
- [ ] ~~Unit and component tests for logic-heavy code~~ (skipped at the project owner's request)
- [x] `netlify.toml` and Lighthouse check
- [x] First deploy (by the project owner, 2026-10-31): **live at
      [simply-snipit.netlify.app](https://simply-snipit.netlify.app/)**. Confirmed on the live site:
      deep links load (SPA fallback), the CSP and security headers are sent, and the manifest is served.
- [x] Root README: screenshots, features, shortcuts, tech stack, deploy steps, live link

**Implementation notes (Day 3)**
- **Backup format:** `{ app: "snipit", version: 1, exportedAt, collections, snippets }`. Only active
  records are exported. Import refuses files over 25 MB, non-JSON, non-SnipIt and newer-version
  files with clear messages. Each record is validated on its own: damaged ones are counted and
  skipped, and duplicate ids are de-duplicated.
- **Merge rules** (`import-plan.ts`, a pure function used by both the preview and the import):
  - the newer `updatedAt` wins; copy stats take the maximum;
  - a snippet deleted locally is restored by importing it;
  - a collection with the same name (case-insensitive) merges into the existing one, and its
    snippets are re-pointed to it;
  - references to missing collections are cleared.

  **Replace** first downloads a safety backup automatically, then swaps everything in one
  transaction. The import re-plans inside the transaction, so edits made after the preview are
  never overwritten blindly.
- **PWA:** `registerType: 'prompt'` with an hourly update check. The first install shows a "ready to
  work offline" toast. Lazy chunks (editor, grammars, Settings) are precached, so everything works
  offline. Icons are generated from `public/logo.svg` by `@vite-pwa/assets-generator`. The manifest
  shortcut `/?new=1` opens the editor.
- **CSP:** the theme bootstrap moved from an inline script to `public/theme-init.js`, and zod runs
  `jitless`, so the policy needs neither `'unsafe-inline'` scripts nor `'unsafe-eval'`. The backup
  and PWA checks ran with this exact policy enforced.
- **Accessibility fixes:** darker light-theme `--muted-foreground` and `--destructive` (contrast ≥
  4.5:1 on tinted surfaces), card titles are `h2` (correct heading order), and card Copy buttons
  are named "Copy <title>".
- **Responsive fixes:** the toolbar stacks search above the filters until `xl`, so the search field is
  never squeezed on tablets. The phone FAB hides while you scroll down, so it never covers a card's
  Copy button for long.
- **Start-up performance:**
  - `index.html` paints a boot splash with the first CSS.
  - IndexedDB opens in parallel with the first render.
  - Content on the first screen of a visit renders without entrance animations
    (`lib/initial-screen.ts`), so it doesn't wait for the lazy Motion features.
  - CodeMirror is preloaded only after the library has painted.
  - Settings and the import dialog are lazy chunks.
- **Build safety:** `vite.config.ts` resolves the app from its canonical on-disk path. On Windows, a
  terminal reporting `d:\` instead of `D:\` made Vite bundle React twice, and the production build
  showed a blank page ("Cannot read properties of null (reading 'useCallback')").
  `vite-plugins/bundle-guard.ts` now fails the build on duplicate (case-variant) modules or chunk
  import cycles.
- **Verified** on the production build in Edge, by scripted checks (not committed): backup/restore
  (20 checks, CSP enforced), PWA/offline (13), axe in both themes, responsive layouts, and the Day 2
  and Day 1.5 regression suites. No console errors.

### Phase 1.5 — Stretch (optional)
Split into two days so each can be reviewed and deployed on its own.

**Day 4 — Trash, templates, sharing ✅**
- [x] Trash view (restore / delete forever / empty, auto-purge after 30 days)
- [x] Template variables `{{name}}` with a fill-in form before copy
- [x] Share snippet via URL (lz-string)

**Day 5 — large-library tools ✅**
- [x] Bulk select actions (library views and Trash)
- [x] Grid/list toggle
- [x] dnd-kit collection ordering (plus Move up / Move down)

**Implementation notes (Day 4)**
- **No schema or backup-format change.** The Dexie schema stays at version 1 and backups at
  `version: 1`; everything uses the existing `deletedAt` field and snippet content.
- **Trash:**
  - `/trash` (lazy route) lists deleted snippets, newest first. Each row shows when it was
    deleted and when it will be removed; rows with 3 days or less left are highlighted.
  - It is in the sidebar (with a count), the tablet rail, the phone drawer, the command palette
    and `G` then `T`. Bottom navigation is unchanged (four items).
  - **Restore** has an "Open" action. **Delete forever** and **Empty trash** ask first, because
    they can't be undone (focus starts on Cancel).
  - Deleting still shows Undo; the message now says "Moved … to the Trash".
  - `purgeExpiredTrash()` runs 3 s after start and permanently removes snippets deleted more
    than `TRASH_RETENTION_DAYS` (30, in `packages/shared`) ago, plus collection tombstones of the
    same age.
  - `LibraryProvider` still reads the table once and splits it into the library and the Trash.
  - The welcome screen links to the Trash when every snippet has been deleted.
- **Fixes found while building the Trash:**
  - `restore()` now checks the snippet's collection still exists; if not, the snippet comes back
    unsorted (with a message) instead of pointing at a deleted collection.
  - Deleting a collection only unsorts its *active* snippets. Snippets already in the Trash keep
    their collection, so Undo on the collection delete followed by a restore puts them back
    where they were.
- **Template variables** (`packages/shared/src/template.ts`, so Phase 2 can reuse them):
  - Syntax `{{name}}`, `{{ name }}` and `{{name=default}}`. Names are letters, digits and `_`
    (up to 40 characters, 30 distinct per snippet).
  - Detected automatically. To avoid false matches in code, these are ignored: dotted
    expressions (`{{ .Values.x }}` in Helm, `{{ user.name }}` in Jinja), `${{ github.ref }}`
    (GitHub Actions) and `{{{raw}}}` (Handlebars).
  - Every copy path (card button, `C`, ⋯ menu, detail panel, command palette, share page) opens
    the fill-in form for a template. The form has one field per variable, a live preview of the
    exact text, Enter / `Mod+Enter` to copy, and **Copy as-is** for literal braces. Empty fields
    use their default or are left blank.
  - The last values are remembered per snippet on this device (`localStorage`, 100 snippets
    max); **Delete all data** clears them.
  - Cards show a "Template" badge. The editor lists the detected variables under the content,
    or shows a tip on how to add one.
  - The form is a lazy chunk, preloaded only when the library contains a template.
- **Share by URL:**
  - A link is `/share#v1.<lz-string>`. The snippet lives in the URL fragment, which browsers
    never send to a server, so nothing is uploaded.
  - It carries only title, content, description, language and tags (no id, stats or collection).
  - Shared from the ⋯ menu and the detail panel. On touch devices it opens the system share
    sheet, otherwise it copies the link. Links over 8,000 characters get a "some apps may cut it
    off" warning.
  - `/share` (lazy) decodes in the browser, validates with zod and renders as plain text.
    Damaged, incomplete, non-SnipIt and newer-format links get a friendly error.
  - **Save to my library** opens the normal editor pre-filled, then shows the saved snippet. If
    the same snippet already exists, the button reads "In your library" instead.
  - `lz-string` (MIT, 1.4 KB gzip) loads only when sharing. Opening the ⋯ menu or hovering the
    share button warms it, so the clipboard write stays inside the click's user activation.
- **Accessibility fix:** dark-theme `--destructive` is a little lighter. The `destructive` button
  variant (red text on a red tint) was below 4.5:1 in dark-mode confirmation dialogs, which
  Day 3's audit hadn't opened.
- **Bundle:** initial JS +5.3 KB gzip (302.8 → 308.1 KB). Trash (2.1 KB), share page (2.0 KB),
  fill-in form (1.8 KB) and lz-string (1.4 KB) are lazy chunks, precached for offline use.
- **Verified** on the production build in Edge, by scripted checks with the production CSP
  enforced (not committed):
  - 70 Day 4 checks covering templates, Trash, purge, sharing, hostile link content, and offline
    share and Trash.
  - axe: 0 violations on every new page and dialog, light and dark, 1440 and 360 px, with no
    horizontal overflow.
  - Day 2 and Day 3 regression suites pass (the Day 2 suite updated only for the new delete
    message). No console errors.

**Implementation notes (Day 5)**

Decisions agreed before building: the selection is **kept** while searching and filtering;
collections are reordered **on the Collections page only**; **grid** is the default view on every
device. Still no schema or backup-format change (Dexie version 1, backups `version: 1`).

- **Selecting snippets:**
  - Ways in: the **Select** button (page header), Ctrl/⌘-click or Shift-click a card, `X` on the
    focused card, or **press and hold** (450 ms) on a touch screen. In selection mode a click
    or tap selects instead of opening.
  - Shift-click selects a range in display order. `Mod+A` selects everything the current
    search and filters list, not only the cards rendered so far. `Esc` or ✕ exits.
  - With a mouse, a round tick appears on a card's corner on hover. On touch screens it
    appears in selection mode only.
  - The selection survives search and filter changes. The bar says how many selected snippets
    are hidden (for example "2 hidden by filters"). It is cleared when you change page.
  - The state is a small external store: each card subscribes to its own "selected" flag, so
    selecting one card re-renders that card and the bar, not the grid.
- **The action bar** floats centred over the content: above the bottom navigation on phones,
  clear of the sidebar or rail on larger screens.
  - Actions: **Move** (incl. "New collection…"), **Tags** (add to all, remove from all),
    **Favorite/Unfavorite**, **Export** (an importable file with the snippets' collections) and
    **Delete**.
  - Phones show Move, Tags and Delete. Favorite, Export and Select all are in a "More" menu, so
    the bar fits 360 px.
  - On phones, toasts are lifted above the bar while it is shown (`--toast-lift`), so an Undo
    toast never covers it.
- **Bulk writes** (`snippetRepository.bulkUpdate`, `revertBulkUpdate`, `softDeleteMany`,
  `restoreMany`, `deleteForeverMany`):
  - Each is one transaction, so a batch is all or nothing.
  - Snippets the change doesn't alter are **not written**, so their `updatedAt` (which decides
    Phase 2 sync conflicts) is untouched. A change that alters nothing says "Nothing to change".
  - Undo puts back exactly the fields that changed. If a collection was deleted in the
    meantime, those snippets come back unsorted.
  - Adding tags respects the 20-tag limit. The toast says how many snippets couldn't take every
    tag.
  - Delete moves to the Trash with one Undo for the batch. In the Trash, **Restore** and
    **Delete forever** (confirmed) work on a selection.
- **Grid/list toggle:**
  - The switch is in the page header; `V` and the command palette also toggle it. It is
    remembered per device (`localStorage`) and synced across tabs.
  - List rows show the title, a one-line preview, collection, tags, meta, ⋯ and Copy. The same
    shortcuts, selection and arrow-key navigation work as on cards (↑/↓ move one row).
- **Collection ordering:**
  - Drag a tile by its handle on the Collections page, with mouse, touch or keyboard (Space to
    pick up, arrows, Space to drop, Esc to cancel). Screen-reader announcements name the
    collection and its position.
  - Every ⋯ menu (sidebar, collection page, tiles) also has **Move up / Move down**.
  - `collectionRepository.reorder()` rewrites only the positions that changed (with
    `updatedAt`, so the order syncs in Phase 2). Each move has an Undo.
  - The new order shows everywhere: sidebar, rail, drawer, pickers and filters.
- **Bundle:** startup JS +0.8 KB gzip (app chunk 84.2 → 85.0 KB).
  - The Collections page became a lazy route, and dnd-kit (MIT) loads only with it (16.4 KB
    gzip chunk).
  - The bulk bar (2.8 KB) and the shared bar pieces (1.4 KB) are lazy too. They are warmed
    after the library has painted (`lib/after-paint.ts`, now shared with the editor preload).
  - Everything is precached for offline use.
- **Fixes found while verifying:**
  - **CSP:** every start-up logged a `script-src` (eval) violation. This was already true before
    Day 5. zod probes `new Function` when the first schema is built, and that happened before
    `z.config({ jitless: true })` ran: ES modules evaluate their imports first, and the bundler
    runs shared chunks before `main`.
    - The setting moved to `src/zod-config.ts`, which is `main.tsx`'s first import and is
      bundled into zod's own chunk (`vite.config.ts`). Start-up is now free of violations.
  - **Phone layout:** a list row with a long one-line preview was wider than the screen. Grid
    items now use `minmax(0, 1fr)` tracks, so text truncates instead. The same fix applies to
    collection tiles with long names.
  - **Toasts:** between 600 and 767 px, toasts sat on the bottom navigation. Their offset is now
    one CSS variable (`--toast-bottom`) for every width.
- **Verified** on the production build in Edge, by scripted checks with the production CSP
  enforced (not committed):
  - 98 Day 5 checks: every way in and out of selection, the selection kept while searching,
    each bulk action verified in IndexedDB together with its Undo, no-op writes, the tag limit,
    the export file, Trash bulk restore and delete, keyboard, mouse and menu reordering
    (incl. the screen-reader announcement), grid/list persistence, long press on a 360 px
    phone, and the bar's and toasts' placement.
  - axe: 0 violations, light and dark, desktop and phone.
  - No horizontal overflow at 1440, 1280, 1024, 768, 390 and 360 px. No console errors and
    no CSP violations.

### Phase 1 definition of done
The app is deployed on Netlify, is installable, works offline, every MVP feature (F1–F12) works on mobile
and desktop in both themes, tests pass, lint is clean and Lighthouse is ≥ 95.

**Status (2026-10-31):**
- Met: deployed, installable, works offline, F1–F12 on mobile and desktop in both themes, and
  type-check, lint and formatting are clean.
- Not met:
  - **Tests:** none, because they were skipped at the project owner's request.
  - **Lighthouse:** mobile Performance is 76–78 (desktop is 98).
  - **Initial JS:** ~315 KB gzip, against the ~200 KB target.

  See §10 for why mobile Performance is below target and what could still be done.
