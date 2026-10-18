# Job Application Tracker --- CI/CD & Release Management Design

**Document Status:** Technical Design\
**Product:** Job Application Tracker\
**Scope:** Continuous integration, continuous delivery, releases,
migrations, approvals, rollbacks, and feature flags\
**Approach:** Simple automated delivery with strong protection around
production

------------------------------------------------------------------------

## 1. Purpose

This document defines how code moves from development to production
safely and consistently.

The release process should:

-   Catch problems before production.
-   Automate repetitive validation.
-   Make deployments reproducible.
-   Keep releases small and understandable.
-   Provide a reliable rollback path.
-   Protect production database changes.
-   Avoid unnecessary release-management complexity.

The goal is:

> **Make shipping boring, predictable, and safe.**

------------------------------------------------------------------------

# 2. CI/CD Principles

## 2.1 Automate Repetitive Checks

Every pull request should automatically validate:

-   Formatting/linting
-   Type checking
-   Unit tests
-   Relevant integration/API tests
-   Production build

Manual work should focus on review and product decisions.

------------------------------------------------------------------------

## 2.2 Production Is Protected

Production deployment should not happen merely because code compiles.

The pipeline should provide multiple safety gates:

``` text
Code
 ↓
CI
 ↓
Review
 ↓
Staging
 ↓
Validation
 ↓
Production
```

------------------------------------------------------------------------

## 2.3 Small Releases

Prefer frequent, small changes over large batches.

Small releases are:

-   Easier to review
-   Easier to test
-   Easier to debug
-   Easier to roll back

------------------------------------------------------------------------

# 3. Git Workflow

A simple branch model is recommended.

``` text
main
 │
 ├── feature/*
 ├── fix/*
 └── refactor/*
```

Feature branches are merged through pull requests.

The exact naming convention can evolve.

Avoid unnecessarily complex branch hierarchies.

------------------------------------------------------------------------

# 4. Pull Request Workflow

Typical flow:

``` text
Create branch
     ↓
Implement feature
     ↓
Run local checks
     ↓
Push branch
     ↓
Open PR
     ↓
Automated CI
     ↓
Code review
     ↓
Fix feedback
     ↓
Merge
```

A pull request should be focused on one meaningful change whenever
practical.

------------------------------------------------------------------------

# 5. Local Development Checks

Before opening a PR, developers should run the same important checks
used in CI.

Typical commands:

``` text
lint
typecheck
test
build
```

This reduces avoidable CI failures.

------------------------------------------------------------------------

# 6. Continuous Integration Pipeline

The CI pipeline should roughly follow:

``` text
Pull Request
     ↓
Install dependencies
     ↓
Lint
     ↓
Type check
     ↓
Unit tests
     ↓
Integration/API tests
     ↓
Build
     ↓
Security/dependency checks
```

The exact order can be optimized for speed.

Fast checks should generally run before expensive checks.

------------------------------------------------------------------------

# 7. Dependency Installation

CI should use deterministic dependency installation.

The repository should commit the appropriate lockfile.

CI should use the lockfile rather than resolving arbitrary dependency
versions on every build.

This reduces:

-   "Works on my machine" problems
-   Unexpected dependency changes
-   Non-reproducible builds

------------------------------------------------------------------------

# 8. Node.js Runtime

The project should pin a supported Node.js major version.

Example:

``` text
Node.js LTS
```

The same major version should be used across:

-   Local development
-   CI
-   Staging
-   Production

Runtime upgrades should be intentional.

------------------------------------------------------------------------

# 9. Linting

Linting catches:

-   Code-quality issues
-   Common mistakes
-   Inconsistent patterns
-   Potential bugs

Lint failures should normally block merging.

------------------------------------------------------------------------

# 10. Type Checking

The TypeScript compiler should run in CI.

Example:

``` text
tsc --noEmit
```

Type errors should block merging unless there is an explicitly reviewed
exception.

------------------------------------------------------------------------

# 11. Automated Tests

CI should execute the test layers defined in the Testing Strategy.

At minimum:

``` text
Unit tests
Integration/API tests
```

E2E tests should run for important changes and before production
release.

------------------------------------------------------------------------

# 12. Build Validation

The production build must succeed before deployment.

This catches issues that unit tests may not detect.

Example:

``` text
Frontend production build
Backend production build
Worker production build
```

The exact build structure depends on the repository architecture.

------------------------------------------------------------------------

# 13. CI Caching

Dependency caches may be used to speed up CI.

Cache:

-   Package-manager dependencies
-   Build artifacts where appropriate

Do not allow stale caches to hide dependency or build problems.

When debugging suspicious CI behavior, cache invalidation should be one
of the troubleshooting options.

------------------------------------------------------------------------

# 14. Pull Request Quality Gates

A PR should generally require:

-   [ ] CI passes
-   [ ] Type checking passes
-   [ ] Tests pass
-   [ ] Build succeeds
-   [ ] Required review completed
-   [ ] No unresolved critical issue
-   [ ] Database migration reviewed if applicable

Only after these conditions should code be merged.

------------------------------------------------------------------------

# 15. Code Review

Code review should focus on:

### Correctness

Does the implementation solve the problem?

### Architecture

Does it fit the established architecture?

### Security

Does it introduce access-control or data-exposure risks?

### Data integrity

Can it corrupt or partially update important data?

### Maintainability

Will the next developer understand it?

### Testing

Are important behaviors covered?

Code review should not become a style debate that automated tooling can
solve.

------------------------------------------------------------------------

# 16. Merge Strategy

The repository should use a consistent merge strategy.

A simple approach is:

``` text
Feature branch
      ↓
Squash / merge through PR
      ↓
main
```

The exact Git strategy can change as the team grows.

The important requirement is maintaining a clear production history.

------------------------------------------------------------------------

# 17. Staging Environment

After merging approved code, the release candidate should be deployed to
staging.

``` text
main
 ↓
Build
 ↓
Staging
 ↓
Smoke tests
 ↓
E2E tests
```

Staging should resemble production sufficiently to catch deployment and
integration problems.

------------------------------------------------------------------------

# 18. Staging Validation

Validate:

-   Application starts.
-   Database connection works.
-   Redis connection works.
-   Authentication works.
-   Dashboard loads.
-   Application creation works.
-   Application updates work.
-   Follow-ups work.
-   Interviews work.
-   Notifications/background jobs work where applicable.

------------------------------------------------------------------------

# 19. Environment Promotion

The preferred model is:

``` text
Same source commit
        ↓
     Staging
        ↓
 Production
```

Avoid rebuilding materially different source code between staging and
production.

The production deployment should correspond to a known commit/build
artifact.

------------------------------------------------------------------------

# 20. Release Versioning

Each production release should be identifiable.

Possible version:

``` text
v1.4.0
```

or:

``` text
release-2026-10-07
```

The exact versioning scheme can be selected later.

The important part is that every deployment maps to a specific source
commit.

------------------------------------------------------------------------

# 21. Semantic Versioning

If semantic versioning is adopted:

``` text
MAJOR.MINOR.PATCH
```

### MAJOR

Breaking changes.

### MINOR

Backward-compatible features.

### PATCH

Backward-compatible fixes.

For an early product, strict semantic versioning is optional. Git
commit/version traceability is mandatory.

------------------------------------------------------------------------

# 22. Release Types

Useful release categories:

### Feature release

Adds user-visible functionality.

### Bug-fix release

Fixes existing behavior.

### Security release

Addresses a security vulnerability.

### Infrastructure release

Changes deployment or infrastructure.

### Database release

Contains important schema/data migration changes.

A release may belong to more than one category.

------------------------------------------------------------------------

# 23. Database Migration Pipeline

Database migrations require special treatment.

Recommended process:

``` text
Developer creates migration
        ↓
Migration reviewed
        ↓
CI validates migration
        ↓
Staging migration
        ↓
Application tested
        ↓
Production migration
        ↓
Application deployment
```

The exact ordering depends on whether the migration is backward
compatible.

------------------------------------------------------------------------

# 24. Expand-and-Contract Migrations

For risky schema changes, use an expand-and-contract approach.

Example:

### Phase 1

Add new nullable column.

### Phase 2

Deploy code that supports old + new structure.

### Phase 3

Backfill data.

### Phase 4

Start writing new field.

### Phase 5

Verify migration.

### Phase 6

Remove old field later.

This reduces deployment risk.

------------------------------------------------------------------------

# 25. Migration Rules

Avoid:

-   Editing an already-applied migration.
-   Destructive production changes without review.
-   Unbounded data migrations during peak traffic.
-   Assuming rollback automatically reverses database changes.

Database rollback and application rollback are different problems.

------------------------------------------------------------------------

# 26. Production Deployment

A production release should follow:

``` text
Approved commit
      ↓
Build artifact
      ↓
Deploy
      ↓
Health check
      ↓
Smoke test
      ↓
Monitor
```

If the platform supports rolling deployments, use them where practical.

------------------------------------------------------------------------

# 27. Deployment Approval

For a small team, production deployment can initially require an
explicit human confirmation after staging validation.

Later, low-risk releases can be automated further.

The goal is not maximum manual approval.

The goal is appropriate protection for the current maturity of the
product.

------------------------------------------------------------------------

# 28. Feature Flags

Feature flags can separate:

``` text
Code deployment
```

from:

``` text
Feature activation
```

Example:

``` text
new_dashboard = false
```

The code can be deployed without immediately exposing the feature to
users.

------------------------------------------------------------------------

# 29. When to Use Feature Flags

Useful for:

-   Large features
-   Risky changes
-   Gradual rollout
-   A/B experiments
-   Features requiring staged activation
-   Emergency disabling

Do not add flags to every small change.

------------------------------------------------------------------------

# 30. Feature Flag Lifecycle

Every temporary feature flag should have:

-   Owner
-   Purpose
-   Default state
-   Expected removal date
-   Rollout plan

Unused flags should be removed.

Feature flags should not become permanent hidden configuration.

------------------------------------------------------------------------

# 31. Rollout Strategy

A risky feature can be released gradually:

``` text
Deploy code
    ↓
Feature disabled
    ↓
Enable internally
    ↓
Small user group
    ↓
Monitor
    ↓
Increase rollout
    ↓
100%
    ↓
Remove flag
```

For an early single-user-focused product, gradual rollout may not be
necessary for every feature.

------------------------------------------------------------------------

# 32. Rollback Strategy

If a deployment causes problems:

``` text
Detect issue
    ↓
Assess severity
    ↓
Stop rollout
    ↓
Rollback application if safe
    ↓
Disable feature flag if available
    ↓
Investigate
```

Feature flags can sometimes provide a faster mitigation than a full
deployment rollback.

------------------------------------------------------------------------

# 33. When Not to Roll Back

Do not blindly roll back when:

-   Database migration is not backward compatible.
-   Rollback would cause additional data corruption.
-   The issue is isolated to an optional feature that can be disabled
    safely.

Instead, stabilize the system and apply a forward fix when necessary.

------------------------------------------------------------------------

# 34. Hotfix Process

Critical production issues may require an expedited path.

``` text
Production issue
      ↓
Create hotfix branch
      ↓
Implement minimal fix
      ↓
Run critical tests
      ↓
Review
      ↓
Deploy
      ↓
Verify
      ↓
Merge fix back
```

A hotfix should remain small.

------------------------------------------------------------------------

# 35. Emergency Changes

Emergency production changes should still be traceable.

Record:

-   What changed
-   Why it changed
-   Who approved it
-   What version was deployed
-   What validation was performed
-   Whether follow-up cleanup is required

Emergency process should not become a permanent alternative to normal
CI/CD.

------------------------------------------------------------------------

# 36. Release Checklist

Before production:

### Code

-   [ ] PR reviewed
-   [ ] CI passed
-   [ ] Tests passed
-   [ ] Build passed

### Database

-   [ ] Migration reviewed
-   [ ] Migration tested in staging
-   [ ] Data impact understood

### Infrastructure

-   [ ] Environment variables available
-   [ ] Deployment configuration valid
-   [ ] Health checks configured

### Product

-   [ ] Critical E2E flows verified
-   [ ] Feature flags configured
-   [ ] Release notes prepared if needed

### Operations

-   [ ] Monitoring active
-   [ ] Rollback plan understood

------------------------------------------------------------------------

# 37. Post-Deployment Checklist

After production deployment:

-   [ ] Health check passes
-   [ ] Frontend loads
-   [ ] Authentication works
-   [ ] Application list loads
-   [ ] Application creation works
-   [ ] Critical API endpoints work
-   [ ] Worker is processing jobs
-   [ ] Error rate is normal
-   [ ] Database metrics are normal
-   [ ] No unexpected queue growth

Monitor the deployment for an appropriate period.

------------------------------------------------------------------------

# 38. Release Notes

Each meaningful release should document:

``` text
Version
Date
Features
Bug fixes
Database changes
Infrastructure changes
Known limitations
```

Release notes do not need to be long.

Their purpose is traceability.

------------------------------------------------------------------------

# 39. CI/CD Security

CI/CD credentials should follow least privilege.

Do not give CI unrestricted production access if the pipeline does not
require it.

Protect:

-   Cloud credentials
-   Deployment tokens
-   Package registry credentials
-   Signing keys
-   OAuth secrets
-   Database credentials

Secrets should come from secure CI/CD secret storage.

------------------------------------------------------------------------

# 40. Dependency Security

CI should periodically check dependencies for known vulnerabilities.

The project should distinguish:

-   Development-only dependencies
-   Runtime dependencies

Critical vulnerabilities should be investigated promptly.

Automated dependency updates can be introduced once the project is
stable enough to absorb them safely.

------------------------------------------------------------------------

# 41. Build Reproducibility

A deployment should be reproducible from:

``` text
Git commit
+
Lockfile
+
Build configuration
+
Environment configuration
```

The same source should not randomly produce materially different builds.

------------------------------------------------------------------------

# 42. Artifact Traceability

Every production deployment should answer:

``` text
What code is running?
```

and:

``` text
Which database migration version is running?
```

Useful metadata:

-   Git SHA
-   Release version
-   Build timestamp
-   Deployment timestamp
-   Environment

------------------------------------------------------------------------

# 43. CI Failure Policy

A failed CI check should normally block merging.

Do not repeatedly ignore:

``` text
test failure
lint failure
type error
build failure
```

If a failure is caused by infrastructure rather than code, fix the
infrastructure or explicitly rerun after identifying the cause.

------------------------------------------------------------------------

# 44. Flaky CI Tests

Flaky tests should be treated as engineering problems.

Process:

``` text
Flaky test detected
       ↓
Identify cause
       ↓
Fix synchronization/data isolation
       ↓
Verify stability
```

Do not normalize repeated retries as a permanent solution.

------------------------------------------------------------------------

# 45. Deployment Observability

Deployment events should be visible alongside application monitoring.

When investigating an incident, the team should be able to correlate:

``` text
Error spike
     ↓
Deployment
     ↓
Commit
     ↓
Code change
```

This dramatically reduces debugging time.

------------------------------------------------------------------------

# 46. Release Frequency

There is no requirement to release on a fixed schedule initially.

Prefer:

> Release when a meaningful, tested change is ready.

As the product matures, the team can adopt:

-   Weekly releases
-   Continuous deployment
-   Scheduled release windows

The process should evolve based on team needs.

------------------------------------------------------------------------

# 47. Avoid Over-Engineering CI/CD

The MVP does not require:

-   Multiple deployment pipelines for every tiny module
-   Complex release trains
-   Kubernetes deployment orchestration
-   Multi-region deployment automation
-   Dozens of environments
-   Elaborate approval chains

Start with:

``` text
PR → CI → Staging → Production
```

and grow from there.

------------------------------------------------------------------------

# 48. Final CI/CD Architecture

``` text
                  Developer
                      |
                      ▼
               Feature Branch
                      |
                      ▼
                Pull Request
                      |
                      ▼
              ┌───────────────┐
              │      CI       │
              │ Lint          │
              │ Types         │
              │ Unit Tests    │
              │ Integration   │
              │ Build         │
              └───────┬───────┘
                      |
                      ▼
                  Code Review
                      |
                      ▼
                    main
                      |
                      ▼
                 Staging
                      |
             ┌────────┴────────┐
             ▼                 ▼
        Smoke Tests         E2E Tests
             └────────┬────────┘
                      ▼
             Production Approval
                      |
                      ▼
                 Production
                      |
                      ▼
             Health + Monitoring
```

------------------------------------------------------------------------

# 49. Final Decision

The Job Application Tracker will use a **simple automated CI/CD pipeline
with strong production safeguards**.

The guiding principle is:

> **Every change should be automatically validated, manually reviewed
> where appropriate, tested in staging, traceable to a commit, and
> deployable with a known rollback or mitigation strategy.**

The release process should remain lightweight enough that a small team
can actually follow it.

The goal is not to create a sophisticated DevOps organization.

The goal is to make shipping software safer and more repeatable.

------------------------------------------------------------------------

# 50. Implementation Checklist

-   [ ] Git branch strategy established.
-   [ ] Pull request workflow established.
-   [ ] CI pipeline configured.
-   [ ] Linting in CI.
-   [ ] Type checking in CI.
-   [ ] Unit tests in CI.
-   [ ] Integration/API tests in CI.
-   [ ] Production builds validated.
-   [ ] Staging deployment configured.
-   [ ] Staging smoke tests configured.
-   [ ] Critical E2E tests configured.
-   [ ] Production deployment configured.
-   [ ] Deployment version/commit recorded.
-   [ ] Database migration process documented.
-   [ ] Rollback strategy documented.
-   [ ] Feature-flag strategy defined.
-   [ ] Production secrets stored securely.
-   [ ] Deployment monitoring configured.
-   [ ] Release checklist established.
-   [ ] Hotfix process documented.

------------------------------------------------------------------------

## Next Document

**Architectural Decision Records (ADR) & Technical Decisions**

This document will capture the important architectural decisions made
for the project, including:

-   Modular monolith
-   React + TypeScript
-   Node.js + TypeScript
-   PostgreSQL + Prisma
-   REST API
-   Google OAuth
-   JWT/session strategy
-   Redis
-   Background workers
-   Object storage
-   API versioning
-   Pagination
-   Why microservices are deferred
-   Why AI/browser extension/mobile are deferred from MVP
-   Other important decisions and their trade-offs
