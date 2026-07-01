# Contributing to Database DevTools

Thank you for your interest in contributing. This project is a pnpm monorepo; most changes touch one package under `packages/` or an app under `apps/`.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
pnpm install
pnpm build
```

## Development workflow

```bash
# Terminal 1 — Inspector hub (CLI)
pnpm dev:cli

# Terminal 2 — Browser UI
pnpm dev:web

# Terminal 3 — Expo example app
pnpm dev:example
```

## Before opening a PR

1. Run `pnpm typecheck`
2. Run `pnpm test`
3. Run `pnpm build`
4. Add a [changeset](https://github.com/changesets/changesets) if your change is user-facing (`pnpm changeset`)
5. Update docs when behavior or public API changes

## Branch naming

- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation only
- `chore/` — tooling, CI, dependencies

## Pull request guidelines

- Keep PRs focused; prefer several small PRs over one large diff
- Match existing code style and naming
- Add or update tests for behavior changes
- Describe **what** changed and **why** in the PR description

## Package layout

| Path | Published to npm |
|------|------------------|
| `packages/database-devtools` | `database-devtools` |
| `packages/sqlite` | `@database-devtools/sqlite` |
| `packages/inspector-sqlite` | `@database-devtools/inspector-sqlite` |
| `apps/web`, `apps/example` | No (demos) |

## Adding a database adapter

See [docs/architecture.md](./docs/architecture.md#multi-database-adapters). New engines should add an adapter package and (optionally) an inspector package without modifying core protocol code.

## Questions

Open a [GitHub Discussion](https://github.com/yellowbooking/database-devtools/discussions) or an issue if you are unsure about approach before large changes.
