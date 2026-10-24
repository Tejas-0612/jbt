# Job Tracker

[![CI](https://github.com/Tejas-0612/jbt/actions/workflows/ci.yml/badge.svg)](https://github.com/Tejas-0612/jbt/actions/workflows/ci.yml)

A personal job-search tracker: know every application, understand what happened, and know what to do next.

"Job Tracker" is a working name.

**Status:** early development. The first feature works end to end: add an application and see it on its own page. There is no list of applications yet. You sign in with Google, or in development as a sample user (see [`CLAUDE.md`](CLAUDE.md)).

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
pnpm db:migrate        # creates the tables in jbt_dev
pnpm db:seed           # optional: adds the two sample users (signing in as one creates it too)
pnpm dev               # starts the API and the web app
```

Open http://localhost:5173 and sign in: **Sign in as Sample User A** (development only), or **Continue with Google** once it's set up (see below). Then click **Add application**. To check the API and database directly: http://localhost:5173/ready should answer `{"data":{"status":"ready"}}`.

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

### Sign in with Google (optional in development)

Without Google settings, everything else still works: in development the sign-in page offers **Sign in as Sample User A / B** (`POST /api/v1/auth/dev-login`, which doesn't exist in production). To use your real Google account, create a free OAuth client once:

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project (for example "Job Tracker dev").
2. Open **Google Auth Platform** and click **Get started**. Enter an app name and your email, choose **External** as the audience, and finish.
3. Under **Audience**, leave the app in **Testing** and add your Google account under **Test users**. While testing, only listed test users can sign in.
4. Under **Clients**, click **Create client**. Choose **Web application**, and add this **Authorized redirect URI**, exactly:
   `http://localhost:5173/api/v1/auth/google/callback`
5. Copy the client ID and the client secret into your `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Copy the secret right away: Google may not show it again.
6. Restart `pnpm dev`.

The app asks Google only for your name and email (`openid email profile`). It never stores Google's tokens.

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
| `pnpm db:migrate`                   | Regenerates the client, then creates and applies migrations to `jbt_dev`        |
| `pnpm db:seed`                      | Adds (or updates) the two sample users in `jbt_dev`. Refuses in production      |
| `pnpm db:status`                    | Shows which migrations are applied                                              |
| `pnpm db:studio`                    | Opens Prisma Studio to browse the data                                          |

After changing `schema.prisma`, run `pnpm db:migrate` and commit the new folder it creates in `apps/api/prisma/migrations/`. Prisma 7 doesn't seed automatically, so run `pnpm db:seed` after resetting the database.

## Tests

Tests sit next to the code they test (`*.test.ts`, `*.test.tsx`) and run with Vitest.

- **Web app and shared tests** need nothing else running. The web tests fake the API at the network level with MSW.
- **API tests** use the real `jbt_test` database, so run `pnpm docker:up` first. They never touch `jbt_dev`. Before they start, they apply any missing migrations to `jbt_test` themselves. They empty its tables between tests, so the test files run one at a time.

To run one package's tests: `pnpm --filter @jbt/web test` (or `@jbt/api`, `@jbt/shared`).

**CI:** on every push to `main` and every pull request, GitHub Actions follows "Getting started" on a fresh Linux machine, then runs the same checks as `pnpm check` and builds the web app. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Project layout

```text
apps/
  api/        Fastify API (src/) and the Prisma schema, migrations and seed (prisma/)
  web/        React web app (src/)
packages/
  shared/     Zod schemas and types used by both apps
docker/       Files used by the containers (e.g. the script that creates jbt_test)
docs/         Product, architecture and design documents
```

## Troubleshooting

**The API won't start: "Invalid environment configuration".** `.env` is missing or has a bad value. Copy `.env.example` to `.env`. The message lists each problem.

**Saving an application says "Couldn't reach the server", or `/ready` answers `NOT_READY`.** If `/ready` doesn't answer at all, the API isn't running: start it with `pnpm dev`. If it says `NOT_READY`, Docker isn't running or the containers aren't up: start Docker, then run `pnpm docker:up`.

**The API answers 401 "You are not signed in."** Every `/api/v1` request needs a session cookie, except signing in and out. Sign in first. Your session ends after 30 days without use, or when you sign out.

**The API answers 403 "This request did not come from the app".** A POST, PATCH or DELETE must carry an `Origin` header equal to `WEB_ORIGIN`. Browsers add it themselves; with curl, add `-H "Origin: http://localhost:5173"`. If the web app itself gets this, check `WEB_ORIGIN` in `.env`.

**Google says "redirect_uri_mismatch".** The redirect URI in Google Cloud Console must be exactly `http://localhost:5173/api/v1/auth/google/callback` (http, port 5173, no trailing slash), and `WEB_ORIGIN` must be `http://localhost:5173`.

**Google says "Access blocked" or the app "has not completed the Google verification process".** Your account isn't a test user: add it under Google Auth Platform → Audience → Test users.

**Docker just started and things fail.** Right after Docker Desktop starts, image downloads can fail with "server gave HTTP response to HTTPS client", or containers can start without their ports published (`docker compose ps` shows `5432/tcp` instead of `127.0.0.1:5433->5432/tcp`). Wait a moment, run `docker compose down`, then `pnpm docker:up`.

**The API tests stop with "Could not apply migrations to the test database".** They can't reach PostgreSQL. Start Docker, then run `pnpm docker:up`. (A missing `jbt_test` database is not a problem: the tests create it.)

**`Cannot find module '../../generated/prisma/client'`.** The Prisma client is generated during `pnpm install`, and something skipped or removed it. Run `pnpm db:generate`.

**Prisma says "Update available 7.10.1 -> 8.0.0-…".** Ignore it. The project pins Prisma 7 on purpose.

**A port is already in use.** The web app always uses 5173, so stop whatever else is using it. The API port (`PORT`) and the PostgreSQL port (`POSTGRES_PORT`) can be changed in `.env`. If you change `POSTGRES_PORT`, change the port in `DATABASE_URL` and `TEST_DATABASE_URL` too.

## Further reading

- [`docs/`](docs/): product discovery, PRD, UX flows, architecture, API and database design, decision records (ADRs), and the Harbor Slate visual direction
- [`CLAUDE.md`](CLAUDE.md): working agreements, current state and settled decisions. Where it disagrees with `docs/`, it wins
