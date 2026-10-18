# Job Application Tracker --- Testing Strategy & Quality Assurance Design

**Document Status:** Technical Design\
**Product:** Job Application Tracker\
**Scope:** Testing strategy, quality assurance, automation, and CI
validation\
**Approach:** Practical coverage focused on business-critical behavior

------------------------------------------------------------------------

## 1. Purpose

This document defines how the Job Application Tracker will be tested so
that new features can be developed quickly without repeatedly breaking
existing functionality.

The testing strategy should provide confidence in:

-   Core product workflows
-   API behavior
-   Database behavior
-   Authentication and authorization
-   Background jobs
-   Frontend interactions
-   Important business rules
-   Production deployments

The goal is not to achieve an arbitrary 100% code-coverage number.

The goal is:

> **High confidence in important behavior with a reasonable testing
> effort.**

------------------------------------------------------------------------

# 2. Testing Principles

## 2.1 Test Business-Critical Behavior First

The most important workflows are:

1.  User authentication.
2.  Creating an application.
3.  Viewing applications.
4.  Updating application status.
5.  Recording application activity.
6.  Creating and completing follow-ups.
7.  Managing interviews.
8.  Viewing application history.
9.  Dashboard information.
10. Authorization and ownership.

These should receive stronger test coverage than low-risk UI details.

------------------------------------------------------------------------

## 2.2 Prefer Tests That Give Confidence

A test should answer an important question.

Good:

``` text
Can User A access User B's application?
```

Less valuable:

``` text
Does this component have exactly five nested divs?
```

Tests should focus on behavior rather than implementation details.

------------------------------------------------------------------------

## 2.3 Test at Multiple Levels

Use different testing levels for different problems.

``` text
Unit Tests
    ↓
Integration Tests
    ↓
API Tests
    ↓
End-to-End Tests
```

Not every feature needs a large number of end-to-end tests.

------------------------------------------------------------------------

# 3. Testing Pyramid

The project should follow a practical testing pyramid.

``` text
                 ┌───────────────┐
                 │      E2E      │
                 │   Few tests   │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │ API /         │
                 │ Integration   │
                 └───────┬───────┘
                         │
              ┌──────────▼──────────┐
              │     Unit Tests      │
              │     Many tests      │
              └─────────────────────┘
```

### Unit tests

Fast and numerous.

### Integration/API tests

Verify modules and real application boundaries work together.

### E2E tests

Verify the most important user journeys.

------------------------------------------------------------------------

# 4. Test Categories

The application should use:

-   Unit tests
-   Integration tests
-   API tests
-   Database tests
-   Frontend component tests
-   End-to-end tests
-   Authentication/security tests
-   Background-job tests
-   Regression tests
-   Performance/load tests

Manual exploratory testing remains useful, especially for new UX.

------------------------------------------------------------------------

# 5. Unit Testing

Unit tests should cover isolated business logic.

Examples:

-   Status transition validation
-   Follow-up date validation
-   Interview-round calculations
-   Pagination parameter validation
-   Filter parsing
-   Sorting validation
-   Utility functions
-   Data transformation
-   Permission rules
-   Notification scheduling logic

Example:

``` text
Given:
Current status = "APPLIED"

When:
Status changes to "INTERVIEW"

Then:
The transition is accepted.
```

------------------------------------------------------------------------

# 6. Backend Unit Testing

Backend services should be testable independently of HTTP.

Example layers:

``` text
Controller
    ↓
Service
    ↓
Repository / Prisma
```

Business rules should primarily live in services/domain logic rather
than being buried inside controllers.

This makes the important logic easier to test.

------------------------------------------------------------------------

# 7. Frontend Testing

Frontend tests should focus on user-visible behavior.

Test:

-   Form validation
-   Loading states
-   Error states
-   Empty states
-   Status changes
-   Modal behavior
-   Form submission
-   Search/filter interaction
-   Pagination
-   Navigation
-   Permission-based UI behavior where applicable

Avoid testing implementation details that users cannot observe.

------------------------------------------------------------------------

# 8. Component Testing

Important reusable components should have tests when they contain
meaningful behavior.

Examples:

-   Application form
-   Status selector
-   Follow-up form
-   Interview form
-   Application list
-   Application timeline
-   Search/filter controls
-   Pagination controls

A simple presentational component may not require its own test if its
behavior is already covered through a higher-level test.

------------------------------------------------------------------------

# 9. API Testing

API tests should verify the public REST contract.

For each important endpoint, test:

### Success

-   Valid request
-   Expected response structure
-   Correct HTTP status
-   Correct persisted data

### Validation

-   Missing required fields
-   Invalid values
-   Invalid IDs
-   Invalid query parameters

### Authentication

-   No authentication
-   Expired authentication
-   Invalid authentication

### Authorization

-   Correct owner
-   Incorrect owner
-   Unauthorized resource access

### Not Found

-   Non-existent resource

### Conflict

-   Duplicate or conflicting operation where applicable

------------------------------------------------------------------------

# 10. Example API Test

For:

``` text
POST /api/v1/applications
```

Test:

``` text
Given:
Authenticated user
Valid company
Valid role

When:
POST application

Then:
201 Created
Application exists in database
Application belongs to authenticated user
Initial activity is recorded when required
```

Also test:

``` text
Unauthenticated request → 401
Invalid request → 400/422 according to API contract
Missing related entity → appropriate error
```

------------------------------------------------------------------------

# 11. Database Integration Testing

Database-related tests should verify that the application behaves
correctly with PostgreSQL.

Test:

-   Creating records
-   Updating records
-   Deleting records
-   Relations
-   Constraints
-   Unique constraints
-   Foreign keys
-   Transactions
-   Cascading behavior where configured
-   Ownership queries

The tests should use a controlled test database rather than the
development or production database.

------------------------------------------------------------------------

# 12. Test Database Strategy

A dedicated test database should be used.

Recommended flow:

``` text
Start test database
       ↓
Apply migrations
       ↓
Seed required test data
       ↓
Run tests
       ↓
Clean/reset database
```

Tests must never accidentally target production.

------------------------------------------------------------------------

# 13. Test Data

Test data should be deterministic.

Examples:

``` text
User A
User B

Company A
Company B

Role A
Role B

Application A → belongs to User A
Application B → belongs to User B
```

This makes authorization and relationship tests easier to reason about.

Avoid depending on random production-like data.

------------------------------------------------------------------------

# 14. Factories and Fixtures

Use test factories or fixtures for repeated entities.

Example:

``` text
createTestUser()
createTestCompany()
createTestRole()
createTestApplication()
createTestInterview()
createTestFollowUp()
```

Tests should be able to create only the data they need.

Avoid one enormous global fixture that every test depends on.

------------------------------------------------------------------------

# 15. Authentication Testing

Authentication is security-critical.

Test:

-   Google OAuth success flow
-   OAuth failure
-   Session creation
-   Access token validation
-   Refresh token rotation
-   Expired access token
-   Expired refresh token
-   Revoked session
-   Logout
-   Multiple sessions/devices
-   Invalid refresh token
-   Token reuse detection where implemented

The exact OAuth provider interaction may be mocked in most automated
tests, while provider integration can be covered separately.

------------------------------------------------------------------------

# 16. Authorization Testing

Every user-owned resource must be tested for ownership isolation.

Example:

``` text
User A owns Application A
User B requests Application A
```

Expected:

``` text
403 Forbidden
```

or the API's established not-found/authorization convention.

Test ownership across:

-   Applications
-   Activities
-   Follow-ups
-   Interviews
-   Notes
-   Connections
-   Notifications
-   Uploaded files

Authorization failures should never expose another user's data.

------------------------------------------------------------------------

# 17. Security Regression Tests

Security-sensitive behavior should have automated regression tests.

Examples:

-   Cross-user resource access
-   Invalid tokens
-   Revoked sessions
-   Refresh token reuse
-   Malformed input
-   Unexpected query parameters
-   File access authorization
-   Rate-limited endpoints where applicable

Whenever a security bug is fixed:

> Add a regression test so the same bug does not silently return.

------------------------------------------------------------------------

# 18. Background Job Testing

Background jobs should be tested independently from the HTTP layer.

Test:

-   Job creation
-   Job execution
-   Successful completion
-   Retry behavior
-   Failed jobs
-   Maximum retry attempts
-   Backoff
-   Duplicate job handling where required
-   Idempotency where required
-   Invalid job payloads

Example:

``` text
Follow-up due
    ↓
Reminder job created
    ↓
Worker processes job
    ↓
Notification generated
```

Each important step should have appropriate coverage.

------------------------------------------------------------------------

# 19. Notification Testing

Notification logic should test:

-   Correct recipient
-   Correct notification type
-   Correct timing
-   Duplicate prevention where required
-   Completed follow-up not generating an outdated reminder
-   Failed delivery handling

The test should verify both the generated notification and its
relationship to the source event.

------------------------------------------------------------------------

# 20. End-to-End Testing

E2E tests should represent critical user journeys.

Do not attempt to test every possible UI path through E2E.

Recommended E2E flows:

### Flow 1 --- Authentication

``` text
Open application
→ Authenticate
→ Reach dashboard
```

### Flow 2 --- Create Application

``` text
Login
→ Create application
→ Save
→ Open application
→ Verify details
```

### Flow 3 --- Track Application

``` text
Application
→ Change status
→ Add activity
→ Verify timeline
```

### Flow 4 --- Follow-Up

``` text
Application
→ Create follow-up
→ View follow-up
→ Mark completed
```

### Flow 5 --- Interview

``` text
Application
→ Add interview round
→ Update result
→ Verify history
```

These flows cover the central product loop.

------------------------------------------------------------------------

# 21. E2E Test Environment

E2E tests should run against an environment that resembles production.

Example:

``` text
Browser
   ↓
Frontend
   ↓
API
   ↓
Test PostgreSQL
   ↓
Test Redis / Worker
```

External services should be mocked or replaced with test-safe
implementations where appropriate.

------------------------------------------------------------------------

# 22. Regression Testing

Every significant bug should trigger a decision:

> Does this bug need a permanent automated test?

For important bugs, the answer should generally be yes.

Example:

``` text
Bug:
User could see another user's application.

Fix:
Add ownership validation.

Regression:
Automated authorization test.
```

This turns production incidents into permanent system knowledge.

------------------------------------------------------------------------

# 23. Contract Testing

The API contract should remain consistent between frontend and backend.

Important contract areas:

-   Request fields
-   Response fields
-   HTTP status codes
-   Error structure
-   Pagination metadata
-   Error codes

If the project introduces generated API types or an API schema later,
those can strengthen contract validation.

------------------------------------------------------------------------

# 24. Error Testing

Test expected failures as seriously as successful operations.

Examples:

``` text
Invalid application ID
Unauthorized request
Duplicate operation
Database failure
Expired session
Invalid form data
Missing required field
Invalid pagination
```

The API should return the standard error envelope defined in the API
design.

------------------------------------------------------------------------

# 25. Testing Transactions

Transaction-based operations should have tests for both success and
failure.

Example:

``` text
Create application
+
Create initial activity
```

Test:

### Success

Both records exist.

### Failure

If the second operation fails, the first operation is rolled back when
the operation is defined as atomic.

This prevents partial data.

------------------------------------------------------------------------

# 26. Performance Testing

Performance testing is not only for later.

Before major releases, test important workflows under realistic
concurrency.

Measure:

-   p50 latency
-   p95 latency
-   p99 latency
-   Error rate
-   Database load
-   Memory
-   CPU
-   Queue depth

The performance design defines the initial performance targets.

------------------------------------------------------------------------

# 27. Test Coverage Philosophy

Code coverage is useful but should not become the primary objective.

Example:

``` text
80% coverage + poor tests
```

can be worse than:

``` text
65% coverage + strong business-critical tests
```

Coverage should help identify untested areas.

Priority should be:

1.  Security
2.  Core business logic
3.  Critical workflows
4.  Data integrity
5.  Important API contracts
6.  Secondary UI behavior
7.  Low-risk implementation details

------------------------------------------------------------------------

# 28. What Should Be Mocked?

Mock external dependencies when their behavior is not the thing being
tested.

Good candidates:

-   Google OAuth provider
-   Email provider
-   External notification provider
-   Object-storage service
-   Third-party APIs

Be careful when mocking:

-   Database
-   Core business logic
-   Internal services

Over-mocking can produce tests that pass while the real system is
broken.

------------------------------------------------------------------------

# 29. Test Isolation

Tests should be independent.

A test should not rely on:

``` text
Another test running before it
```

Avoid shared mutable state.

Each test should create or receive the data it needs.

This makes tests:

-   Repeatable
-   Parallelizable
-   Easier to debug

------------------------------------------------------------------------

# 30. Test Naming

Test names should describe behavior.

Good:

``` text
allows an authenticated user to create an application
```

``` text
rejects access when another user owns the application
```

``` text
creates a reminder for an overdue follow-up
```

Avoid vague names such as:

``` text
works correctly
```

------------------------------------------------------------------------

# 31. Test Organization

A practical structure could be:

``` text
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── validation/
│
├── integration/
│   ├── database/
│   └── services/
│
├── api/
│   ├── auth/
│   ├── applications/
│   ├── followups/
│   └── interviews/
│
└── e2e/
    ├── auth/
    ├── applications/
    ├── followups/
    └── interviews/
```

The exact folder structure can follow the chosen testing framework.

------------------------------------------------------------------------

# 32. CI Testing Pipeline

The CI pipeline should progressively validate the application.

``` text
Pull Request
     ↓
Lint
     ↓
Type Check
     ↓
Unit Tests
     ↓
Integration/API Tests
     ↓
Build
     ↓
E2E Tests
     ↓
Deploy
```

Not every test suite must run at every stage if execution time becomes
excessive.

------------------------------------------------------------------------

# 33. Pull Request Quality Gates

A pull request should normally require:

-   Lint passes
-   Type checking passes
-   Unit tests pass
-   Relevant integration/API tests pass
-   Build succeeds
-   No critical security checks fail

E2E tests can be required for changes affecting critical user journeys.

------------------------------------------------------------------------

# 34. Pre-Deployment Validation

Before production deployment:

-   Tests pass
-   Build succeeds
-   Database migrations are reviewed
-   Environment configuration is valid
-   Critical E2E workflows pass
-   No known blocking regression exists

Database migrations deserve special attention because they can affect
production data.

------------------------------------------------------------------------

# 35. Production Smoke Tests

After deployment, run a small set of smoke tests.

Examples:

``` text
Application is reachable
Authentication works
Dashboard loads
Application list loads
Application creation works
```

Smoke tests should be quick and focused on detecting major deployment
failures.

------------------------------------------------------------------------

# 36. Manual QA

Automated tests do not replace manual exploration completely.

Manual testing is particularly valuable for:

-   New UX
-   Responsive layouts
-   Accessibility
-   Complex form interactions
-   Visual regressions
-   Unusual user flows
-   Browser compatibility

The goal is to automate repeatable checks while retaining human judgment
for experience quality.

------------------------------------------------------------------------

# 37. Accessibility Testing

Important accessibility checks include:

-   Keyboard navigation
-   Focus management
-   Form labels
-   Error messages
-   Semantic HTML
-   Color contrast
-   Screen-reader-friendly controls
-   Modal accessibility

Automated accessibility checks can catch common issues, but manual
verification is still valuable.

------------------------------------------------------------------------

# 38. Browser Testing

The application should initially support the major modern browsers
relevant to the target audience.

At minimum, validate the primary user flows on:

-   Chrome
-   Edge
-   Safari where relevant

Do not expand browser support indefinitely without product requirements.

------------------------------------------------------------------------

# 39. Mobile and Responsive Testing

The product may initially be desktop-first, but responsive behavior
should still be considered.

Test:

-   Application list
-   Application detail
-   Forms
-   Navigation
-   Dashboard
-   Modals

The interface should remain usable on smaller screens even if a
dedicated mobile application is not planned for MVP.

------------------------------------------------------------------------

# 40. Test Failure Investigation

When a test fails:

### Step 1

Determine whether the failure is:

-   Product bug
-   Test bug
-   Environment issue
-   Data/setup issue
-   Flaky behavior

### Step 2

Reproduce locally when possible.

### Step 3

Fix the underlying problem.

### Step 4

If the test is flaky, investigate rather than simply retrying forever.

------------------------------------------------------------------------

# 41. Flaky Test Policy

Flaky tests reduce trust in CI.

A test should not be considered acceptable merely because it passes
after multiple retries.

When a test becomes flaky:

1.  Identify the cause.
2.  Fix synchronization or isolation issues.
3.  Remove unnecessary timing assumptions.
4.  Stabilize test data.
5.  Quarantine temporarily only if necessary.
6.  Track the quarantined test until fixed.

------------------------------------------------------------------------

# 42. Test Data Safety

Tests must never use:

-   Production credentials
-   Real user data
-   Production databases
-   Real notification destinations unless intentionally controlled

Test environments should use safe credentials and isolated resources.

------------------------------------------------------------------------

# 43. Definition of Done

A feature should generally be considered complete when:

-   [ ] Functional behavior implemented.
-   [ ] Validation implemented.
-   [ ] Authorization considered.
-   [ ] Unit tests added for important business logic.
-   [ ] API/integration tests added where applicable.
-   [ ] E2E test added if the feature affects a critical user journey.
-   [ ] Error cases considered.
-   [ ] Loading/empty/error UI states handled.
-   [ ] Regression coverage added for important bugs.
-   [ ] CI passes.
-   [ ] Manual QA completed where appropriate.

------------------------------------------------------------------------

# 44. Testing Priorities for MVP

The MVP should prioritize testing in this order:

## Highest Priority

-   Authentication
-   Authorization
-   Application CRUD
-   Application ownership
-   Status updates
-   Timeline/activity
-   Follow-ups
-   Interviews
-   Database transactions
-   API validation

## Medium Priority

-   Dashboard
-   Search/filtering
-   Notifications
-   Notes
-   Connections
-   Responsive UI

## Lower Priority

-   Advanced analytics
-   Future integrations
-   Experimental features

------------------------------------------------------------------------

# 45. Final Testing Architecture

The testing strategy can be summarized as:

``` text
                 ┌────────────────────┐
                 │    E2E Tests       │
                 │ Critical Journeys  │
                 └─────────┬──────────┘
                           │
                 ┌─────────▼──────────┐
                 │ API / Integration  │
                 │ Contracts + Data   │
                 └─────────┬──────────┘
                           │
                 ┌─────────▼──────────┐
                 │    Unit Tests      │
                 │ Business Logic     │
                 └────────────────────┘

             CI validates every change
                       │
                       ▼
          ┌────────────────────────────┐
          │ Lint → Types → Tests →    │
          │ Build → E2E → Deployment  │
          └────────────────────────────┘
```

------------------------------------------------------------------------

# 46. Final Decision

The Job Application Tracker will use a **layered testing strategy**
rather than relying exclusively on unit tests or E2E tests.

The guiding principle is:

> **Test the business logic heavily, verify real boundaries with
> integration/API tests, and protect the most important user journeys
> with a small number of reliable E2E tests.**

Testing should grow with the product.

The project should not spend weeks creating an enormous test suite
before the core product exists.

Instead:

``` text
Build vertical slice
      ↓
Test vertical slice
      ↓
Use it
      ↓
Find problems
      ↓
Add regression coverage
      ↓
Continue
```

This keeps quality and development speed balanced.

------------------------------------------------------------------------

## Next Document

**Infrastructure & Deployment Design**

This document will define:

-   Development/staging/production environments
-   Cloud architecture
-   Frontend deployment
-   API deployment
-   PostgreSQL deployment
-   Redis deployment
-   Worker deployment
-   Object storage
-   Environment variables/secrets
-   Networking
-   Domains and HTTPS
-   Deployment strategy
-   Database migrations
-   Rollback strategy
-   Backups
-   Disaster recovery
-   Infrastructure security
