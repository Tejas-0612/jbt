# Job Application Tracker --- Performance & Scalability Design

**Document Status:** Technical Design\
**Product:** Job Application Tracker\
**Scope:** Performance, scalability, capacity, and resilience\
**Approach:** Pragmatic MVP-first design

------------------------------------------------------------------------

## 1. Purpose

This document defines how the Job Application Tracker should remain
fast, reliable, and scalable as usage and data grow.

The product is intentionally designed to start simple. Performance
engineering should support the product rather than introduce unnecessary
infrastructure.

The initial architecture remains:

-   React + TypeScript frontend
-   Node.js + TypeScript backend
-   REST API
-   Modular monolith
-   PostgreSQL + Prisma
-   Redis for selected caching/background-job needs
-   Worker process for asynchronous jobs
-   Cloud deployment

The goal is to build a system that performs well for the expected MVP
while leaving a clear path for future growth.

------------------------------------------------------------------------

# 2. Performance Goals

The primary goals are:

1.  Keep common user interactions fast.
2.  Keep API responses predictable.
3.  Prevent inefficient database queries.
4.  Handle growing application history without redesigning the core
    model.
5.  Keep background jobs from slowing down user-facing requests.
6.  Scale individual components only when actual usage requires it.
7.  Make performance problems observable and diagnosable.

Performance is not treated as a reason to over-engineer the MVP.

------------------------------------------------------------------------

# 3. MVP Scale Assumptions

Initial assumptions are intentionally modest.

The MVP should comfortably support:

-   Individual users.
-   Hundreds to thousands of applications per user over time.
-   Multiple activities per application.
-   Multiple interview rounds.
-   Multiple follow-ups.
-   Multiple notes and connections.
-   Normal dashboard and list usage.
-   Multiple concurrent users.

These are planning assumptions, not guaranteed capacity limits.

The architecture should allow the application and worker processes to
scale horizontally without requiring a complete architectural rewrite.

------------------------------------------------------------------------

# 4. Performance Principles

## 4.1 Measure Before Optimizing

Do not optimize based only on assumptions.

Use:

-   API latency metrics
-   Database query timing
-   Error rates
-   Queue depth
-   Resource utilization
-   Frontend performance metrics
-   Slow-query logs
-   Load tests

------------------------------------------------------------------------

## 4.2 Optimize Common Paths First

The most important paths are:

1.  Login/session restoration.
2.  Dashboard loading.
3.  Application list loading.
4.  Application detail loading.
5.  Creating/updating an application.
6.  Adding activities.
7.  Creating follow-ups.
8.  Loading interview information.

Rare administrative or background operations should not drive the
architecture.

------------------------------------------------------------------------

## 4.3 Avoid Premature Distributed Complexity

The MVP should not introduce:

-   Microservices
-   Kubernetes
-   Kafka
-   Sharding
-   CQRS
-   Event sourcing
-   Multiple databases
-   Distributed caching systems

unless real requirements justify them.

A well-designed modular monolith is sufficient initially.

------------------------------------------------------------------------

# 5. Frontend Performance

## 5.1 Bundle Management

The frontend should avoid shipping unnecessary JavaScript.

Use:

-   Tree shaking
-   Production builds
-   Code splitting
-   Lazy loading for large routes
-   Dependency review

Large features such as analytics or rich editors can be loaded only when
required.

------------------------------------------------------------------------

## 5.2 Route-Level Lazy Loading

Screens that are not immediately required should not necessarily be
loaded on the initial page.

Potential candidates:

-   Analytics
-   Contacts
-   Interview details
-   Settings
-   Other secondary screens

The dashboard and core application workflow should remain lightweight.

------------------------------------------------------------------------

## 5.3 Rendering Performance

Avoid unnecessary React re-renders.

Use appropriate techniques such as:

-   Stable component boundaries
-   Memoization when profiling shows it is useful
-   Efficient state management
-   Pagination for large lists
-   Avoiding unnecessary global state updates

Do not add memoization everywhere without evidence that it helps.

------------------------------------------------------------------------

## 5.4 API Request Management

Frontend requests should:

-   Avoid duplicate requests.
-   Cancel obsolete requests where appropriate.
-   Avoid fetching data that is not displayed.
-   Use pagination for large collections.
-   Reuse cached data when appropriate.
-   Refresh stale data deliberately.

A query/data-fetching layer can later provide consistent caching and
request deduplication.

------------------------------------------------------------------------

## 5.5 Optimistic UI

Optimistic updates may be used for low-risk actions where the expected
result is highly predictable.

Examples:

-   Updating a simple status.
-   Marking a follow-up as completed.

Do not use optimistic updates when failure could create confusing or
destructive state.

------------------------------------------------------------------------

# 6. API Performance

## 6.1 Response Time Targets

Initial engineering targets can be:

  Request Type                                Initial Target
  ------------------------- --------------------------------
  Simple read                          \< 200 ms server time
  Normal CRUD operation                \< 300 ms server time
  Complex dashboard query              \< 500 ms server time
  Background operation        Asynchronous where appropriate

These are engineering targets, not contractual guarantees.

Network latency, cloud location, cold starts, and external providers can
affect the final user-perceived time.

------------------------------------------------------------------------

## 6.2 Pagination

Large collections must not be returned in one request.

Use pagination for:

-   Applications
-   Activities
-   Follow-ups
-   Interviews
-   Connections
-   Notifications

The initial API design uses offset pagination.

Example:

``` text
GET /api/v1/applications?page=1&limit=20
```

If very large datasets eventually make offset pagination inefficient,
cursor pagination can be introduced for specific endpoints.

------------------------------------------------------------------------

## 6.3 Filtering and Sorting

Filtering and sorting should happen in the database rather than
downloading the entire dataset and processing it in the frontend.

Examples:

``` text
status
company
date
role
priority
follow-up state
```

Only supported and indexed fields should be exposed for expensive
queries.

------------------------------------------------------------------------

## 6.4 Avoid N+1 Queries

Backend code should avoid patterns such as:

1.  Fetch 50 applications.
2.  Run another query for each application.
3.  Return the combined result.

Instead, use:

-   Prisma relation queries
-   Explicit joins/relations
-   Batched queries
-   Carefully selected includes

The query shape should be designed around the API response.

------------------------------------------------------------------------

## 6.5 Select Only Required Fields

Do not automatically fetch every database column and relation.

Prefer selecting only the fields required by the endpoint.

This reduces:

-   Database work
-   Network payload
-   Serialization cost
-   Memory usage

------------------------------------------------------------------------

## 6.6 Compression

HTTP compression should be enabled where appropriate for production API
responses.

Compression is especially useful for larger JSON responses.

------------------------------------------------------------------------

# 7. Database Performance

PostgreSQL is the primary source of truth.

Database performance is therefore one of the most important areas of the
system.

------------------------------------------------------------------------

## 7.1 Indexing Strategy

Indexes should support actual query patterns.

Likely indexes include:

-   `application.user_id`
-   `application.status`
-   `application.company_id`
-   `application.role_id`
-   `application.applied_at`
-   `activity.application_id`
-   `activity.created_at`
-   `follow_up.user_id`
-   `follow_up.due_at`
-   `interview.application_id`
-   `notification.user_id`
-   `notification.created_at`

Composite indexes should be introduced when real query patterns justify
them.

Do not create indexes for every column.

------------------------------------------------------------------------

## 7.2 Query Analysis

Slow queries should be investigated using PostgreSQL query-analysis
tools such as:

``` sql
EXPLAIN
EXPLAIN ANALYZE
```

Investigate:

-   Sequential scans on large tables
-   Poor index usage
-   Expensive joins
-   Large sorts
-   Excessive rows processed
-   Repeated queries

------------------------------------------------------------------------

## 7.3 Prisma Performance

Prisma queries should be designed intentionally.

Avoid:

-   Huge nested `include` trees
-   Fetching unnecessary fields
-   Repeated queries in loops
-   Loading complete histories when only summaries are needed

Prefer:

-   `select`
-   Controlled relation loading
-   Transactions where required
-   Batched operations when appropriate

------------------------------------------------------------------------

## 7.4 Transactions

Transactions should be used where multiple writes must remain
consistent.

Example:

Creating an application and its initial activity may require a
transaction if both records must succeed or fail together.

Transactions should remain short to avoid unnecessary database locking.

------------------------------------------------------------------------

# 8. Connection Pooling

The backend must use controlled PostgreSQL connection pooling.

This becomes especially important when multiple API instances are
running.

The system should avoid creating a new uncontrolled database connection
for every request.

Connection-pool configuration should be tuned according to:

-   Database capacity
-   Number of API instances
-   Worker concurrency
-   Expected traffic

------------------------------------------------------------------------

# 9. Caching Strategy

Redis may be used for selected caching requirements.

However, PostgreSQL remains the source of truth.

## Suitable cache candidates

Potential candidates include:

-   Frequently accessed reference data
-   Expensive computed dashboard summaries
-   Short-lived temporary data
-   Rate-limiting state
-   Background job infrastructure

## Avoid unnecessary caching of

-   Core application records
-   Frequently changing application state
-   Data where invalidation is more complicated than the original query

Caching should solve a demonstrated performance problem.

------------------------------------------------------------------------

# 10. Dashboard Performance

The dashboard may combine:

-   Application counts
-   Status breakdown
-   Upcoming follow-ups
-   Upcoming interviews
-   Recent activity
-   Basic statistics

The dashboard should not trigger a large number of independent queries
unnecessarily.

Possible approaches:

-   Carefully designed aggregate queries
-   Small number of parallel queries
-   Cached expensive summaries when needed

The initial implementation should prioritize correctness and simple
query design.

If dashboard performance becomes a problem, profiling should identify
the expensive section before introducing caching.

------------------------------------------------------------------------

# 11. Search Performance

The initial search strategy should use PostgreSQL.

Support basic search across relevant fields such as:

-   Company name
-   Role title
-   Notes where appropriate

Start with PostgreSQL capabilities rather than introducing a dedicated
search engine.

A dedicated search system should only be considered if:

-   Search becomes a major product feature.
-   Dataset size becomes significantly larger.
-   Search relevance requirements become advanced.
-   PostgreSQL search is proven insufficient.

------------------------------------------------------------------------

# 12. Large Application Histories

A single user may eventually have thousands of applications and many
thousands of activities.

The system should therefore:

-   Paginate lists.
-   Paginate long activity histories.
-   Avoid loading all history at once.
-   Index foreign keys and common filters.
-   Fetch summary data separately from detailed history.

Application detail pages should load the information required for the
initial view and progressively load secondary information when
appropriate.

------------------------------------------------------------------------

# 13. Background Job Performance

Background jobs should prevent slow work from blocking API requests.

Potential asynchronous jobs include:

-   Reminder processing
-   Notification delivery
-   Scheduled follow-up checks
-   Email-related processing in future versions
-   Cleanup jobs
-   Other expensive operations

The worker should support controlled concurrency.

------------------------------------------------------------------------

## 13.1 Queue Backpressure

If jobs arrive faster than the worker can process them, queue depth will
increase.

The system should monitor:

-   Queue depth
-   Processing time
-   Failure count
-   Retry count
-   Oldest pending job

When required, worker instances can be scaled independently from API
instances.

------------------------------------------------------------------------

## 13.2 Retry Strategy

Transient failures should be retried.

Examples:

-   Temporary provider failure
-   Temporary network error
-   Database connectivity issue

Retries should use:

-   Limited attempts
-   Backoff
-   Failure tracking

Permanent failures should not retry indefinitely.

------------------------------------------------------------------------

# 14. File and Storage Performance

Files such as resumes or supporting documents should not unnecessarily
pass through the application server.

Where object storage is used, prefer:

1.  Backend generates a signed upload URL.
2.  Client uploads directly to object storage.
3.  Backend stores metadata.
4.  Client uses signed download URLs when required.

This keeps large file transfers away from the API server.

------------------------------------------------------------------------

# 15. Scaling Strategy

The system should scale incrementally.

## Stage 1 --- MVP

``` text
Frontend
   |
API Server
   |
PostgreSQL

Worker
   |
Redis
```

One API instance and one worker may be sufficient initially.

------------------------------------------------------------------------

## Stage 2 --- Growing Usage

``` text
             ┌── API Instance 1
Frontend ─── Load Balancer
             └── API Instance 2
                    |
                PostgreSQL

             ┌── Worker 1
             └── Worker 2
                    |
                  Redis
```

The API and worker can scale independently.

------------------------------------------------------------------------

## Stage 3 --- Larger Scale

Only if actual demand requires it:

-   Database optimization
-   Larger PostgreSQL instance
-   Read replicas
-   More worker capacity
-   Specialized caching
-   Dedicated search
-   Service extraction

Architecture should evolve from measured bottlenecks.

------------------------------------------------------------------------

# 16. Horizontal Scaling Requirements

For the API layer to scale horizontally:

-   Do not store important application state only in process memory.
-   Sessions/tokens must use the established authentication design.
-   Shared state should live in PostgreSQL or Redis when appropriate.
-   Uploaded files should use shared object storage.
-   Background jobs should use a shared queue.

This keeps any API instance replaceable.

------------------------------------------------------------------------

# 17. Resilience and Graceful Degradation

The application should fail gracefully when non-critical systems are
unavailable.

Examples:

### Redis unavailable

Core application CRUD should continue where possible if Redis is being
used only for optional caching.

### Notification provider unavailable

The application should record the failure and retry asynchronously
rather than blocking normal user operations.

### Background worker unavailable

User-facing CRUD should continue while jobs remain queued until workers
recover.

### Analytics calculation slow

Core application management should remain usable.

The principle is:

> A failure in a secondary capability should not unnecessarily break the
> primary job-tracking workflow.

------------------------------------------------------------------------

# 18. Load Testing

Load testing should be introduced before major scaling decisions.

Important scenarios:

1.  Many users loading application lists.
2.  Many users creating applications.
3.  Dashboard requests under concurrent load.
4.  Large application histories.
5.  Background job bursts.
6.  Notification processing.
7.  Database-heavy filtering and sorting.

Measure:

-   Requests per second
-   p50 latency
-   p95 latency
-   p99 latency
-   Error rate
-   Database CPU
-   Database connections
-   Memory
-   Queue depth

------------------------------------------------------------------------

# 19. Performance Monitoring

Performance monitoring should connect to the observability system.

Track:

### API

-   Request count
-   Response latency
-   Error rate
-   Slow endpoints

### Database

-   Query latency
-   Connection utilization
-   Slow queries
-   CPU/memory
-   Locking

### Worker

-   Job processing time
-   Queue depth
-   Failed jobs
-   Retry count

### Frontend

-   Page load performance
-   API request latency
-   JavaScript errors
-   Core user-flow performance

------------------------------------------------------------------------

# 20. Capacity Planning

Capacity planning should be based on real measurements.

Useful indicators:

-   Number of active users
-   Applications created per day
-   API requests per minute
-   Database size
-   Average activities per application
-   Queue jobs per day
-   Storage consumption

The team should periodically compare actual usage with infrastructure
capacity.

------------------------------------------------------------------------

# 21. Performance Budget

Initial budgets can be used as engineering guidelines.

Examples:

-   Avoid unnecessarily large initial JavaScript bundles.
-   Keep common API operations below their target latency.
-   Avoid unpaginated large collections.
-   Avoid database queries that process significantly more rows than
    returned.
-   Keep background jobs from blocking API requests.
-   Investigate endpoints whose p95 latency consistently exceeds the
    expected target.

Budgets should be revised as the product and user behavior become better
understood.

------------------------------------------------------------------------

# 22. Bottleneck Investigation Process

When performance degrades:

### Step 1 --- Identify the affected user flow

Example:

``` text
Application List
```

### Step 2 --- Check frontend timing

Determine whether the delay comes from rendering or the network.

### Step 3 --- Check API timing

Identify the slow endpoint.

### Step 4 --- Check database queries

Find expensive queries or excessive query counts.

### Step 5 --- Check infrastructure

Inspect CPU, memory, connections, and network.

### Step 6 --- Fix the actual bottleneck

Examples:

-   Add an appropriate index.
-   Reduce selected fields.
-   Remove N+1 queries.
-   Add pagination.
-   Cache expensive stable data.
-   Move expensive work to a worker.

### Step 7 --- Measure again

Never assume an optimization worked without measurement.

------------------------------------------------------------------------

# 23. Anti-Patterns to Avoid

Avoid:

-   Fetching every application on the dashboard.
-   Fetching complete activity history unnecessarily.
-   Running queries inside loops.
-   Caching everything.
-   Adding indexes to every column.
-   Making every operation asynchronous.
-   Introducing microservices because of theoretical scale.
-   Introducing a search engine before PostgreSQL search is
    insufficient.
-   Using Redis as the primary source of truth.
-   Scaling infrastructure before measuring the bottleneck.
-   Premature database sharding.
-   Overusing React memoization.

------------------------------------------------------------------------

# 24. Future Scaling Options

These are possible future options, not MVP requirements:

-   Cursor-based pagination
-   Read replicas
-   Advanced PostgreSQL full-text search
-   Dedicated search engine
-   CDN optimization
-   More worker instances
-   Distributed rate limiting
-   Advanced caching
-   Database partitioning
-   Service extraction
-   Event-driven architecture

Each should be introduced only when a concrete requirement exists.

------------------------------------------------------------------------

# 25. Final Performance Architecture

The intended performance architecture is:

``` text
                    ┌──────────────────┐
                    │     Browser      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Load Balancer /  │
                    │     Gateway      │
                    └────────┬─────────┘
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
          ┌──────────────┐      ┌──────────────┐
          │ API Instance │      │ API Instance │
          │      1       │      │      2       │
          └──────┬───────┘      └──────┬───────┘
                 │                     │
                 └──────────┬──────────┘
                            ▼
                     ┌──────────────┐
                     │ PostgreSQL   │
                     └──────────────┘

              ┌──────────────────────┐
              │        Redis         │
              │ Cache / Queue State  │
              └──────────┬───────────┘
                         │
                ┌────────▼─────────┐
                │     Workers      │
                └──────────────────┘

              ┌──────────────────────┐
              │    Object Storage   │
              │   Resume / Files    │
              └──────────────────────┘
```

This architecture keeps the primary workflow simple while allowing
independent scaling of API servers and background workers.

------------------------------------------------------------------------

# 26. Implementation Checklist

Before considering performance work complete:

-   [ ] API pagination implemented.
-   [ ] Common database queries indexed.
-   [ ] N+1 query patterns avoided.
-   [ ] Prisma queries use appropriate field selection.
-   [ ] Database connection pooling configured.
-   [ ] Dashboard queries reviewed.
-   [ ] Large histories paginated.
-   [ ] Background jobs separated from user-facing requests.
-   [ ] Worker concurrency controlled.
-   [ ] Retry and backoff implemented for transient jobs.
-   [ ] Redis used only where justified.
-   [ ] File uploads use appropriate storage architecture.
-   [ ] API performance metrics available.
-   [ ] Database slow-query monitoring available.
-   [ ] Queue metrics available.
-   [ ] Basic load testing performed before significant scaling.
-   [ ] Performance bottlenecks measured before optimization.
-   [ ] No unnecessary distributed infrastructure introduced.

------------------------------------------------------------------------

# 27. Final Decision

The Job Application Tracker will use a **performance-conscious modular
monolith**.

The initial strategy is:

> **Optimize the database, paginate large data, keep API requests
> lightweight, move slow work to workers, measure real bottlenecks, and
> scale only when necessary.**

The system should be capable of growing without forcing premature
architectural complexity.

Performance is treated as an engineering discipline, not as a reason to
over-engineer the MVP.

------------------------------------------------------------------------

## Next Document

**Testing Strategy & Quality Assurance Design**

This document will define:

-   Unit testing
-   Integration testing
-   API testing
-   Frontend testing
-   End-to-end testing
-   Database testing
-   Authentication testing
-   Background-job testing
-   Test data strategy
-   Mocking strategy
-   CI test pipeline
-   Coverage philosophy
-   Quality gates
