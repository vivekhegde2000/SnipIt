# SnipIt

A fast, beautiful, local-first PWA for saving, searching and one-click copying reusable text:
shell commands, SQL queries, code, email templates and canned messages.

> 🚧 In development. See the [project plan](docs/README.md).

## Features (planned)
- Save snippets with titles, tags, language and collections
- Instant fuzzy search, filters and sorting
- One-click copy and a `Ctrl+K` command palette
- Keyboard shortcuts for everything
- JSON import/export backups
- Installable PWA that works offline, in light and dark themes, on mobile and desktop
- *(Phase 2)* Optional account with multi-device sync

## Tech stack
React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Dexie (IndexedDB) · Fuse.js · vite-plugin-pwa
*(Phase 2: Node.js · Express · Prisma · PostgreSQL)*

## Getting started
Requires **Node.js ≥ 22.12** (see `.nvmrc`).

```bash
npm install     # install all workspaces
npm run dev     # http://localhost:5173
npm run build   # type-check + production build
npm run lint    # oxlint
```

## Repository layout
```
apps/web        React PWA
apps/api        Express + Prisma API (Phase 2)
packages/shared Shared zod schemas & types
docs/           Project plan
```

## Documentation
- [Plan overview & decisions](docs/README.md)
- [Phase 1: Local-first PWA](docs/phase-1-frontend.md)
- [Phase 2: Backend & sync](docs/phase-2-backend.md)
