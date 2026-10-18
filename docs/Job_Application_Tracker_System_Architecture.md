# Job Application Tracker --- System Architecture Document (SAD)

## Document Information

  Field                Value
  -------------------- -----------------------------------------
  Product              Job Application Tracker
  Document Type        System Architecture Document
  Depends On           Product Discovery, PRD, UX & User Flows
  Product Stage        MVP
  Primary User         Individual job seeker
  Architecture Style   Modular Monolith
  Database             PostgreSQL
  ORM                  Prisma
  API Style            REST
  Status               Working / reconstructed architecture

------------------------------------------------------------------------

# 1. Purpose

This document defines the technical architecture for the Job Application
Tracker.

The Product Discovery document defined **why** the product exists.

The PRD defined **what** the product should do.

The UX document defined **how the user interacts with it**.

This document defines:

> **How the system should be built.**

It covers:

-   system architecture
-   frontend architecture
-   backend architecture
-   database architecture
-   authentication
-   API architecture
-   authorization
-   security
-   background processing
-   notifications
-   file storage
-   observability
-   performance
-   testing
-   deployment
-   CI/CD
-   architectural decisions
-   future evolution

The architecture should be strong enough to support future growth
without turning the MVP into an unnecessarily complicated distributed
system.

------------------------------------------------------------------------

# 2. Architectural Goals

The architecture should optimize for:

1.  Simplicity
2.  Maintainability
3.  Security
4.  Clear domain boundaries
5.  Fast development
6.  Good developer experience
7.  Testability
8.  Reasonable scalability
9.  Easy deployment
10. Future extensibility

The product does **not** require massive-scale infrastructure at MVP
stage.

------------------------------------------------------------------------

# 3. Core Architectural Principle

> **Start with a modular monolith, not microservices.**

The product has several domains, but they are closely related.

A single backend application with clear internal modules provides:

-   simpler development
-   simpler deployment
-   easier local development
-   easier debugging
-   easier transactions
-   lower infrastructure cost

The architecture should preserve module boundaries so that a future
service extraction remains possible if it ever becomes necessary.

------------------------------------------------------------------------

# 4. High-Level Architecture

The proposed system:

``` text
                         ┌──────────────────────┐
                         │      Web Browser     │
                         │      React App       │
                         └──────────┬───────────┘
                                    │
                                  HTTPS
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      API Server      │
                         │   Modular Monolith   │
                         │       Node.js        │
                         └───────┬───────┬──────┘
                                 │       │
                   ┌─────────────┘       └──────────────┐
                   ▼                                    ▼
          ┌─────────────────┐                  ┌─────────────────┐
          │   PostgreSQL    │                  │     Redis       │
          │   Primary DB    │                  │ Cache / Jobs    │
          └─────────────────┘                  └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ Background Jobs  │
                                               │ / Worker Process │
                                               └─────────────────┘

                         External Services
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
         Google OAuth       Email Provider     Object Storage
```

------------------------------------------------------------------------

# 5. Main Components

The system consists of these major components:

## 5.1 Frontend

A React-based web application responsible for:

-   rendering UI
-   navigation
-   forms
-   client-side state
-   API communication
-   authentication state
-   user interactions

## 5.2 Backend API

A Node.js backend responsible for:

-   business logic
-   authentication
-   authorization
-   validation
-   API endpoints
-   database operations
-   domain rules

## 5.3 PostgreSQL

The primary persistent database.

It stores:

-   users
-   sessions
-   companies
-   roles
-   applications
-   activities
-   follow-ups
-   interviews
-   notes
-   connections
-   notification data

## 5.4 Redis

Redis is optional for parts of the initial MVP but is useful for:

-   background job queues
-   short-lived caching
-   rate limiting
-   temporary processing state

Redis should not become the source of truth for important product data.

## 5.5 Worker

A background worker handles asynchronous tasks such as:

-   reminders
-   scheduled notifications
-   future integrations
-   long-running processing

The worker can initially run from the same codebase as a separate
process.

------------------------------------------------------------------------

# 6. Architectural Style

## 6.1 Modular Monolith

The backend should be organized by domain.

Example:

``` text
backend/
  src/
    modules/
      auth/
      users/
      applications/
      companies/
      roles/
      activities/
      followups/
      interviews/
      notes/
      connections/
      notifications/
      analytics/
    common/
    config/
    database/
```

Each module should contain its own:

-   controller/routes
-   service/business logic
-   validation
-   repository/data access where appropriate
-   types
-   tests

------------------------------------------------------------------------

# 7. Domain Modules

## 7.1 Auth Module

Responsibilities:

-   Google authentication
-   login/logout
-   sessions
-   token handling
-   authentication middleware

## 7.2 Users Module

Responsibilities:

-   user profile
-   user preferences
-   account settings

## 7.3 Applications Module

Core domain.

Responsibilities:

-   application CRUD
-   application status
-   application ownership
-   application queries
-   application lifecycle

## 7.4 Companies Module

Responsibilities:

-   company records
-   company information
-   company relationships

## 7.5 Roles Module

Responsibilities:

-   job/role information
-   job URL
-   role metadata

## 7.6 Activities Module

Responsibilities:

-   application timeline
-   activity creation
-   activity history

## 7.7 Follow-Ups Module

Responsibilities:

-   follow-up CRUD
-   due dates
-   completion
-   pending/overdue state

## 7.8 Interviews Module

Responsibilities:

-   interview rounds
-   scheduling
-   interview status
-   interview notes
-   outcomes

## 7.9 Notes Module

Responsibilities:

-   application notes
-   note updates
-   note deletion

## 7.10 Connections Module

Responsibilities:

-   recruiters
-   referrals
-   professional contacts
-   application/contact relationships

## 7.11 Notifications Module

Responsibilities:

-   reminders
-   notification preferences
-   notification delivery
-   notification history where needed

## 7.12 Analytics Module

Responsibilities:

-   dashboard metrics
-   basic job-search statistics

Analytics should primarily derive information from source-of-truth data
rather than maintaining unnecessary duplicate state.

------------------------------------------------------------------------

# 8. Frontend Architecture

The frontend should be organized around features rather than only
generic UI components.

Example:

``` text
src/
  app/
    router/
    providers/

  features/
    auth/
    dashboard/
    applications/
    followups/
    interviews/
    notes/
    connections/
    analytics/
    settings/

  components/
    ui/
    forms/
    layout/

  services/
    api/

  hooks/

  store/

  utils/
```

------------------------------------------------------------------------

# 9. Frontend Responsibilities

The frontend should handle:

-   presentation
-   user interaction
-   form state
-   client-side validation where useful
-   API request orchestration
-   loading states
-   error states
-   navigation
-   optimistic UI only where safe

The frontend should **not** be the authority for:

-   authorization
-   ownership
-   security rules
-   important business rules
-   persistence

The backend remains authoritative.

------------------------------------------------------------------------

# 10. Frontend State Management

State should be divided into categories.

## Server State

Examples:

-   applications
-   interviews
-   follow-ups
-   companies

This state comes from the backend and should use an appropriate
server-state/data-fetching strategy.

## UI State

Examples:

-   open modal
-   selected filter
-   sidebar state
-   active tab

This can remain local to components when possible.

## Authentication State

The frontend needs to know:

-   whether the user is authenticated
-   basic user information
-   session state

Sensitive long-lived credentials should not be stored insecurely in
browser storage.

------------------------------------------------------------------------

# 11. Backend Architecture

The backend should follow a layered structure.

``` text
HTTP Request
     ↓
Route / Controller
     ↓
Validation
     ↓
Authorization
     ↓
Service / Business Logic
     ↓
Repository / Prisma
     ↓
PostgreSQL
```

A controller should not contain the entire business logic.

------------------------------------------------------------------------

# 12. Controller Layer

Responsibilities:

-   receive HTTP request
-   extract parameters
-   validate input
-   call service
-   return response

Controllers should remain thin.

Example:

``` text
PATCH /api/v1/applications/:id/status

Controller
    ↓
Validate request
    ↓
Call ApplicationService.updateStatus()
    ↓
Return response
```

------------------------------------------------------------------------

# 13. Service Layer

The service layer contains business behavior.

Examples:

``` text
ApplicationService
FollowUpService
InterviewService
AnalyticsService
```

A service may coordinate multiple database operations.

Example:

``` text
Update application status
        ↓
Validate ownership
        ↓
Update application
        ↓
Create timeline activity
        ↓
Commit transaction
```

This is important because a status change and its history should remain
consistent.

------------------------------------------------------------------------

# 14. Database Access

Prisma should be the main ORM/data-access layer.

Example:

``` text
Service
   ↓
Prisma
   ↓
PostgreSQL
```

Database access should not be scattered randomly throughout controllers.

The architecture should preserve a predictable path to persistence.

------------------------------------------------------------------------

# 15. Database Architecture

PostgreSQL is the primary source of truth.

Core entities:

``` text
User
 |
 +-- Application
       |
       +-- Company
       |
       +-- Role
       |
       +-- Activity
       |
       +-- FollowUp
       |
       +-- Interview
       |
       +-- Note
       |
       +-- Connection
```

Authentication/session entities are also associated with the user.

------------------------------------------------------------------------

# 16. Core Domain Relationships

Conceptually:

``` text
User
 ├── Applications
 ├── Companies
 ├── Connections
 └── Sessions

Application
 ├── Company
 ├── Role
 ├── Activities
 ├── FollowUps
 ├── Interviews
 ├── Notes
 └── Connections
```

The exact cardinality and foreign-key behavior belong in the Database
Design document.

------------------------------------------------------------------------

# 17. Data Ownership

Every user-owned resource should have a clear ownership path.

For example:

``` text
Request
  ↓
Application ID
  ↓
Application.userId
  ↓
Current authenticated user
```

The backend must verify ownership before:

-   reading
-   updating
-   deleting

any user-owned record.

Never trust a frontend-provided user ID for authorization.

------------------------------------------------------------------------

# 18. Authentication Architecture

The previously discussed authentication direction is:

``` text
Google OAuth
     ↓
Backend
     ↓
Create / retrieve user
     ↓
Create session
     ↓
Access token + refresh mechanism
```

The application should avoid traditional password authentication for the
initial version.

------------------------------------------------------------------------

# 19. Token Strategy

The working architecture discussed for authentication is:

### Access Token

-   short-lived
-   approximately 15 minutes
-   used for API authorization
-   preferably held in application memory rather than persistent browser
    storage

### Refresh Token

-   longer-lived
-   approximately 30 days
-   stored in a secure HttpOnly cookie
-   associated with a database-backed session
-   rotated when refreshed

The exact token implementation should be finalized during security
implementation.

------------------------------------------------------------------------

# 20. Session Management

The system should support multiple devices/sessions.

Conceptually:

``` text
User
 ├── Session A
 ├── Session B
 └── Session C
```

Each session can be revoked independently.

Logout should invalidate the relevant session.

Future settings may allow the user to view/revoke active sessions.

------------------------------------------------------------------------

# 21. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to access this resource?

Every protected endpoint must enforce authorization.

Example:

``` text
GET /applications/123

Authenticated user = User A

Application 123 belongs to User B

→ 403 / not accessible
```

The exact distinction between `401` and `403` should follow the API
error standards.

------------------------------------------------------------------------

# 22. API Architecture

The backend should expose REST APIs.

Base path:

``` text
/api/v1
```

Example:

``` text
/api/v1/applications
/api/v1/applications/:id
/api/v1/followups
/api/v1/interviews
```

Versioning prevents future API changes from unexpectedly breaking
clients.

------------------------------------------------------------------------

# 23. HTTP Method Conventions

Use standard semantics:

``` text
GET     → Read
POST    → Create
PATCH   → Partial update
DELETE  → Delete
```

Example:

``` text
GET    /api/v1/applications
POST   /api/v1/applications
GET    /api/v1/applications/:id
PATCH  /api/v1/applications/:id
DELETE /api/v1/applications/:id
```

------------------------------------------------------------------------

# 24. API Response Structure

Responses should follow a consistent structure.

Example success:

``` json
{
  "data": {
    "id": "..."
  }
}
```

Example collection:

``` json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

The exact envelope can be finalized before implementation.

------------------------------------------------------------------------

# 25. API Error Structure

Errors should be machine-readable and understandable.

Example:

``` json
{
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Application not found"
  }
}
```

The frontend should use error codes where behavior depends on the type
of failure.

------------------------------------------------------------------------

# 26. Validation

Input validation should occur at the API boundary.

Examples:

-   required fields
-   valid dates
-   valid URLs
-   enum values
-   string lengths
-   pagination limits

Validation should exist independently of frontend validation.

Frontend validation improves UX.

Backend validation protects the system.

------------------------------------------------------------------------

# 27. Pagination

Application lists should support pagination.

Example:

``` text
GET /api/v1/applications?page=1&pageSize=20
```

The initial implementation can use offset pagination.

Cursor pagination does not need to be introduced unless scale or product
requirements justify it.

------------------------------------------------------------------------

# 28. Filtering and Sorting API

Example:

``` text
GET /api/v1/applications
    ?status=INTERVIEW
    &companyId=123
    &sortBy=appliedAt
    &order=desc
```

Filters should be explicitly defined rather than accepting arbitrary
database fields.

------------------------------------------------------------------------

# 29. Transaction Boundaries

Certain operations should be atomic.

Example:

``` text
Update Application Status
        +
Create Timeline Activity
```

These should occur within a database transaction.

If one operation fails, the system should avoid leaving inconsistent
state.

------------------------------------------------------------------------

# 30. Application Status Architecture

Status is part of the application domain.

A status change may have multiple consequences:

``` text
Status changed
      ↓
Application updated
      ↓
Timeline activity created
      ↓
Potential follow-up/notification logic
```

This behavior belongs in the application service rather than the React
frontend.

------------------------------------------------------------------------

# 31. Timeline Architecture

The timeline should be persisted as application activities/events.

Example:

``` text
ApplicationActivity

id
applicationId
type
occurredAt
metadata
createdAt
```

The exact schema belongs in the Database Design document.

The important architectural principle is:

> Do not reconstruct the entire history only from the current
> application status.

History should be represented explicitly.

------------------------------------------------------------------------

# 32. Background Jobs

Some operations should not depend on a user keeping the browser open.

Examples:

-   reminder generation
-   scheduled notifications
-   future email processing
-   future integrations

Architecture:

``` text
API Server
    ↓
Create Scheduled Job
    ↓
Redis / Job Queue
    ↓
Worker
    ↓
Process Job
```

The initial system can keep the worker architecture small.

------------------------------------------------------------------------

# 33. Notifications

Notification flow:

``` text
Follow-up Due
     ↓
Background Worker
     ↓
Notification Service
     ↓
Email / In-App Notification
```

The exact delivery channels can evolve.

The product should not create a large event-driven infrastructure for
simple reminders.

------------------------------------------------------------------------

# 34. Redis Usage

Redis should be used only where it provides clear value.

Possible uses:

-   job queue
-   short-lived cache
-   rate limiting
-   temporary locks

Redis should not be used as the permanent database for applications or
other critical domain data.

------------------------------------------------------------------------

# 35. File Storage

The MVP may eventually need storage for files such as:

-   resumes
-   documents
-   attachments

If file storage is introduced, files should live in object storage
rather than PostgreSQL.

Architecture:

``` text
Frontend
   ↓
Backend authorization
   ↓
Object Storage
```

The database stores metadata and references, not large binary files.

File uploads are not a core MVP dependency unless the product scope
requires them.

------------------------------------------------------------------------

# 36. Security Architecture

Security requirements include:

-   HTTPS everywhere
-   secure cookies
-   HttpOnly refresh cookies
-   appropriate SameSite configuration
-   authorization checks
-   input validation
-   rate limiting where appropriate
-   protection against common web vulnerabilities
-   safe secret management
-   no sensitive secrets committed to source control

------------------------------------------------------------------------

# 37. Sensitive Data

Potentially sensitive information includes:

-   email addresses
-   recruiter contact information
-   job-search history
-   interview notes
-   salary information
-   authentication/session data

Access must be restricted to the owning user.

Logs should avoid exposing sensitive information unnecessarily.

------------------------------------------------------------------------

# 38. Secrets Management

Secrets should be provided through environment/configuration management.

Examples:

``` text
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
JWT_SECRET / signing keys
REDIS_URL
EMAIL_PROVIDER_KEY
```

Never hard-code production secrets.

Never commit secrets to Git.

------------------------------------------------------------------------

# 39. Rate Limiting

Rate limiting should protect sensitive/high-cost endpoints.

Particularly relevant to:

-   authentication
-   token refresh
-   expensive search endpoints
-   public-facing endpoints if any are introduced

The initial implementation can keep rate limiting focused rather than
applying complicated rules everywhere.

------------------------------------------------------------------------

# 40. Observability

The system should provide enough visibility to debug production issues.

At minimum:

-   structured application logs
-   request/error logging
-   database error visibility
-   worker/job failure visibility
-   basic health checks

Potential future additions:

-   metrics
-   distributed tracing
-   error monitoring
-   performance monitoring

------------------------------------------------------------------------

# 41. Logging Principles

Logs should help answer:

-   What happened?
-   When did it happen?
-   Which request caused it?
-   Which operation failed?
-   Can the issue be reproduced?

Logs should not contain:

-   access tokens
-   refresh tokens
-   secrets
-   unnecessary personal information

------------------------------------------------------------------------

# 42. Health Checks

The backend should expose a health endpoint.

Example:

``` text
GET /health
```

It should allow deployment/infrastructure systems to determine whether
the service is functioning.

A deeper readiness check may verify required dependencies such as
PostgreSQL.

------------------------------------------------------------------------

# 43. Performance Architecture

The MVP does not require extreme optimization.

Priorities should be:

1.  efficient database queries
2.  proper indexes
3.  pagination
4.  avoiding unnecessary API calls
5.  sensible frontend caching
6.  efficient rendering

Premature caching should be avoided.

------------------------------------------------------------------------

# 44. Database Indexing

Indexes should be created based on actual access patterns.

Likely candidates include:

-   application.userId
-   application.status
-   application.appliedAt
-   followUp.userId
-   followUp.dueDate
-   interview.applicationId
-   interview.scheduledAt
-   activity.applicationId

The exact indexes belong in the database design.

------------------------------------------------------------------------

# 45. Caching

The initial MVP should not aggressively cache application data.

PostgreSQL is the source of truth.

Caching can be introduced later for:

-   expensive analytics
-   repeated read-heavy queries
-   external API results

The system should remain correct without relying on cache consistency.

------------------------------------------------------------------------

# 46. Testing Architecture

Testing should exist at multiple levels.

## Unit Tests

Test:

-   business logic
-   validation
-   utility functions
-   domain rules

## Integration Tests

Test:

-   API + database
-   authorization
-   transactions
-   application workflows

## End-to-End Tests

Test critical user journeys:

``` text
Login
 ↓
Create Application
 ↓
Open Application
 ↓
Update Status
 ↓
Create Follow-Up
 ↓
Create Interview
```

------------------------------------------------------------------------

# 47. Testing Priority

The highest-value tests should cover:

1.  authentication
2.  authorization
3.  application CRUD
4.  status changes
5.  timeline creation
6.  follow-up behavior
7.  interview behavior

Not every UI component requires extensive end-to-end coverage.

------------------------------------------------------------------------

# 48. Deployment Architecture

A simple deployment model is sufficient initially.

``` text
                 Internet
                    │
                    ▼
              Web Application
                    │
                    ▼
                API Server
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     PostgreSQL             Redis
                                │
                                ▼
                              Worker
```

The exact cloud provider can be selected based on:

-   cost
-   developer experience
-   reliability
-   managed PostgreSQL availability
-   deployment simplicity

------------------------------------------------------------------------

# 49. Environments

At minimum:

``` text
Development
Staging
Production
```

For a small MVP, staging may initially be lightweight, but production
should never be used as the development environment.

------------------------------------------------------------------------

# 50. CI/CD

The deployment pipeline should eventually perform:

``` text
Git Push
   ↓
Install Dependencies
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Build
   ↓
Integration / Relevant Tests
   ↓
Deploy
```

Production deployment should not happen if critical checks fail.

------------------------------------------------------------------------

# 51. Database Migrations

Database schema changes should be managed through Prisma migrations.

Rules:

-   migrations are committed to source control
-   production migrations are executed deliberately
-   destructive schema changes require care
-   data migrations should be separated from simple schema changes when
    appropriate

Never manually change production schema without recording the change.

------------------------------------------------------------------------

# 52. Configuration

Application configuration should be environment-specific.

Example:

``` text
.env.local
.env.test
.env.production
```

Production secrets should come from the deployment platform's secret
management rather than committed files.

------------------------------------------------------------------------

# 53. Repository Structure

A monorepo is a reasonable direction if the project contains multiple
applications/packages.

Example:

``` text
job-tracker/
│
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
│
├── packages/
│   ├── ui/
│   ├── config/
│   ├── types/
│   └── validation/
│
├── prisma/
│
├── package.json
└── turbo.json
```

Turborepo can be used to coordinate the workspace.

However, a monorepo should only be used if it genuinely improves
development. It should not be added merely because it is popular.

------------------------------------------------------------------------

# 54. Shared Packages

Potential shared packages:

## UI

Reusable frontend components.

## Types

Shared TypeScript types where appropriate.

## Validation

Shared schemas where safely reusable.

## Configuration

Shared linting, TypeScript, formatting, and build configuration.

The backend should remain the authority for security-sensitive
validation and business rules.

------------------------------------------------------------------------

# 55. API and Frontend Contract

Frontend and backend should communicate through clearly defined
contracts.

The contract should specify:

-   request structure
-   response structure
-   error structure
-   enums
-   pagination
-   filters

If an API schema tool such as OpenAPI is introduced later, it should
become the source of truth for the HTTP contract.

------------------------------------------------------------------------

# 56. Error Handling Architecture

Errors should be classified.

Examples:

``` text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
```

The backend should map internal errors to safe API responses.

Internal stack traces should not be returned to users.

------------------------------------------------------------------------

# 57. Concurrency and Consistency

Potential race conditions include:

-   two status updates
-   simultaneous follow-up completion
-   simultaneous edits
-   multiple refresh requests

The system should rely on database transactions and appropriate
constraints where necessary.

The frontend should not be treated as the authority for conflict
resolution.

------------------------------------------------------------------------

# 58. Idempotency

Idempotency should be considered for operations that may be retried,
particularly future external integrations or notification processing.

It does not need to be implemented everywhere in the MVP.

The architecture should avoid assuming every request is executed exactly
once.

------------------------------------------------------------------------

# 59. Data Lifecycle

A user's application data should remain durable.

Future capabilities may include:

-   archive
-   export
-   account deletion
-   data deletion
-   backup/recovery

Data deletion policies should be explicitly defined before exposing
permanent account deletion.

------------------------------------------------------------------------

# 60. Backup and Recovery

Production PostgreSQL should use managed backups where possible.

The system should have a recovery strategy appropriate to the expected
MVP scale.

The important principle is:

> A database backup is useful only if recovery is possible.

Recovery procedures should eventually be tested.

------------------------------------------------------------------------

# 61. Architectural Decisions

## ADR-001 --- Modular Monolith

**Decision:** Use a modular monolith for the backend.

**Reason:** The product is early-stage and domains are strongly related.

**Alternative:** Microservices.

**Rejected because:** It adds operational complexity without a current
requirement.

------------------------------------------------------------------------

## ADR-002 --- PostgreSQL

**Decision:** Use PostgreSQL as the primary database.

**Reason:** The product has strongly related relational entities and
transactional workflows.

**Alternative:** MongoDB.

**Rejected for initial product architecture:** The domain relationships
and consistency requirements fit PostgreSQL naturally.

------------------------------------------------------------------------

## ADR-003 --- Prisma

**Decision:** Use Prisma for database access.

**Reason:** Strong TypeScript developer experience and clear
schema/migration workflow.

------------------------------------------------------------------------

## ADR-004 --- REST API

**Decision:** Use REST for the initial API.

**Reason:** Simple, familiar, easy to debug, and sufficient for the
product.

**Alternative:** GraphQL.

**Rejected for MVP:** Additional complexity is not justified by current
requirements.

------------------------------------------------------------------------

## ADR-005 --- Google Authentication

**Decision:** Use Google OAuth as the initial authentication provider.

**Reason:** Reduces password-management complexity and provides a
familiar login experience.

------------------------------------------------------------------------

## ADR-006 --- Web-First

**Decision:** Build a responsive web application first.

**Reason:** Faster development and sufficient for the initial use case.

**Alternative:** Native mobile apps.

**Rejected for MVP:** Higher development and maintenance cost.

------------------------------------------------------------------------

## ADR-007 --- Background Worker

**Decision:** Use a worker process for asynchronous/scheduled tasks.

**Reason:** Reminder and notification work should not depend on an
active browser request.

------------------------------------------------------------------------

## ADR-008 --- AI Is Not an Architectural Dependency

**Decision:** AI features are optional future capabilities.

**Reason:** The product should remain useful without AI.

AI can be introduced when a validated workflow demonstrates a meaningful
need.

------------------------------------------------------------------------

# 62. Architecture Boundaries

The following boundaries should remain clear.

``` text
Frontend
   ↓
API
   ↓
Domain Services
   ↓
Database
```

External services should not be accessed randomly from UI components.

For example:

Bad:

``` text
React Component
    ↓
Google API
```

Preferred:

``` text
React
 ↓
Backend API
 ↓
Integration Service
 ↓
Google API
```

This keeps credentials and business rules on the server.

------------------------------------------------------------------------

# 63. Future Evolution

The architecture should leave room for:

### Browser Extension

``` text
Browser Extension
      ↓
Public/Auth API
      ↓
Application Creation
```

### Calendar Integration

``` text
Calendar Provider
      ↕
Integration Service
      ↕
Interview Domain
```

### Email Integration

``` text
Email Provider
      ↓
Processing
      ↓
Application / Activity
```

### AI

``` text
Application Data
      ↓
AI Service
      ↓
Suggestion / Summary
```

These should be added as isolated capabilities rather than forcing the
MVP architecture to depend on them.

------------------------------------------------------------------------

# 64. What Should Not Be Built Architecturally Yet

Avoid prematurely introducing:

-   microservices
-   Kubernetes
-   event buses
-   distributed tracing infrastructure
-   complex CQRS
-   event sourcing
-   multiple databases
-   elaborate caching layers
-   large workflow engines
-   AI orchestration infrastructure

These may be valid technologies in other contexts.

They are not justified by the current product requirements.

------------------------------------------------------------------------

# 65. MVP Technical Stack

A practical stack based on the existing project direction:

  Layer            Technology
  ---------------- ------------------------------------
  Frontend         React + TypeScript
  Styling          Tailwind CSS
  Backend          Node.js + TypeScript
  API              REST
  Database         PostgreSQL
  ORM              Prisma
  Authentication   Google OAuth + application session
  Cache/Jobs       Redis
  Worker           Node.js/TypeScript
  Monorepo         Turborepo, if useful
  Testing          Unit + Integration + E2E
  Deployment       Managed cloud services

Specific providers should be selected separately.

------------------------------------------------------------------------

# 66. End-to-End Request Example

Consider:

> User changes an application from `Applied` to `Interview`.

The flow should be:

``` text
React UI
   ↓
PATCH /api/v1/applications/:id
   ↓
Authentication Middleware
   ↓
Authorization
   ↓
Request Validation
   ↓
Application Service
   ↓
Database Transaction
   ├── Update application status
   └── Create activity
   ↓
Commit
   ↓
API Response
   ↓
Frontend updates UI
```

This is a good example of why business logic belongs in the backend.

------------------------------------------------------------------------

# 67. End-to-End Follow-Up Example

``` text
User creates follow-up
        ↓
POST /api/v1/followups
        ↓
Validate
        ↓
Verify application ownership
        ↓
Create follow-up
        ↓
Schedule reminder job
        ↓
Return response
```

Later:

``` text
Worker
   ↓
Find due follow-ups
   ↓
Create/send notification
   ↓
Record processing result
```

------------------------------------------------------------------------

# 68. End-to-End Interview Example

``` text
User creates interview
        ↓
POST /api/v1/interviews
        ↓
Validate
        ↓
Verify application ownership
        ↓
Create interview
        ↓
Create timeline activity if required
        ↓
Schedule reminder
        ↓
Return interview
```

The interview remains connected to the application.

------------------------------------------------------------------------

# 69. Development Strategy

The architecture should be implemented incrementally.

Recommended sequence:

## Phase 1 --- Foundation

-   repository setup
-   TypeScript
-   frontend
-   backend
-   PostgreSQL
-   Prisma
-   environment configuration
-   basic CI

## Phase 2 --- Authentication

-   Google OAuth
-   sessions
-   authorization middleware

## Phase 3 --- Application Core

-   companies
-   roles
-   applications
-   CRUD
-   status

## Phase 4 --- Application Context

-   timeline
-   notes
-   application details

## Phase 5 --- Actions

-   follow-ups
-   interviews

## Phase 6 --- Dashboard

-   counts
-   recent activity
-   upcoming actions

## Phase 7 --- Search & Filters

-   search
-   filtering
-   sorting
-   pagination

## Phase 8 --- Reminders

-   worker
-   Redis/job queue
-   notifications

## Phase 9 --- Hardening

-   tests
-   security
-   performance
-   observability
-   deployment

This order allows useful functionality to exist early.

------------------------------------------------------------------------

# 70. Architecture Validation Checklist

Before implementation is considered architecturally ready, verify:

### Backend

-   Is the API modular?
-   Is business logic separated from controllers?
-   Are authorization checks centralized and reliable?
-   Are transactions used where required?

### Database

-   Are relationships clear?
-   Are ownership rules clear?
-   Are important queries indexed?
-   Are migrations managed?

### Authentication

-   Is the session model defined?
-   Are refresh tokens protected?
-   Can sessions be revoked?

### Frontend

-   Is feature structure clear?
-   Is server state separated from UI state?
-   Are loading/error states handled?

### Infrastructure

-   Can the application be deployed simply?
-   Can the database be backed up?
-   Can failures be observed?

### Testing

-   Are core workflows testable?
-   Are authorization rules tested?
-   Are critical user journeys covered?

------------------------------------------------------------------------

# 71. Final Architecture

The intended MVP architecture can be summarized as:

``` text
                    ┌──────────────────┐
                    │   React Web App  │
                    └────────┬─────────┘
                             │
                           HTTPS
                             │
                             ▼
                    ┌──────────────────┐
                    │   REST API       │
                    │ Modular Monolith │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         PostgreSQL        Redis         External
         Source of        Jobs/Cache     Providers
           Truth
                             │
                             ▼
                          Worker
```

The backend domain structure is:

``` text
Auth
Users
Applications
Companies
Roles
Activities
FollowUps
Interviews
Notes
Connections
Notifications
Analytics
```

This is enough architecture for the MVP without overengineering it.

------------------------------------------------------------------------

# 72. Final Architectural Principle

The most important architectural rule for this project is:

> **Build the simplest system that can support the product well, while
> keeping the boundaries clean enough to evolve later.**

The Job Application Tracker does not need a complicated distributed
architecture.

It needs:

-   a reliable web app
-   a secure API
-   a well-designed relational database
-   clear domain modules
-   predictable background processing
-   good testing
-   simple deployment
-   room to evolve

The architecture should serve the product, not become the product.

------------------------------------------------------------------------

# 73. Next Document

The next technical artifact should be the:

**Database Design Document**

That document should turn the domain model from this architecture into
an explicit database design, including:

-   complete entities
-   fields
-   types
-   primary keys
-   foreign keys
-   relationships
-   cardinality
-   enums
-   indexes
-   constraints
-   cascade behavior
-   timestamps
-   soft-delete/archive decisions
-   Prisma schema direction
-   migration considerations
