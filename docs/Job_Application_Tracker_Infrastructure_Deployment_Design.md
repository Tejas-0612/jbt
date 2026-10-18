# Job Application Tracker --- Infrastructure & Deployment Design

**Document Status:** Technical Design\
**Product:** Job Application Tracker\
**Scope:** Infrastructure, environments, deployment, networking,
secrets, backups, and recovery\
**Approach:** Simple, secure, production-ready infrastructure without
premature complexity

------------------------------------------------------------------------

## 1. Purpose

This document defines how the Job Application Tracker will be deployed
and operated across development, staging, and production environments.

The infrastructure should:

-   Be simple enough for a small team to maintain.
-   Support the modular-monolith architecture.
-   Allow API and workers to scale independently.
-   Protect application and user data.
-   Support reliable deployments and rollbacks.
-   Provide backups and recovery mechanisms.
-   Avoid unnecessary infrastructure complexity.

The goal is not to design infrastructure for millions of users before
the product has users.

------------------------------------------------------------------------

# 2. Infrastructure Principles

## 2.1 Start Simple

The initial deployment should use managed services wherever practical.

Prefer:

-   Managed PostgreSQL
-   Managed Redis where required
-   Managed object storage
-   Managed frontend hosting
-   Containerized or managed backend deployment

Avoid operating infrastructure that a small team does not need to
operate themselves.

------------------------------------------------------------------------

## 2.2 Production Should Be Reproducible

Infrastructure configuration should be documented and, where practical,
represented as code.

A new environment should not depend on undocumented manual steps.

------------------------------------------------------------------------

## 2.3 Environment Isolation

Development, staging, and production should have separate:

-   Databases
-   Redis instances/databases where appropriate
-   Storage buckets
-   Credentials
-   Environment variables
-   OAuth configuration

Production data must never be used casually in development.

------------------------------------------------------------------------

# 3. Environment Architecture

The project should have three primary environments.

``` text
Development
    ↓
Staging
    ↓
Production
```

## Development

Used for:

-   Local development
-   Feature implementation
-   Debugging
-   Unit/integration testing

## Staging

Used for:

-   Release validation
-   E2E testing
-   Migration validation
-   Production-like testing

## Production

Used by real users.

Production should have stricter access controls and monitoring.

------------------------------------------------------------------------

# 4. Development Environment

A developer should be able to run the application locally.

Typical setup:

``` text
React Frontend
      |
Node.js API
      |
PostgreSQL
      |
Redis
      |
Worker
```

PostgreSQL and Redis can initially run locally through Docker.

Example:

``` text
docker compose
    ├── postgres
    └── redis
```

The frontend, API, and worker can run directly from the development
environment.

------------------------------------------------------------------------

# 5. Production Architecture

The initial production architecture:

``` text
                       Internet
                           |
                           ▼
                    ┌──────────────┐
                    │ CDN / HTTPS  │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌──────────────┐         ┌──────────────┐
       │   Frontend   │         │ API Service  │
       │   Hosting    │         │              │
       └──────────────┘         └──────┬───────┘
                                       │
                         ┌─────────────┼─────────────┐
                         ▼             ▼             ▼
                    PostgreSQL       Redis       Object Storage
                         ▲             ▲
                         │             │
                         └───── Worker ┘
```

The exact cloud provider is intentionally not fixed by this document.

------------------------------------------------------------------------

# 6. Frontend Deployment

The React application should be built as a production bundle.

Typical process:

``` text
Source Code
    ↓
Install Dependencies
    ↓
Type Check / Tests
    ↓
Production Build
    ↓
Deploy Static Assets
    ↓
CDN
```

The frontend should be served through HTTPS.

A CDN should handle static assets where supported.

------------------------------------------------------------------------

# 7. API Deployment

The Node.js API should run as a production service.

The service should:

-   Use production environment variables.
-   Connect to managed PostgreSQL.
-   Connect to Redis where required.
-   Expose health endpoints.
-   Emit structured logs.
-   Support graceful shutdown.
-   Use HTTPS through the deployment platform/load balancer.

The API should be stateless from the perspective of individual
instances.

------------------------------------------------------------------------

# 8. Worker Deployment

Background workers should run separately from API processes.

``` text
API
 |
 └── creates job
       |
       ▼
     Queue
       |
       ▼
    Worker
```

Workers handle tasks such as:

-   Follow-up reminders
-   Notifications
-   Scheduled jobs
-   Cleanup
-   Future integrations

The worker should not be responsible for serving normal HTTP requests.

------------------------------------------------------------------------

# 9. PostgreSQL Deployment

PostgreSQL is the primary source of truth.

Production should use a managed PostgreSQL service where practical.

Benefits:

-   Automated backups
-   Monitoring
-   Maintenance support
-   Easier scaling
-   Recovery options
-   Reduced operational overhead

The database should not be publicly accessible unless absolutely
required.

------------------------------------------------------------------------

# 10. PostgreSQL Network Security

The database should ideally accept connections only from trusted
application/worker infrastructure.

Conceptually:

``` text
Internet
   X
   |
PostgreSQL

API ───────────► PostgreSQL
Worker ────────► PostgreSQL
```

The database should not expose an unrestricted public endpoint.

If the hosting provider requires public connectivity, network rules and
TLS must still restrict access.

------------------------------------------------------------------------

# 11. Redis Deployment

Redis may be used for:

-   Background-job queues
-   Temporary caching
-   Rate limiting where required
-   Short-lived application state

Redis is not the primary source of truth.

If Redis is unavailable, the system should degrade according to the
behavior defined in the resilience design.

A managed Redis service is preferred in production.

------------------------------------------------------------------------

# 12. Object Storage

Files such as resumes and supporting documents should use object storage
rather than local application disk.

Example:

``` text
User
 |
 ▼
API requests upload authorization
 |
 ▼
Signed Upload URL
 |
 ▼
Object Storage
```

The API stores file metadata in PostgreSQL.

Object storage should provide:

-   Encryption
-   Access control
-   Private buckets/containers
-   Lifecycle policies where appropriate
-   Versioning where useful

------------------------------------------------------------------------

# 13. File Access

User files should not be publicly accessible by default.

Recommended pattern:

``` text
User requests file
       ↓
API checks ownership
       ↓
API generates short-lived signed URL
       ↓
User downloads file
```

This keeps authorization under application control.

------------------------------------------------------------------------

# 14. Domains

A production setup should use a proper domain.

Example:

``` text
app.example.com
api.example.com
```

The exact domain is a deployment decision.

HTTPS should be mandatory for production.

------------------------------------------------------------------------

# 15. HTTPS

All production traffic should use HTTPS.

This includes:

-   Browser → frontend
-   Browser → API
-   API → external services
-   API → PostgreSQL where supported/required
-   API → Redis where supported/required
-   Worker → external providers

HTTP should redirect to HTTPS where applicable.

------------------------------------------------------------------------

# 16. Environment Variables

Configuration should be separated from source code.

Examples:

``` text
DATABASE_URL
REDIS_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
JWT_SECRET
REFRESH_TOKEN_SECRET
STORAGE_BUCKET
STORAGE_REGION
API_BASE_URL
FRONTEND_URL
```

Actual secret values must never be committed to Git.

------------------------------------------------------------------------

# 17. Secrets Management

Production secrets should be stored in a secure secrets manager or the
hosting platform's encrypted secret storage.

Do not:

-   Commit secrets to Git.
-   Put secrets in frontend source code.
-   Share production secrets in chat.
-   Store production credentials in local `.env` files that are
    committed.

Frontend variables must be treated as public unless the framework
explicitly guarantees otherwise.

------------------------------------------------------------------------

# 18. Environment Configuration

Use separate configuration for each environment.

Example:

``` text
.env.local
.env.test
staging secrets
production secrets
```

The application should fail fast when required production configuration
is missing.

------------------------------------------------------------------------

# 19. CI/CD Pipeline

The deployment pipeline should follow:

``` text
Developer
    ↓
Git Push / Pull Request
    ↓
Lint
    ↓
Type Check
    ↓
Tests
    ↓
Build
    ↓
Review
    ↓
Deploy Staging
    ↓
Smoke / E2E Tests
    ↓
Production Approval
    ↓
Deploy Production
```

The exact approval model can evolve as the team grows.

------------------------------------------------------------------------

# 20. Branch Strategy

A simple Git strategy is preferred.

For example:

``` text
main
  ↓
feature/*
```

Feature branches should go through pull requests before merging into the
production branch.

A staging branch can be introduced only if it provides real value.

Avoid complicated Git workflows for a small team.

------------------------------------------------------------------------

# 21. Build Artifacts

Production deployments should use reproducible builds.

The deployment should record:

-   Git commit SHA
-   Build version
-   Deployment timestamp
-   Environment

This makes it possible to determine exactly what version is running.

------------------------------------------------------------------------

# 22. Database Migrations

Database schema changes must use versioned migrations.

Typical flow:

``` text
Code Change
    ↓
Prisma Migration
    ↓
Review Migration
    ↓
Apply in Staging
    ↓
Test
    ↓
Apply in Production
```

Never casually modify the production schema manually.

------------------------------------------------------------------------

# 23. Safe Migration Strategy

Migration changes should consider existing production data.

Prefer backward-compatible changes when possible.

For example:

### Safer

``` text
1. Add nullable column
2. Deploy code supporting both states
3. Backfill data
4. Make column required later
```

Avoid migrations that require immediate destructive changes unless
carefully planned.

------------------------------------------------------------------------

# 24. Deployment Strategy

The initial strategy can use rolling or platform-managed deployments.

A deployment should:

1.  Build the new version.
2.  Start the new instance/container.
3.  Verify health.
4.  Route traffic to the new version.
5.  Remove the old version after successful rollout.

The exact deployment mechanism depends on the hosting provider.

------------------------------------------------------------------------

# 25. Health Checks

The API should expose health endpoints.

Example:

``` text
GET /health
GET /ready
```

### `/health`

Indicates that the process is alive.

### `/ready`

Indicates that the service is ready to receive traffic.

Readiness may verify critical dependencies such as database
connectivity.

Health checks should remain lightweight.

------------------------------------------------------------------------

# 26. Graceful Shutdown

The API and worker should handle shutdown signals.

During shutdown:

1.  Stop accepting new work.
2.  Finish or safely release active work.
3.  Close database connections.
4.  Close Redis connections.
5.  Exit cleanly.

This prevents deployments from unnecessarily interrupting requests or
jobs.

------------------------------------------------------------------------

# 27. Rollback Strategy

Every production deployment should have a rollback path.

Possible rollback:

``` text
Current Version
      ↓
Problem detected
      ↓
Revert to previous application version
```

Application rollback is easiest when database migrations remain backward
compatible.

Destructive database migrations make rollback much harder.

------------------------------------------------------------------------

# 28. Database Backup Strategy

Production PostgreSQL should have automated backups.

At minimum:

-   Scheduled backups
-   Point-in-time recovery if supported
-   Backup retention policy
-   Access controls

Backups are only useful if recovery works.

------------------------------------------------------------------------

# 29. Backup Verification

Backups should periodically be tested by restoring them into a
non-production environment.

The recovery process should verify:

``` text
Backup
  ↓
Restore
  ↓
Database starts
  ↓
Application connects
  ↓
Important data exists
```

A backup that has never been restored should not be considered fully
trustworthy.

------------------------------------------------------------------------

# 30. Disaster Recovery

The system should define a recovery plan for:

-   Database failure
-   Hosting outage
-   Accidental deletion
-   Corrupted deployment
-   Lost configuration
-   Object-storage failure
-   Redis failure

Not every failure requires the same recovery mechanism.

------------------------------------------------------------------------

# 31. Recovery Priorities

When a major failure occurs, prioritize:

1.  Restore database availability.
2.  Restore API.
3.  Restore frontend.
4.  Restore background workers.
5.  Restore notifications and secondary capabilities.
6.  Verify data integrity.

The core job-tracking workflow has higher priority than secondary
features.

------------------------------------------------------------------------

# 32. RPO and RTO

Initial recovery objectives should be defined pragmatically.

### Recovery Point Objective (RPO)

How much recent data can potentially be lost?

Example initial target:

``` text
Hours rather than days
```

### Recovery Time Objective (RTO)

How quickly should service be restored?

Example initial target:

``` text
Within a few hours for a serious infrastructure failure
```

These are initial planning targets and should become stricter if the
product's business requirements justify them.

------------------------------------------------------------------------

# 33. Monitoring and Alerts

Infrastructure monitoring should cover:

### API

-   Availability
-   Latency
-   Error rate
-   CPU
-   Memory

### Database

-   CPU
-   Memory
-   Storage
-   Connections
-   Query latency

### Redis

-   Memory
-   Connection count
-   Queue depth where applicable

### Worker

-   Job failures
-   Queue depth
-   Processing time

### Storage

-   Usage
-   Failed uploads
-   Failed downloads where measurable

------------------------------------------------------------------------

# 34. Alerting

Alerts should focus on actionable problems.

Examples:

``` text
API unavailable
Error rate suddenly increased
Database storage almost full
Database connections exhausted
Worker queue continuously growing
Backup failure
Certificate expiration approaching
```

Avoid alerts for every small fluctuation.

Too many alerts create alert fatigue.

------------------------------------------------------------------------

# 35. Logging

Production logs should be structured.

Include useful fields such as:

``` text
timestamp
level
service
request_id
user_id where appropriate
route
status_code
duration
error_code
```

Never log sensitive information such as:

-   Access tokens
-   Refresh tokens
-   Passwords
-   OAuth client secrets
-   Private file contents

------------------------------------------------------------------------

# 36. Request Correlation

Each request should have a correlation/request ID.

Example:

``` text
Request ID: req_123
```

The same ID can appear in related logs.

This makes debugging easier:

``` text
Frontend request
      ↓
API log
      ↓
Database operation
      ↓
Error
```

------------------------------------------------------------------------

# 37. Rate Limiting

Rate limiting should protect sensitive or expensive endpoints.

Potential targets:

-   Authentication endpoints
-   Refresh-token endpoints
-   File-generation endpoints
-   Expensive search endpoints
-   Public endpoints if introduced

Rate limits should not make normal user activity frustrating.

------------------------------------------------------------------------

# 38. Infrastructure Security

Production infrastructure should follow least privilege.

Examples:

-   API receives only required database permissions.
-   Worker receives only required queue/database permissions.
-   Deployment credentials have limited scope.
-   Developers do not automatically receive unrestricted production
    access.
-   Storage buckets remain private by default.

------------------------------------------------------------------------

# 39. Production Access

Production access should be limited to authorized team members.

Where supported:

-   MFA
-   Role-based access
-   Audit logs
-   Separate deployment credentials
-   Temporary elevated access

Production access should not depend on sharing a single account.

------------------------------------------------------------------------

# 40. Dependency and Runtime Management

Production should use supported versions of:

-   Node.js
-   PostgreSQL
-   Redis
-   Package dependencies

Dependencies should be updated regularly.

Security updates should be prioritized.

------------------------------------------------------------------------

# 41. Containerization

Containerization is recommended for the API and worker when it
simplifies deployment consistency.

Example:

``` text
Docker Image
   ├── API
   └── Worker
```

The frontend may use the hosting provider's native build/deployment
system instead.

Docker should solve reproducibility problems, not become an
infrastructure project by itself.

------------------------------------------------------------------------

# 42. Infrastructure as Code

Infrastructure as Code can be introduced when infrastructure becomes
complex enough to justify it.

Possible tools include:

-   Terraform
-   Pulumi
-   Provider-native infrastructure definitions

The important principle is reproducibility.

Do not create a large IaC system before there is enough infrastructure
to benefit from it.

------------------------------------------------------------------------

# 43. Development → Production Flow

The complete flow should look like:

``` text
Developer
   ↓
Feature Branch
   ↓
Pull Request
   ↓
Automated Tests
   ↓
Code Review
   ↓
Merge
   ↓
Staging Deployment
   ↓
Smoke / E2E Validation
   ↓
Production Deployment
   ↓
Health Checks
   ↓
Monitoring
```

------------------------------------------------------------------------

# 44. Cost Management

Infrastructure should be cost-conscious during MVP.

Prefer:

-   Managed free/low-cost tiers where appropriate
-   Small database instances
-   Single worker initially
-   Single API instance initially
-   Minimal Redis capacity
-   Object storage rather than expensive application disk
-   CDN for static assets where beneficial

Scale based on actual usage.

------------------------------------------------------------------------

# 45. What Not to Build Initially

The MVP should avoid:

-   Kubernetes
-   Multi-region deployment
-   Complex service mesh
-   Multi-region databases
-   Custom load-balancer infrastructure
-   Self-managed PostgreSQL clusters
-   Self-managed Redis clusters
-   Complex infrastructure orchestration
-   Multiple cloud providers

These may become valid later but are not initial requirements.

------------------------------------------------------------------------

# 46. Scaling Path

The infrastructure should evolve gradually.

### Stage 1

``` text
Managed Frontend
       +
One API
       +
Managed PostgreSQL
       +
Managed Redis
       +
One Worker
       +
Object Storage
```

### Stage 2

``` text
Multiple API instances
Multiple workers
Larger database
Improved monitoring
```

### Stage 3

Only if justified:

``` text
Read replicas
Dedicated search
Advanced caching
Multi-region infrastructure
Service extraction
```

------------------------------------------------------------------------

# 47. Deployment Checklist

Before production deployment:

-   [ ] Production environment variables configured.
-   [ ] Secrets stored securely.
-   [ ] HTTPS configured.
-   [ ] Database connectivity verified.
-   [ ] Redis connectivity verified.
-   [ ] Object storage configured.
-   [ ] Health checks working.
-   [ ] Database migrations reviewed.
-   [ ] Automated tests passing.
-   [ ] Staging deployment verified.
-   [ ] Smoke tests passing.
-   [ ] Backups enabled.
-   [ ] Monitoring configured.
-   [ ] Alerts configured.
-   [ ] Rollback procedure documented.

------------------------------------------------------------------------

# 48. Disaster Recovery Checklist

Periodically verify:

-   [ ] Database backups exist.
-   [ ] Backup restoration works.
-   [ ] Recovery credentials are available.
-   [ ] Object-storage recovery strategy exists.
-   [ ] Production configuration can be reconstructed.
-   [ ] Previous application version can be redeployed.
-   [ ] Database migrations are recoverable.
-   [ ] Team knows the recovery procedure.

------------------------------------------------------------------------

# 49. Final Infrastructure Architecture

The intended production infrastructure is:

``` text
                         INTERNET
                             |
                             ▼
                    ┌─────────────────┐
                    │ CDN / HTTPS     │
                    └────────┬────────┘
                             |
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌──────────────┐              ┌──────────────┐
       │   Frontend   │              │ API Service  │
       │    Hosting   │              └──────┬───────┘
       └──────────────┘                     |
                                ┌───────────┼───────────┐
                                ▼           ▼           ▼
                          PostgreSQL     Redis     Object Storage
                                ▲           ▲
                                |           |
                                └─────┬─────┘
                                      ▼
                                    Worker
```

The deployment model remains intentionally simple while providing:

-   Secure communication
-   Managed persistence
-   Independent workers
-   Background processing
-   File storage
-   Monitoring
-   Backups
-   Recovery
-   Horizontal scaling capability

------------------------------------------------------------------------

# 50. Final Decision

The Job Application Tracker will use a **managed, environment-separated,
deployment-friendly infrastructure architecture**.

The guiding principle is:

> **Start with the smallest production infrastructure that is secure,
> observable, recoverable, and capable of scaling.**

Infrastructure should support the product rather than become the
product.

The project should not spend weeks configuring Kubernetes or
multi-region infrastructure before the first real users exist.

Instead:

``` text
Build
  ↓
Deploy
  ↓
Measure
  ↓
Find real constraints
  ↓
Improve
  ↓
Scale
```

This keeps infrastructure aligned with actual product needs.

------------------------------------------------------------------------

## Next Document

**CI/CD & Release Management Design**

This document will define:

-   Branching and pull requests
-   CI pipeline
-   Build pipeline
-   Automated tests
-   Staging deployments
-   Production deployments
-   Versioning
-   Release process
-   Database migration handling
-   Rollbacks
-   Feature flags
-   Environment promotion
-   Deployment approvals
-   Release checklists
