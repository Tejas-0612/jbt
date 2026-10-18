# CLAUDE.md — Job Application Tracker (JBT)

## What we're building
A candidate-first personal job-search tracker ("a personal operating system for a job search").
Core promise: **know every application, understand what happened, and know what to do next.**
The **Application** is the central object. Timeline, follow-ups, interviews and notes all hang off it.
Target: **real public users** (after the MVP proves itself; see "Before public launch").

State (2026-10-18): **Phase 0 in progress.** Steps 1–3 done and committed (step 3 = Docker: Postgres 18 on 5433 with `jbt_dev` + `jbt_test`, Mailpit on 1025/8025, `.env.example`). Next: step 4 (Fastify API), to be discussed with the user before building. Commands: `pnpm typecheck`, `pnpm lint`, `pnpm format` / `format:check`, `pnpm docker:up` / `docker:down` / `docker:reset` (reset wipes the DB). GitHub: the user's personal account `Tejas-0612`; a private repo is not created yet.

## How we work (agreed with the user)
- Build step by step in vertical slices (UI → API → service → DB → tests). One slice at a time, like a developer, not a vibe coder.
- **Discuss before changing files.** Propose, get agreement, then implement. Never edit `docs/` without explicit agreement.
- The user wants to understand the code, not just receive it. Explain the approach and edge cases before coding. Explain what changed and why after.
- Before each slice, answer the "Developer Thinking Rule" questions and fill the Feature Completion Template (Implementation plan §34–35).
- Don't create new planning docs for small features. The 17 docs + the design PDF are reference material, not a backlog.
- **This file overrides the docs where they conflict.**
- **This file is committed to git: never put secrets in it** (keys, passwords, connection strings, personal emails). Secrets go in `.env`, which is gitignored.
- **The user is new to Docker.** Every Docker-related change gets an in-depth explanation (concepts, what each line does, why it's needed, what can go wrong) before moving to the next step. Teach with real output from their machine.
- **Never commit on your own.** Make the changes, then show what changed (files + a short summary). The user reviews, may ask for changes, and says when to commit. Only then commit.
- **Commits must use the user's personal identity**, set repo-locally (`git config --local`). The global identity on this machine is their work account. Before any commit, check that `git config user.email` is the personal one, not `@finasyst.in`. On a new machine or clone, set the local identity before the first commit.

## Docs map (`docs/Job_Application_Tracker_*.md`)
| Need | Doc |
|---|---|
| Why / who / vision / MVP hypothesis | `Product_Discovery` |
| Features, user stories, MVP priority (§29), acceptance journey (§35) | `PRD` |
| Screens, layouts, empty/error states, form rules | `UX_User_Flows` |
| Modules, layering, request flows | `System_Architecture` |
| Decision records ADR-001…030 | `ADR_Technical_Decisions` |
| Entities, fields, indexes, deletion rules | `Database_Design` |
| Endpoints, envelopes, error codes | `API_Design` |
| OAuth, cookies, threat model | `Authentication_Security` |
| Reminders, worker, idempotency | `Notification_Background_Jobs` |
| Build order, slice template, milestones | `Implementation_Vertical_Slice_Plan` |
| Logging, testing, infra, CI/CD, perf, files, roadmap | the remaining docs (mostly "later") |
| Visual design: colours, type, components, layouts. **Draft direction, not final** (10 Oct 2026, by the user) | `docs/Harbor Slate — Visual Direction.md` (full text, read this) + `docs/mockups/` (`dashboard-light.png`, `dashboard-dark.png`, `palette.png`: the PDF's images, viewable with Read). The PDF itself can't be rendered on this machine |

## Design (Harbor Slate): settled 2026-10-18
The design describes the **full product**. Build only the MVP-scoped parts; the rest is in the "Later" list.
- **Use as-is:** colour tokens (light + dark), Figtree + Newsreader, Phosphor icons, radius/shadow/spacing scale, WCAG 2.2 AA rules.
- **MVP navigation:** sidebar with Dashboard, Applications, Agenda, Settings, and no bell. Mobile tabs: Home, Applications, Add, Agenda, More.
- **Dashboard order:** greeting → **Needs attention** (incl. "How did it go?" and "Follow up or mark as ghosted") → KPIs + pipeline → Coming up → Recent updates. Statistics never lead.
- **Response rate** = share of applications that moved past APPLIED to anything except GHOSTED/WITHDRAWN (a rejection counts as a response). Hide it until the user has about 10 applications.
- **Company avatar:** initials in a tinted square. No logo service (costs money / leaks company names).
- **Detail page:** tabs Overview (holds recruiter name/contact), Interviews, Notes. Right rail: Next steps + Timeline. **"Log update"** = change status + optional note + backdatable date + offer a follow-up.
- **New status colours** (chosen by Claude, delegated by the user):
  - GHOSTED = warm taupe `#725F4E` / dark `#AE9A88`. Badge contrast 4.79 / 5.04. Distinct from the cool Saved/Withdrawn greys.
  - ACCEPTED = **solid** badge: `#256A42` fill + white text (6.52:1) / dark `#5CC287` fill + `#121519` text (8.30:1), with a check icon. This is the one allowed strong-fill badge, because it appears at most once.
  - Rejected: "faded applied blue" for Ghosted. In dark mode it was nearly identical to the brand primary (ΔE ≈ 1).
- **Badge contrast fix (approved 2026-10-18):** at a 12% tint, 6 of 7 light-mode badges and 2 dark-mode badges fall below 4.5:1 (the doc's claim was checked against plain white). Use a badge-text variant per status: light saved `#5E6572`, applied `#1068A6`, screening `#007069`, offer `#207144`, rejected `#9B4E46`, withdrawn `#5F6670`; dark saved `#8F97A1`, withdrawn `#8D96A1`. Shifts are 1.5–4 ΔE (barely visible). Check script: scratchpad `colors.mjs` / `colors2.mjs` (re-create if gone).
- **Implementation:** sand goes in a custom `--highlight` token (shadcn's `--accent` means hover background). Fonts via Fontsource npm packages (self-hosted, no Google requests). Light and dark tokens from day one; polish dark mode near the end of the MVP. Empty states use icon + text (illustrations later). No separate component-spec doc; components live in code.
- **Mockups** are in `docs/mockups/` (full-product dashboard, light + dark, and the palette sheet). Decided from reviewing them (approved 2026-10-18):
  - Company-initial avatars in the mock use red, green, orange and purple tints, which breaks the design's own rule (red = errors, green = offer). Use a small set of muted slate-family tints that avoids the status hues.
  - When an application closes (ACCEPTED/REJECTED/WITHDRAWN/GHOSTED), offer to cancel its pending follow-ups. The mock shows a rejected Orchard Bank that still has an overdue follow-up.
  - The greeting sentence must be built from the same queries as the KPIs (the mock says "two interviews" next to a "3 interviews" card).
  - MVP dashboard: greeting → Needs attention (replaces the Follow-ups card; holds overdue/today follow-ups, "How did it go?" and stale prompts) → 4 KPIs → pipeline (5 active stages; a stage click filters Applications; no "Open board") → Coming up (interviews; no prep progress; "Calendar" → Agenda) + Recent updates. No chart, no weekly-goal card, no bell.
  - Top-bar search stays as a plain field that opens Applications filtered by the query (no ⌘K yet).
  - Follow-up row action says "Done", not "Mark sent" (not every follow-up is a message).

## Settled: foundations (from the docs/ADRs)
- Modular monolith. Node.js + TypeScript API, React + TypeScript + Tailwind web app.
- PostgreSQL is the source of truth. Prisma with committed migrations.
- REST under `/api/v1`. Envelopes: `{ data, meta }` and `{ error: { code, message, details } }`.
- Google OAuth only (no passwords).
- Ownership is enforced in the backend on every query (`WHERE id = ? AND userId = ?`). Never trust a client-sent userId.
- Status changes and their timeline entry are written in one transaction.
- Timestamps are stored in UTC and shown in the user's timezone.

## Settled: 2026-10-17 review decisions
**Product**
- Application statuses: `SAVED, APPLIED, SCREENING, INTERVIEWING, OFFER, ACCEPTED, REJECTED, WITHDRAWN, GHOSTED`.
- **Next action** = the application's earliest pending follow-up or upcoming interview.
- **Needs attention** (dashboard): follow-ups overdue or due today; interviews today/tomorrow; past interviews still `SCHEDULED` → "How did it go?"; active applications (APPLIED/SCREENING/INTERVIEWING) with no activity for 14 days and no pending follow-up → "Follow up or mark as ghosted".
- On create with status APPLIED: offer "Remind me to follow up in 7 days" (on by default). The user can change it to any custom date/time.
- Reminders: one daily digest email (user's local morning) plus an optional custom reminder time per follow-up. No in-app notification center in MVP.
- Store the pasted job description on the application.
- MVP navigation: Dashboard, Applications, Agenda (Overdue / Today / This week), Settings.
- CSV import comes right after the core slices.

**Data model**
- No `Role` table. Role fields live on `Application`. `Company` is required, found or created by name (per user) inside `POST /applications`.
- `userId` on every user-owned table, with cascade delete from `User` (makes account deletion and export cheap later).
- `appliedOn` and follow-up `dueDate` are DATE. Follow-up `remindAt` is an optional timestamp. Interview `scheduledAt` is a timestamp.
- `User.timezone` (IANA, read from the browser at first login) and `User.googleSub` (unique; identify users by it, not email).
- Status history: `Activity` has `fromStatus`/`toStatus` columns. `occurredAt` can be backdated. A status change is exactly one `STATUS_CHANGED` activity.
- Timeline = things that happened (dated). Notes = editable context. No `NOTE_ADDED` timeline events.
- Interview statuses: `SCHEDULED, COMPLETED, CANCELLED`. Rescheduling changes `scheduledAt` and logs an activity.
- Application `workMode`: `REMOTE, HYBRID, ONSITE` (optional; the design filters on it).

**Architecture**
- No Redis or job queue in MVP. The worker is a second start script in `apps/api` that polls Postgres every few minutes (digest + custom reminders, each marked as sent so they never repeat).
- Auth: plain HttpOnly session cookie backed by the `sessions` table. No JWT/refresh tokens. (User answered "no" to tokens; confirm if unsure.) CSRF: SameSite=Lax + `Origin` check on mutations.
- Web and API run on the same site (one custom domain, or `/api` proxied through the frontend host).
- Repo: pnpm workspace with `apps/web`, `apps/api`, `packages/shared` (Zod schemas used by both). No Turborepo or staging environment yet.
- Dev/test-only login: "Log in as…" a seeded sample user (at least two, so we can test that A can't see B's data). Disabled in production.
- Build order: Create Application first with a stub signed-in user, then real Google login.

**API conventions**
- Pagination `page`/`pageSize`. Another user's resource → 404 (no `APPLICATION_ACCESS_DENIED`). Validation errors → 400 `VALIDATION_ERROR`.
- Status changes go through `PATCH /applications/:id/status` only (not the general PATCH).
- Object storage is removed from the production checklists (file uploads are deferred).

## Later: part of the project, NOT the MVP
Cut from the MVP only, not from the project. Revisit after the core works.
- Connections/contacts (many-to-many). The MVP keeps the recruiter's name/contact on the application.
- Separate Follow-ups and Interviews pages (the MVP has the one Agenda page).
- In-app notification center.
- Redis + job queue: exact-time reminders at scale, retries/backoff, rate limiting across instances, caching.
- Token-based auth, when the browser extension or mobile app arrives.
- Staging environment, Turborepo, shared UI package.
- From the docs: AI, browser extension, native mobile, file uploads, analytics beyond basics, email/calendar integrations.
- From the design: board (kanban) view, ⌘K palette + J/K shortcuts, saved views, bulk select, column chooser, density toggle, company logos, interview prep checklist, Contacts/Files tabs, Companies/Contacts/Notes/Insights pages, notification bell, sidebar weekly-goal card ("7 of 10 applications sent"; needs a goals feature), KPI trend lines like "Above your 30-day average", empty-state illustrations, weekly applications/responses chart.

## Before public launch (not needed for the MVP)
- Privacy policy + terms (what we store, which third parties process it, retention, how to delete). Check India DPDP Act / GDPR.
- Publish the Google OAuth consent screen (app name, support email, privacy-policy link, domain). Testing mode allows only listed test users.
- Account deletion in Settings (cascade from `User`, end all sessions).
- Data export (JSON/CSV, same columns as CSV import).
- Email sending domain set up (SPF/DKIM/DMARC) and an unsubscribe link in digests.
- Privacy-friendly product analytics (activation, weekly use), never capturing note contents.
- Tested backups, error monitoring, rate limiting, a support contact.
- A product name ("Job Tracker" is a placeholder wordmark), chosen before buying the domain.

## Tooling (settled 2026-10-17)
| Area | Choice |
|---|---|
| Runtime / packages | Node.js 24 LTS, pnpm 12 workspaces (`apps/*`, `packages/*`). Shared versions live in the `catalog:` in `pnpm-workspace.yaml` |
| TypeScript | **6.0.x** (`~6.0.3` in the catalog). TS 7 (native) is out, but typescript-eslint supports only `<6.1`; revisit when it does. Strict base config in `tsconfig.base.json` (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `types: []`, Bundler resolution); each package adds its own `lib`/`types` |
| Lint / format | ESLint 10 flat config with **type-aware** typescript-eslint (`recommendedTypeChecked`); Prettier 3.9 pinned exactly (single quotes, width 100). `docs/` and CLAUDE.md are never reformatted |
| Backend | **Fastify**, on trial until the MVP; the user will re-evaluate then. Keep services and business logic framework-free (no Fastify types outside route/plugin files) so a switch only touches the HTTP layer |
| Frontend | Vite + React + TS, React Router, TanStack Query |
| Forms / validation | React Hook Form + Zod (schemas in `packages/shared`) |
| UI | Tailwind + shadcn/ui |
| Database | PostgreSQL in Docker locally on **port 5433** (project-only, pinned version, resettable), Prisma, UUID ids. View data with pgAdmin (`localhost:5433`) or Prisma Studio. Production host: Neon (lean; confirm at deploy). Never use Supabase's auth/auto-APIs, only its database, if ever chosen |
| Tests | Vitest (unit/API via `app.inject()`), Playwright (E2E) |
| Logging | pino (built into Fastify) |
| Email | Nodemailer over SMTP: Mailpit in dev (local Docker), Resend in prod (free: 3,000/month, 100/day; needs own domain to send to others) |
| CI | GitHub Actions |
| Hosting | Decide at deploy time (free tiers). Free plans often don't keep a worker running, so in prod a free external scheduler may call a protected "run due reminders" endpoint |

Cost rule: the user doesn't want to pay for anything yet. Prefer free tiers; the first paid item will be a domain, before public launch.

Dev machine (Windows 10): Node 24.17, git 2.54, Docker 29.6 + Compose v5, pgAdmin 4. A native PostgreSQL 18 Windows service already runs on port 5432 (the user's, for other projects): leave it alone, which is why ours uses 5433. pnpm 12.14 installed globally for the user (npm, no admin). Docker Desktop is a per-user install (`%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe`) and isn't always running. **Known quirk:** right after Docker Desktop starts, image pulls can fail with "server gave HTTP response to HTTPS client" and containers can start with no published ports (`docker port` prints nothing). Wait a moment, then `docker compose down` + `pnpm docker:up`. Postgres 18 images keep data in `/var/lib/postgresql` (PGDATA `/var/lib/postgresql/18/docker`).
