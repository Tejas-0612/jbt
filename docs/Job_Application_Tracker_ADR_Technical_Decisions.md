# Job Application Tracker --- Architectural Decision Records (ADR)

**Document Status:** Technical Design\
**Product:** Job Application Tracker\
**Scope:** Important architectural and technical decisions\
**Purpose:** Preserve why major decisions were made and prevent repeated
architectural debates

------------------------------------------------------------------------

# 1. What Is an ADR?

An Architectural Decision Record documents an important technical
decision, the context behind it, alternatives considered, and the
consequences.

The purpose is not to document every coding choice.

An ADR should answer:

> **What did we decide, why did we decide it, and what trade-off did we
> accept?**

This is especially useful when the project grows and the original
reasoning is no longer fresh.

------------------------------------------------------------------------

# 2. ADR Format

Each decision follows this structure:

``` text
Status
Context
Decision
Alternatives
Consequences
```

Possible statuses:

-   Accepted
-   Proposed
-   Superseded
-   Deprecated

------------------------------------------------------------------------

# ADR-001 --- Use a Modular Monolith

**Status:** Accepted

## Context

The Job Application Tracker is an early-stage product with a small
engineering team and a relatively focused domain.

The system needs clear separation between areas such as:

-   Applications
-   Companies
-   Roles
-   Activities
-   Follow-ups
-   Interviews
-   Connections
-   Notifications
-   Authentication

However, the product does not initially have the scale or organizational
complexity that would justify independent services.

## Decision

Use a **modular monolith** as the initial backend architecture.

Conceptually:

``` text
Backend
├── auth
├── applications
├── companies
├── roles
├── activities
├── followups
├── interviews
├── connections
├── notifications
└── common
```

Modules should have clear responsibilities and boundaries even though
they run inside one deployable backend.

## Alternatives Considered

### Microservices

Rejected for MVP because they would introduce:

-   More deployments
-   Network communication
-   Distributed debugging
-   Service discovery
-   More infrastructure
-   Greater operational overhead

### Completely unstructured monolith

Rejected because it can become difficult to maintain as features grow.

## Consequences

### Benefits

-   Simple deployment
-   Simple local development
-   Easy transactions
-   Lower infrastructure overhead
-   Clear internal boundaries

### Trade-off

Some modules may eventually need to be extracted into services if real
scaling or organizational requirements justify it.

------------------------------------------------------------------------

# ADR-002 --- Use React + TypeScript for the Frontend

**Status:** Accepted

## Context

The product is highly interactive and contains:

-   Forms
-   Tables
-   Filters
-   Timelines
-   Dashboards
-   Modals
-   Application workflows

The developer already has experience with React and TypeScript.

## Decision

Use **React + TypeScript** for the web frontend.

## Alternatives Considered

Possible alternatives included:

-   Vue
-   Angular
-   Server-rendered application
-   Other frontend frameworks

React provides a strong ecosystem and aligns with the existing
development skill set.

## Consequences

### Benefits

-   Familiar development model
-   Strong TypeScript support
-   Large ecosystem
-   Reusable components
-   Good support for complex application interfaces

### Trade-off

Frontend architecture needs discipline to avoid excessive state
complexity and unnecessary abstractions.

------------------------------------------------------------------------

# ADR-003 --- Use Node.js + TypeScript for the Backend

**Status:** Accepted

## Context

The frontend already uses TypeScript and the product is being developed
by a small team.

Using TypeScript across the stack reduces context switching.

## Decision

Use **Node.js + TypeScript** for the backend API and worker processes.

## Alternatives Considered

-   Java
-   Python
-   Go
-   Other backend platforms

These remain technically viable but provide less benefit for the initial
team/context.

## Consequences

### Benefits

-   Shared language across frontend/backend
-   Shared types and utilities where appropriate
-   Strong ecosystem
-   Good support for REST APIs and background workers

### Trade-off

The team must maintain clear module boundaries and avoid allowing a
large Node.js codebase to become tightly coupled.

------------------------------------------------------------------------

# ADR-004 --- Use PostgreSQL as the Primary Database

**Status:** Accepted

## Context

The product contains strongly related entities:

``` text
User
Company
Role
Application
Activity
FollowUp
Interview
Connection
Notification
```

The system needs relationships, transactions, constraints, and reliable
persistence.

## Decision

Use **PostgreSQL** as the primary source of truth.

## Alternatives Considered

### MongoDB

Could work for some product data, but PostgreSQL provides stronger
relational modeling and constraints for the current domain.

### Multiple databases

Rejected because the MVP does not justify additional operational
complexity.

## Consequences

-   Strong relational integrity
-   Transactions
-   Mature indexing/query capabilities
-   Good long-term scalability

PostgreSQL remains the authoritative data store even when Redis or
object storage is introduced.

------------------------------------------------------------------------

# ADR-005 --- Use Prisma as the ORM

**Status:** Accepted

## Context

The backend is TypeScript-based and the product has a relational
PostgreSQL model.

## Decision

Use **Prisma** for database access and schema management.

## Alternatives Considered

-   Drizzle
-   TypeORM
-   Raw SQL
-   Other ORMs

Raw SQL remains appropriate for specialized queries when necessary.

## Consequences

### Benefits

-   Strong TypeScript integration
-   Schema-driven development
-   Developer productivity
-   Migration tooling
-   Safer common database access

### Trade-off

Developers must still understand SQL and PostgreSQL behavior rather than
treating the ORM as a replacement for database knowledge.

------------------------------------------------------------------------

# ADR-006 --- Use REST for the API

**Status:** Accepted

## Context

The product has clear resource-oriented operations:

``` text
applications
companies
roles
activities
followups
interviews
connections
notifications
```

The API is primarily consumed by the web frontend.

## Decision

Use a **REST API**.

Base path:

``` text
/api/v1
```

## Alternatives Considered

### GraphQL

GraphQL could provide flexible querying but introduces additional schema
and operational complexity that is not required for the MVP.

### tRPC

Could provide strong type safety but creates tighter coupling between
frontend and backend and is less aligned with the established REST
direction.

## Consequences

-   Simple resource-oriented API
-   Clear HTTP semantics
-   Easier external integration in the future
-   Straightforward debugging

------------------------------------------------------------------------

# ADR-007 --- Version the API

**Status:** Accepted

## Context

API contracts may evolve as the product grows.

Breaking API changes should not unexpectedly break clients.

## Decision

Use versioned API paths:

``` text
/api/v1/...
```

Future breaking changes can use:

``` text
/api/v2/...
```

## Consequences

API evolution becomes more controlled.

The trade-off is that old API versions may need to be supported
temporarily.

------------------------------------------------------------------------

# ADR-008 --- Use PATCH for Partial Updates

**Status:** Accepted

## Context

Many resources will require updating only part of their state.

Examples:

-   Application status
-   Follow-up completion
-   Interview result
-   Notes

## Decision

Use HTTP `PATCH` for partial updates.

Example:

``` text
PATCH /api/v1/applications/:id
```

## Consequences

The API more clearly communicates partial-update semantics.

------------------------------------------------------------------------

# ADR-009 --- Use Standard API Response and Error Structures

**Status:** Accepted

## Context

The frontend needs predictable API behavior.

Different endpoints should not invent unrelated response formats.

## Decision

Use consistent success and error envelopes.

Conceptual success:

``` json
{
  "data": {},
  "meta": {}
}
```

Conceptual error:

``` json
{
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Application not found"
  }
}
```

Errors should contain machine-readable codes.

## Consequences

-   Easier frontend handling
-   Easier debugging
-   More predictable integrations

The exact response schema remains subject to the API Design document.

------------------------------------------------------------------------

# ADR-010 --- Use Offset Pagination Initially

**Status:** Accepted

## Context

Application lists and similar collections need pagination.

The expected MVP data size does not justify immediately implementing
complex cursor infrastructure.

## Decision

Use offset pagination initially.

Example:

``` text
?page=1&limit=20
```

## Alternatives Considered

### Cursor pagination

More efficient for very large/changing datasets but more complex.

## Consequences

Offset pagination is simple and appropriate for the initial product.

If large datasets create measurable performance problems, cursor
pagination can be introduced for specific endpoints.

------------------------------------------------------------------------

# ADR-011 --- Use Google OAuth for Authentication

**Status:** Accepted

## Context

The product does not require a complex username/password authentication
system for MVP.

The desired experience is simple sign-in.

## Decision

Use **Google OAuth** as the primary authentication provider.

Password authentication is not required for the initial architecture.

## Consequences

### Benefits

-   Simple sign-in experience
-   No password storage
-   Reduced password-reset complexity
-   Lower authentication surface area

### Trade-off

The system depends on an external identity provider.

The authentication layer should therefore use a provider abstraction
where practical.

------------------------------------------------------------------------

# ADR-012 --- Use Short-Lived Access Tokens and Rotating Refresh Sessions

**Status:** Accepted

## Context

The API needs authenticated requests while limiting the impact of stolen
credentials.

## Decision

Use:

-   Short-lived access token
-   Longer-lived refresh session
-   Refresh token stored in an HttpOnly + Secure cookie
-   Refresh sessions stored server-side
-   Refresh token rotation
-   Session revocation on logout

Initial target:

``` text
Access token: ~15 minutes
Refresh session: ~30 days
```

These values are configuration targets and may change.

## Consequences

### Benefits

-   Reduced access-token exposure window
-   Server-side session revocation
-   Multi-device session support

### Trade-off

Authentication becomes more complex than a single long-lived JWT.

------------------------------------------------------------------------

# ADR-013 --- Support Multiple Sessions per User

**Status:** Accepted

## Context

A user may access the product from:

-   Laptop
-   Desktop
-   Browser
-   Other devices

The product should not require a single global session.

## Decision

Store refresh sessions independently so users can have multiple active
sessions.

## Consequences

The system can later support:

-   Session lists
-   Individual session revocation
-   Logout from another device

------------------------------------------------------------------------

# ADR-014 --- Enforce Resource Ownership on the Backend

**Status:** Accepted

## Context

The product contains user-owned data.

Frontend hiding is not sufficient for security.

## Decision

Every protected resource query must verify ownership/authorization on
the backend.

Conceptually:

``` text
Authenticated User
       ↓
Resource ID
       ↓
Ownership / Permission Check
       ↓
Allow or Reject
```

## Consequences

This adds authorization logic to backend operations but prevents clients
from bypassing UI restrictions.

------------------------------------------------------------------------

# ADR-015 --- Use Redis for Selected Infrastructure Needs

**Status:** Accepted

## Context

Some capabilities require short-lived state and asynchronous processing.

Potential needs include:

-   Job queues
-   Temporary cache
-   Rate limiting
-   Short-lived coordination

## Decision

Use Redis selectively.

Redis is **not** the source of truth for core application records.

PostgreSQL remains authoritative.

## Consequences

Redis can improve background processing and selected performance cases
without making the application dependent on cache state for core data.

------------------------------------------------------------------------

# ADR-016 --- Separate Background Work from API Requests

**Status:** Accepted

## Context

Some operations should not block normal user requests.

Examples:

-   Notifications
-   Follow-up reminders
-   Cleanup
-   Future external integrations

## Decision

Use a worker process and queue for asynchronous work.

``` text
API
 ↓
Queue
 ↓
Worker
```

## Consequences

### Benefits

-   Better user-facing latency
-   Retry capability
-   Independent worker scaling

### Trade-off

The system becomes asynchronous in selected areas and requires job
monitoring.

------------------------------------------------------------------------

# ADR-017 --- Use Object Storage for User Files

**Status:** Accepted

## Context

Users may upload resumes or other documents.

Storing files directly on application-server disks makes scaling and
recovery harder.

## Decision

Use private object storage for uploaded files.

The API stores metadata in PostgreSQL.

Where practical, use signed URLs for uploads/downloads.

## Consequences

-   API servers remain stateless
-   File storage can scale independently
-   Access control remains enforceable

------------------------------------------------------------------------

# ADR-018 --- Build in Vertical Slices

**Status:** Accepted

## Context

The project previously accumulated a large amount of planning and
documentation before enough working software existed.

The product needs a development approach that keeps planning connected
to actual implementation.

## Decision

Build features end-to-end in vertical slices.

Example:

``` text
Application Creation
    ↓
Frontend
    ↓
API
    ↓
Service
    ↓
Database
    ↓
Tests
```

Then move to the next workflow.

## Consequences

### Benefits

-   Working software appears earlier
-   Architecture is validated through implementation
-   Problems are discovered sooner
-   Less speculative planning

### Trade-off

Some infrastructure may initially be less generalized than it could
become later.

------------------------------------------------------------------------

# ADR-019 --- Manual First, Automation Later

**Status:** Accepted

## Context

The product may eventually include:

-   Browser extension
-   Email integration
-   Calendar integration
-   Automated tracking
-   AI assistance

However, these features can add complexity before the core workflow is
validated.

## Decision

Start with manual workflows.

Automate only after the manual workflow demonstrates a real repetitive
problem.

## Consequences

The MVP is simpler.

Future automation can be designed around observed user behavior instead
of assumptions.

------------------------------------------------------------------------

# ADR-020 --- AI Is Not a Core MVP Dependency

**Status:** Accepted

## Context

AI could potentially provide:

-   Resume assistance
-   Job matching
-   Follow-up drafting
-   Interview preparation
-   Application insights

However, adding AI before validating the underlying product problem
risks creating unnecessary complexity.

## Decision

AI is deferred from the core MVP.

AI may be introduced later where it solves a clearly identified user
problem.

## Consequences

The MVP remains simpler and cheaper to operate.

The architecture should still allow future AI capabilities to integrate
without making the entire product AI-dependent.

------------------------------------------------------------------------

# ADR-021 --- Browser Extension Is Deferred

**Status:** Accepted

## Context

A browser extension could help capture jobs from job boards.

However, extension development introduces:

-   Separate distribution
-   Browser compatibility
-   Permissions
-   Additional maintenance
-   More complex release processes

## Decision

Do not make the browser extension an MVP dependency.

Build the core application workflow first.

## Consequences

Job capture remains manual initially.

A browser extension can later be added as a separate capability.

------------------------------------------------------------------------

# ADR-022 --- Native Mobile App Is Deferred

**Status:** Accepted

## Context

A mobile app could eventually improve accessibility and notifications.

However, maintaining another application platform increases development
and testing requirements.

## Decision

Use a responsive web application initially.

Defer native mobile development.

## Consequences

The team focuses on one primary application.

Mobile-native development can be reconsidered after validating demand.

------------------------------------------------------------------------

# ADR-023 --- Avoid Premature Microservices

**Status:** Accepted

## Context

The product may eventually grow significantly, but current requirements
do not justify distributed services.

## Decision

Do not introduce microservices until a concrete problem requires them.

Possible future triggers:

-   Independent scaling requirements
-   Independent deployment needs
-   Clear organizational ownership boundaries
-   Strong isolation requirements

## Consequences

The initial system remains easier to operate.

The modular monolith must maintain clean internal boundaries to preserve
future extraction options.

------------------------------------------------------------------------

# ADR-024 --- Avoid Premature Kubernetes

**Status:** Accepted

## Context

Kubernetes can solve large-scale orchestration problems but introduces
substantial operational complexity.

## Decision

Do not use Kubernetes for the initial deployment.

Use managed application/container hosting.

## Consequences

Infrastructure remains simpler.

Kubernetes can be reconsidered only if deployment or scaling
requirements make it worthwhile.

------------------------------------------------------------------------

# ADR-025 --- PostgreSQL First for Search

**Status:** Accepted

## Context

The product needs basic search across application-related information.

A dedicated search engine would add operational complexity.

## Decision

Start with PostgreSQL search capabilities.

Consider a dedicated search system only if real search requirements
exceed PostgreSQL's capabilities.

## Consequences

Search is simpler initially.

Advanced relevance/search infrastructure can be introduced later.

------------------------------------------------------------------------

# ADR-026 --- Use Managed Infrastructure Where Practical

**Status:** Accepted

## Context

The product is being built by a small team.

Operating databases, Redis clusters, storage infrastructure, and complex
networking independently would consume engineering time without
providing enough early value.

## Decision

Prefer managed services for:

-   PostgreSQL
-   Redis
-   Object storage
-   Frontend hosting
-   Backend deployment where appropriate

## Consequences

### Benefits

-   Lower operational burden
-   Easier backups
-   Easier scaling
-   Faster deployment

### Trade-off

Greater dependency on cloud/service providers and their
pricing/features.

------------------------------------------------------------------------

# ADR-027 --- Keep PostgreSQL as the Source of Truth

**Status:** Accepted

## Context

The architecture contains multiple supporting systems:

-   Redis
-   Object storage
-   Background queues
-   Potential future integrations

There must be one authoritative source for application data.

## Decision

PostgreSQL is the authoritative source for structured product data.

Redis and other infrastructure components must not become the canonical
source for core application state.

## Consequences

The system has a clear data ownership model.

------------------------------------------------------------------------

# ADR-028 --- Use Observability Before Performance Optimization

**Status:** Accepted

## Context

Performance problems are difficult to solve reliably without
measurements.

## Decision

Use metrics, structured logs, tracing where appropriate, and database
monitoring to identify bottlenecks before optimizing.

## Consequences

Performance work becomes evidence-driven rather than based on
assumptions.

------------------------------------------------------------------------

# ADR-029 --- Testing Strategy Uses a Practical Pyramid

**Status:** Accepted

## Context

Testing every behavior through E2E would make the test suite slow and
expensive.

Testing only units would miss integration problems.

## Decision

Use:

``` text
Many unit tests
     ↓
Integration/API tests
     ↓
Fewer critical E2E tests
```

Security and core business logic receive higher testing priority.

## Consequences

The project balances confidence with development speed.

------------------------------------------------------------------------

# ADR-030 --- Performance Optimization Is Incremental

**Status:** Accepted

## Context

The expected MVP scale does not justify designing for extreme scale.

## Decision

Start with:

-   Good database indexes
-   Pagination
-   Efficient Prisma queries
-   Background workers
-   Basic caching where justified
-   Monitoring

Scale further only when actual measurements justify it.

## Consequences

Infrastructure remains simpler while retaining a path toward larger
scale.

------------------------------------------------------------------------

# 3. Deferred Decisions

Some decisions should remain intentionally open.

These include:

-   Exact cloud provider
-   Exact frontend hosting provider
-   Exact CI/CD provider
-   Exact Redis provider
-   Exact object-storage provider
-   Cursor pagination
-   Dedicated search engine
-   Read replicas
-   Multi-region deployment
-   Native mobile application
-   Browser extension
-   AI features
-   Microservice extraction
-   Advanced event-driven architecture

These should be decided when the corresponding requirement becomes real.

------------------------------------------------------------------------

# 4. Decision-Making Rules

Future architectural decisions should follow these principles.

## 4.1 Start With the Problem

Ask:

> What problem are we actually solving?

Do not introduce technology merely because it is popular.

------------------------------------------------------------------------

## 4.2 Prefer the Simplest Sufficient Solution

If PostgreSQL solves the problem, do not immediately introduce another
database.

If a modular monolith solves the problem, do not introduce
microservices.

If a worker solves the problem, do not introduce a distributed event
platform.

------------------------------------------------------------------------

## 4.3 Consider Reversibility

Prefer decisions that are easy to change when uncertainty is high.

Example:

``` text
PostgreSQL search
```

is easier to adopt initially than committing the entire architecture to
a dedicated search platform.

------------------------------------------------------------------------

## 4.4 Record Important Trade-offs

A decision is incomplete if only the benefit is recorded.

Document:

-   What becomes easier?
-   What becomes harder?
-   What are we giving up?
-   What would cause us to reconsider?

------------------------------------------------------------------------

# 5. Architectural Decision Summary

  Area                Decision
  ------------------- ------------------------------------------------
  Architecture        Modular monolith
  Frontend            React + TypeScript
  Backend             Node.js + TypeScript
  Database            PostgreSQL
  ORM                 Prisma
  API                 REST
  API versioning      `/api/v1`
  Partial updates     PATCH
  Pagination          Offset initially
  Authentication      Google OAuth
  Sessions            Short-lived access + rotating refresh sessions
  Authorization       Backend ownership checks
  Cache/queue         Redis
  Background work     Separate worker
  File storage        Private object storage
  Search              PostgreSQL initially
  Testing             Unit + integration/API + critical E2E
  Deployment          Managed infrastructure
  Scaling             Incremental
  AI                  Deferred from MVP
  Browser extension   Deferred
  Native mobile       Deferred
  Microservices       Deferred
  Kubernetes          Deferred

------------------------------------------------------------------------

# 6. Architecture Evolution Rule

An important principle for this project is:

> **A future technology should be introduced because the current
> architecture has demonstrated a limitation, not because the technology
> might eventually be useful.**

Examples:

``` text
Need faster search
    ↓
Measure PostgreSQL search
    ↓
If insufficient
    ↓
Evaluate dedicated search
```

and:

``` text
Need independent scaling
    ↓
Measure modular monolith
    ↓
Identify bounded module
    ↓
Evaluate service extraction
```

This keeps architecture driven by evidence.

------------------------------------------------------------------------

# 7. ADR Maintenance

ADRs should be updated when decisions materially change.

When a decision changes:

1.  Do not silently rewrite history.
2.  Mark the old ADR as superseded.
3.  Create a new ADR.
4.  Explain why the decision changed.
5.  Link the old and new decisions.

Example:

``` text
ADR-001 Modular Monolith
        ↓
Superseded by
        ↓
ADR-040 Extract Notification Service
```

This preserves architectural history.

------------------------------------------------------------------------

# 8. Final Architectural Philosophy

The overall architectural philosophy is:

``` text
Simple
   ↓
Modular
   ↓
Measured
   ↓
Tested
   ↓
Observable
   ↓
Scalable when necessary
```

The architecture should remain understandable to a small engineering
team.

Complexity is introduced only when it provides clear value.

------------------------------------------------------------------------

# 9. Final Decision

The Job Application Tracker will follow a **pragmatic, evidence-driven
architecture strategy**.

The most important architectural rule is:

> **Do not build for imaginary scale or imaginary requirements. Build a
> clean system for today's real requirements while preserving sensible
> paths for tomorrow's needs.**

The project should prioritize:

-   Working software
-   Clear boundaries
-   Strong data integrity
-   Security
-   Testing
-   Observability
-   Simple deployment
-   Incremental evolution

This ADR collection becomes the architectural memory of the project.

------------------------------------------------------------------------

## Next Document

**Future Evolution & Technical Roadmap**

This document will define:

-   What comes after MVP
-   Browser extension
-   Email/calendar integrations
-   AI capabilities
-   Advanced analytics
-   Automation
-   Mobile
-   Search improvements
-   Scaling milestones
-   Architecture evolution triggers
-   What should remain intentionally deferred
