# Job Tracker

A personal job-search tracker: know every application, understand what happened, and know what to do next.

"Job Tracker" is a working name.

**Status:** early development. The foundation (Phase 0) is in place, but there are no product features yet. The web app shows a temporary system-status page.

## Tech stack

- **Workspace:** pnpm workspaces, TypeScript everywhere
- **API** (`apps/api`): Node.js 24, Fastify, Prisma 7, PostgreSQL 18
- **Web app** (`apps/web`): React 19, Vite, React Router, TanStack Query, Tailwind CSS 4, shadcn/ui
- **Shared** (`packages/shared`): Zod schemas used by both apps, so they agree on the shape of every API answer
- **Tests:** Vitest; React Testing Library and MSW for the web app
- **Local services:** Docker Compose (PostgreSQL, Mailpit)

## Prerequisites

- [Node.js 24](https://nodejs.org/) (the version is in `.nvmrc`)
- [pnpm 12](https://pnpm.io/): `npm install -g pnpm@12`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), or another Docker engine with Compose v2
- Git

Using VS Code? It will offer the recommended extensions (ESLint, Prettier, EditorConfig) from `.vscode/extensions.json`.

## Getting started

```sh
pnpm install           # installs everything and generates the Prisma client
cp .env.example .env   # local settings (works in PowerShell and Git Bash)
pnpm docker:up         # starts PostgreSQL and Mailpit, waits until they are healthy
pnpm dev               # starts the API and the web app
```

Open http://localhost:5173. The status page should show the API as **Running** and the database as **Ready**. If something is down, the page says what to start.

Stop the apps with Ctrl+C. `pnpm docker:down` stops the containers and keeps your data.

Day to day: start Docker Desktop, then `pnpm docker:up` (the containers don't always come back on their own) and `pnpm dev`.

## Local services

| Service    | Address               | Notes                                                                                        |
| ---------- | --------------------- | -------------------------------------------------------------------------------------------- |
| Web app    | http://localhost:5173 | Vite dev server. Forwards `/api`, `/health` and `/ready` to the API                          |
| API        | http://127.0.0.1:4000 | `GET /health`: the API is up. `GET /ready`: the database answers                             |
| PostgreSQL | `localhost:5433`      | Databases `jbt_dev` (development) and `jbt_test` (automated tests). User and password: `jbt` |
| Mailpit    | http://localhost:8025 | Catches every email sent during development (SMTP on port 1025)                              |

PostgreSQL uses port 5433, not the usual 5432, so it doesn't clash with a PostgreSQL you may already have installed. All ports are reachable only from your own computer.

## Environment variables

Settings live in `.env` at the repo root, which git ignores. `.env.example` lists every variable with an explanation. Copy it and change values only if you need to.

The API checks its settings at startup. If one is missing or invalid, it refuses to start and lists every problem. `DATABASE_URL` is the only one without a default. The API tests also need `TEST_DATABASE_URL`.

`.env.example` is committed, so never put real secrets in it.

## Scripts

Run these from the repo root.

| Command                             | What it does                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`                          | Starts the API (restarts on every change) and the web app                       |
| `pnpm check`                        | Typecheck, lint, format check and tests. Run it before every commit             |
| `pnpm test`                         | Runs all tests (the API tests need `pnpm docker:up`)                            |
| `pnpm typecheck`                    | Checks TypeScript in every package                                              |
| `pnpm lint`                         | Runs ESLint                                                                     |
| `pnpm format` / `pnpm format:check` | Formats with Prettier / only checks the formatting                              |
| `pnpm docker:up`                    | Starts PostgreSQL and Mailpit and waits until they are healthy                  |
| `pnpm docker:down`                  | Stops them. Your data is kept                                                   |
| `pnpm docker:reset`                 | **Deletes all local data**, then starts fresh containers                        |
| `pnpm db:generate`                  | Regenerates the Prisma client after a change to `apps/api/prisma/schema.prisma` |
| `pnpm db:migrate`                   | Creates and applies database migrations (development only)                      |
| `pnpm db:status`                    | Shows which migrations are applied                                              |
| `pnpm db:studio`                    | Opens Prisma Studio to browse the data                                          |

There are no migrations yet, so `pnpm db:status` ends with an error for now. That is expected.

## Tests

Tests sit next to the code they test (`*.test.ts`, `*.test.tsx`) and run with Vitest.

- **Web app and shared tests** need nothing else running. The web tests fake the API at the network level with MSW.
- **API tests** use the real `jbt_test` database, so run `pnpm docker:up` first. They never touch `jbt_dev`.

To run one package's tests: `pnpm --filter @jbt/web test` (or `@jbt/api`, `@jbt/shared`).

## Project layout

```text
apps/
  api/        Fastify API (src/) and the Prisma schema (prisma/)
  web/        React web app (src/)
packages/
  shared/     Zod schemas and types used by both apps
docker/       Files used by the containers (e.g. the script that creates jbt_test)
docs/         Product, architecture and design documents
```

## Troubleshooting

**The API won't start: "Invalid environment configuration".** `.env` is missing or has a bad value. Copy `.env.example` to `.env`. The message lists each problem.

**The status page says the database is not reachable.** Docker isn't running, or the containers aren't up. Start Docker, then run `pnpm docker:up`.

**Docker just started and things fail.** Right after Docker Desktop starts, image downloads can fail with "server gave HTTP response to HTTPS client", or containers can start without their ports published (`docker compose ps` shows `5432/tcp` instead of `127.0.0.1:5433->5432/tcp`). Wait a moment, run `docker compose down`, then `pnpm docker:up`.

**The API test "reports ready when Postgres answers" fails with `expected 503 to be 200`.** The tests can't reach the `jbt_test` database. Is Docker running (`pnpm docker:up`)? If it is, `jbt_test` may be missing: it is created only when the PostgreSQL data volume is first created. Create it without losing any data:

```sh
docker compose exec postgres psql -U jbt -d jbt_dev -c "CREATE DATABASE jbt_test"
```

**`Cannot find module '../../generated/prisma/client'`.** The Prisma client is generated during `pnpm install`, and something skipped or removed it. Run `pnpm db:generate`.

**A port is already in use.** The web app always uses 5173, so stop whatever else is using it. The API port (`PORT`) and the PostgreSQL port (`POSTGRES_PORT`) can be changed in `.env`. If you change `POSTGRES_PORT`, change the port in `DATABASE_URL` and `TEST_DATABASE_URL` too.

## Further reading

- [`docs/`](docs/): product discovery, PRD, UX flows, architecture, API and database design, decision records (ADRs), and the Harbor Slate visual direction
- [`CLAUDE.md`](CLAUDE.md): working agreements, current state and settled decisions. Where it disagrees with `docs/`, it wins
