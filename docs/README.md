# SnipIt — Project Plan

> A fast, beautiful, local-first PWA for saving, searching and one-click copying reusable text:
> shell commands, SQL queries, code, email templates and canned messages.

| Document | What's inside |
|---|---|
| [README.md](README.md) (this file) | Vision, decisions, tech stack, roadmap, conventions |
| [phase-1-frontend.md](phase-1-frontend.md) | Local-first PWA: UI/UX, data model, features, shortcuts, tasks, deploy |
| [phase-2-backend.md](phase-2-backend.md) | Node + Express + Prisma + PostgreSQL: auth, REST API, sync, hosting |

---

## 1. Problem & vision

Developers and office workers keep re-typing or hunting for the same commands, queries, email
templates and messages. SnipIt keeps them in one place so that **finding and copying any snippet
takes under 2 seconds**: `Ctrl+K` → type a few letters → `Enter` → it's on the clipboard.

### Goals
- **Fast:** instant fuzzy search and one-click copy, with keyboard shortcuts for everything.
- **Beautiful:** modern, clean and calm, with light and dark themes.
- **Works everywhere:** comfortable on a 360 px phone and a 1440 px desktop; installable; works offline.
- **Your data is safe:** stored locally, with JSON backup/restore, plus optional cloud sync in Phase 2.
- **Showcase quality:** reusable components, typed end to end, tested, accessible.

### Non-goals (for now)
- Team sharing and permissions, real-time collaboration, browser extension, AI features.

---

## 2. Decisions (agreed)

| # | Decision | Choice | Why |
|---|---|---|---|
| D1 | Build order | **Phase 1: local-first PWA** → **Phase 2: backend + sync** | Phase 1 is a complete, deployable app; Phase 2 adds accounts and sync without a UI rewrite |
| D2 | Frontend hosting | **Netlify** (free) | Easy SPA routing, deploy previews per PR, and it can **proxy `/api`** to the backend in Phase 2 (same origin, so no CORS or cookie issues) |
| D3 | Local storage | **IndexedDB via Dexie.js** | More space than localStorage, indexed queries, live UI updates |
| D4 | Content focus | **Both code and plain text** | Language `plaintext`/`markdown` for emails and messages; syntax highlighting for code |
| D5 | Repo layout | **npm workspaces monorepo** (`apps/web`, `apps/api`, `packages/shared`) | One repo; zod schemas shared by frontend and backend |
| D6 | Accent colour | **Indigo** on a neutral zinc base | Calm and professional; easy to change later via CSS variables |
| D7 | Backend hosting (Phase 2) | **Render** (API, free) + **Neon** (PostgreSQL, free) | Both free tiers fit; the stack itself is fully open source and can be self-hosted |
| D8 | Lint / format | **oxlint** (from the Vite template) + **Prettier** | oxlint is a very fast, open-source (MIT) linter |

Only free, open-source libraries are used (MIT / Apache-2.0 / ISC / OFL licences).

---

## 3. Tech stack

### Frontend — `apps/web`
| Need | Library |
|---|---|
| Build / framework | Vite 8, React 19, TypeScript 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| UI components | shadcn/ui (Radix UI primitives, code copied into the repo) |
| Icons | lucide-react |
| Local database | Dexie.js + `dexie-react-hooks` (`useLiveQuery`) |
| Search | Fuse.js (fuzzy, typo-tolerant) |
| Command palette | cmdk (via the shadcn `Command` component) |
| Keyboard shortcuts | Small built-in handler + registry (`features/commands`), no library needed |
| Code editor | CodeMirror 6 (`@uiw/react-codemirror`), lazy-loaded; grammars loaded per language (`@codemirror/lang-*`, `legacy-modes`) |
| Animation | Motion (`motion/react`, MIT) with `LazyMotion` — features loaded lazily, honours reduced motion |
| Code preview highlighting | Same CodeMirror/Lezer grammars as the editor (one highlighter, identical colours), lazy-loaded |
| Forms / validation | react-hook-form + zod |
| Toasts | sonner |
| Routing | React Router |
| PWA | vite-plugin-pwa (Workbox) + `@vite-pwa/assets-generator` |
| Fonts | Inter + JetBrains Mono via `@fontsource-variable/*` (self-hosted, so they work offline) |
| Testing | Planned: Vitest, React Testing Library, `fake-indexeddb`, Playwright. Not added in Phase 1 at the project owner's request; each day was verified with scripted browser checks instead |
| Hosting | Netlify (`netlify.toml`: build, SPA fallback, security headers incl. a strict CSP, caching) |

### Backend — `apps/api` (Phase 2)
| Need | Library |
|---|---|
| Runtime / server | Node.js 22 LTS, Express 5 |
| ORM / DB | Prisma + PostgreSQL |
| Validation | zod (shared schemas from `packages/shared`) |
| Auth | bcryptjs, jsonwebtoken, cookie-parser (JWT in an httpOnly cookie) |
| Security | helmet, express-rate-limit |
| Dev tooling | tsx (run TS directly), tsup (build) |
| Testing | Vitest + Supertest against a test database |

---

## 4. Repository layout

```
SnipIt/
├─ apps/
│  ├─ web/                 # React PWA (Phase 1, complete)
│  └─ api/                 # Express + Prisma API (Phase 2)
├─ packages/
│  └─ shared/              # zod schemas + TS types shared by web and api
├─ docs/                   # ← you are here (screenshots/ for the README)
├─ netlify.toml            # build, SPA fallback, security headers, caching
├─ package.json            # npm workspaces root
├─ .editorconfig  .gitignore  .nvmrc
└─ README.md
```

---

## 5. Roadmap

| Phase | Scope | Estimate | Output |
|---|---|---|---|
| **1. Local-first PWA** | Full app in the browser (IndexedDB), offline, installable | ~3 days | Live on Netlify |
| **1.5. Stretch features** | Template variables, trash, bulk actions, share-by-URL | 1–3 days (optional) | Extra polish |
| **2. Backend + sync** | Accounts, REST API, PostgreSQL, multi-device sync | ~4–6 days | API on Render, DB on Neon |

Detailed task checklists are in each phase document. Tick them off (`- [x]`) as you go and commit
the docs together with the code.

---

## 6. Working conventions

- **Branches:** `main` is always deployable. Work on `feat/<thing>`, `fix/<thing>` or `docs/<thing>`, then open a PR.
  Netlify builds a deploy preview for each PR.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), for example
  `feat(snippets): add copy button`, `fix(search): ignore case in tags`, `docs: update plan`.
- **Code style:** Prettier formatting, oxlint clean, `strict` TypeScript, no `any` unless justified.
- **Components:** small and reusable. Shared UI goes in `components/`, feature code in `features/<name>/`.
- **Definition of done** (per feature): works on mobile and desktop, in light and dark themes, is keyboard
  accessible, has no console errors, and has tests for logic-heavy code.

## 7. Getting started

```bash
nvm use            # Node 22 (see .nvmrc); requires Node >= 22.12
npm install        # installs all workspaces
npm run dev        # starts the web app at http://localhost:5173
npm run build      # type-check + production build
npm run preview    # serve the production build (offline mode / install only work here)
npm run check      # type-check + oxlint + Prettier check
```
