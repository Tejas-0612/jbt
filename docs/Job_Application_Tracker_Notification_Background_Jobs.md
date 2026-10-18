# Job Application Tracker --- Notification & Background Jobs Design

**Document Type:** Technical Design\
**Product:** Job Application Tracker\
**Status:** Working Design\
**Position in Documentation Chain:** Product Discovery → PRD → UX →
System Architecture → Database Design → API Design → Authentication &
Security → Notification & Background Jobs

------------------------------------------------------------------------

## 1. Purpose

This document defines how the Job Application Tracker handles work that
should happen **outside the user's immediate API request**.

Examples include:

-   Follow-up reminders
-   Interview reminders
-   Creating notifications
-   Sending email notifications
-   Scheduling future jobs
-   Retrying failed background work
-   Processing asynchronous tasks

The goal is to keep the application responsive while making scheduled
and background operations reliable.

------------------------------------------------------------------------

# 2. Design Goals

The background-job system should be:

1.  **Reliable** --- jobs should not silently disappear.
2.  **Idempotent** --- retries must not create duplicate side effects.
3.  **Observable** --- failures and queue health must be visible.
4.  **Simple** --- avoid distributed systems complexity for the MVP.
5.  **Scalable** --- allow additional workers later.
6.  **Source-of-truth driven** --- PostgreSQL remains authoritative for
    business state.
7.  **Timezone-aware** --- reminders should respect the user's timezone.

------------------------------------------------------------------------

# 3. Core Principle

The API should handle work that must happen immediately.

The worker should handle work that can happen asynchronously or in the
future.

### Synchronous

``` text
User
  ↓
Frontend
  ↓
API
  ↓
PostgreSQL
  ↓
Response
```

Example:

> User creates an application.

The API creates the application and immediately responds.

### Asynchronous

``` text
User
  ↓
Frontend
  ↓
API
  ↓
PostgreSQL
  ↓
Redis / Job Queue
  ↓
Worker
  ↓
Action
```

Example:

> Remind the user about a follow-up tomorrow at 10:00 AM.

There is no reason for the API request to remain open until tomorrow.

------------------------------------------------------------------------

# 4. High-Level Architecture

``` text
                    ┌─────────────────┐
                    │     Frontend    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │       API       │
                    └───────┬─────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
        ┌─────────────────┐   ┌─────────────────┐
        │   PostgreSQL    │   │ Redis / Queue   │
        │ Source of Truth │   │ Scheduled Jobs  │
        └─────────────────┘   └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │     Worker      │
                              └────────┬────────┘
                                       │
                         ┌─────────────┼─────────────┐
                         ▼             ▼             ▼
                  PostgreSQL      Email Provider   Other
```

------------------------------------------------------------------------

# 5. Technology Direction

Recommended MVP architecture:

-   **PostgreSQL** --- business state and notification records
-   **Redis** --- queue, delayed jobs, temporary job state
-   **BullMQ or equivalent Redis-backed queue** --- job management
-   **Node.js worker** --- background processing
-   **Email provider abstraction** --- provider can be replaced later

The exact queue library is an implementation decision. The architectural
requirement is a reliable Redis-backed job queue.

------------------------------------------------------------------------

# 6. What PostgreSQL Owns

PostgreSQL remains the source of truth for:

-   Applications
-   Follow-ups
-   Interviews
-   Users
-   User timezone/preferences
-   Notifications
-   Reminder state
-   Business status

Redis should **not** become the authoritative source for whether a
follow-up or interview exists.

If Redis is temporarily unavailable, business data must remain safe.

------------------------------------------------------------------------

# 7. What Redis / Queue Owns

The queue is responsible for:

-   Delaying jobs
-   Delivering jobs to workers
-   Tracking active jobs
-   Retrying transient failures
-   Controlling concurrency
-   Holding temporary execution state

Example:

``` text
follow-up due:
2026-10-10 10:00 UTC

        ↓

queue job:
FOLLOWUP_REMINDER

        ↓

worker executes near due time
```

------------------------------------------------------------------------

# 8. Job Types

The system should use explicit job types.

Example:

``` text
FOLLOWUP_REMINDER
INTERVIEW_REMINDER
SEND_NOTIFICATION
SEND_EMAIL
```

Future jobs may include:

``` text
SYNC_CALENDAR
PROCESS_EMAIL
IMPORT_APPLICATION
GENERATE_REPORT
```

These should only be introduced when an actual product requirement
exists.

------------------------------------------------------------------------

# 9. Job Payload Design

A job should contain the minimum information needed to identify the
work.

Prefer:

``` json
{
  "jobType": "FOLLOWUP_REMINDER",
  "followUpId": "123",
  "userId": "456"
}
```

Avoid placing large or sensitive objects directly inside the queue
payload.

The worker should fetch current data from PostgreSQL.

### Why?

Consider this situation:

1.  Follow-up is scheduled for Friday.
2.  User changes it to Monday.
3.  Old job is still present in the queue.
4.  Worker executes the old job.

If the worker trusts the old payload, the user could receive an
incorrect reminder.

Instead:

``` text
Worker receives job
        ↓
Fetch current follow-up
        ↓
Check current status/due time
        ↓
Decide whether action is still valid
```

PostgreSQL remains authoritative.

------------------------------------------------------------------------

# 10. Follow-Up Reminder Flow

``` text
User creates follow-up
        ↓
API validates request
        ↓
Follow-up saved in PostgreSQL
        ↓
Reminder job scheduled
        ↓
Job waits until scheduled time
        ↓
Worker receives job
        ↓
Worker fetches follow-up
        ↓
Is it still pending?
        │
     ┌──┴──┐
    Yes    No
     │      │
     ▼      ▼
Continue   Stop
     │
     ▼
Create notification
     │
     ▼
Send configured channel
     │
     ▼
Mark notification/job successful
```

------------------------------------------------------------------------

# 11. Interview Reminder Flow

Interview reminders follow the same general pattern.

``` text
Interview created
        ↓
Interview saved
        ↓
Reminder jobs scheduled
        ↓
Worker executes reminder
        ↓
Check interview still exists
        ↓
Check interview is still relevant
        ↓
Create/send notification
```

The system should not assume that an interview remains unchanged.

If an interview is cancelled or rescheduled, the old reminder must
become harmless.

------------------------------------------------------------------------

# 12. Reminder Timing

The exact reminder schedule should be configurable.

Possible defaults:

-   Follow-up reminder at its scheduled time
-   Interview reminder 24 hours before
-   Interview reminder 1 hour before

These are product decisions and should remain configurable rather than
being deeply hard-coded.

------------------------------------------------------------------------

# 13. Timezone Handling

All persisted timestamps should be stored in **UTC**.

The user should have a timezone preference.

Example:

``` text
Database:
2026-10-10T04:30:00Z

User timezone:
Asia/Kolkata

Displayed:
2026-10-10 10:00 AM
```

The backend should perform timezone-aware conversion when scheduling
reminders.

### Important rule

Never assume the server's timezone is the user's timezone.

------------------------------------------------------------------------

# 14. Notification Model

A notification should represent an actual user-facing notification.

Conceptually:

``` text
Notification
-------------
id
userId
type
channel
title
message
status
scheduledAt
sentAt
readAt
relatedEntityType
relatedEntityId
idempotencyKey
failureReason
createdAt
updatedAt
```

The exact Prisma model can be refined during implementation.

------------------------------------------------------------------------

# 15. Notification Channels

### MVP

-   In-app notifications
-   Email notifications

### Future

-   Browser push
-   Mobile push
-   SMS
-   Other channels

The notification system should use a channel abstraction so adding a
future channel does not require rewriting the business logic.

------------------------------------------------------------------------

# 16. In-App Notifications

In-app notifications are persisted in PostgreSQL.

Example:

``` text
Your follow-up with Acme Corp is due today.
```

The frontend can retrieve:

``` text
GET /api/v1/notifications
```

The user can:

-   View notifications
-   Mark notification as read
-   Mark all as read
-   Open the related application/follow-up/interview

------------------------------------------------------------------------

# 17. Email Notifications

Email sending should be separated behind a provider abstraction.

Conceptually:

``` text
Notification Service
        ↓
Email Provider Interface
        ↓
Provider Implementation
```

This allows the product to change email providers later without changing
the rest of the application.

The worker should never depend directly on provider-specific business
logic.

------------------------------------------------------------------------

# 18. Notification Preferences

Users should eventually be able to control:

-   In-app notifications
-   Email notifications
-   Reminder preferences
-   Timezone

Example:

``` text
Email notifications: ON
In-app notifications: ON
Timezone: Asia/Kolkata
```

For MVP, sensible defaults can be used.

------------------------------------------------------------------------

# 19. Idempotency

This is one of the most important requirements.

A background job may execute more than once because of:

-   Worker crashes
-   Network failures
-   Queue retries
-   Provider timeouts
-   Process restarts

Therefore:

> Executing the same job twice must not create an unwanted duplicate
> side effect.

Example:

``` text
Job:
FOLLOWUP_REMINDER: followup-123

First execution:
Notification created and sent

Worker crashes after sending
but before acknowledging job

Queue retries

Second execution:
Worker checks idempotency
Notification already processed
No duplicate send
```

------------------------------------------------------------------------

# 20. Idempotency Key

A deterministic key can be generated.

Example:

``` text
followup-reminder:followup-123:2026-10-10T10:00
```

The notification or processing record can enforce uniqueness around the
appropriate key.

The exact database constraint should be finalized during implementation.

------------------------------------------------------------------------

# 21. Job Retries

Not every failure should be treated equally.

### Transient failures

Examples:

-   Email provider temporarily unavailable
-   Redis/network timeout
-   Temporary database connection problem

These should generally be retried.

### Permanent failures

Examples:

-   Invalid email address
-   Deleted entity
-   Invalid job payload
-   Unsupported operation

These should generally not be retried indefinitely.

------------------------------------------------------------------------

# 22. Retry Strategy

Use:

-   Limited retry attempts
-   Exponential backoff
-   Increasing delay between attempts

Example:

``` text
Attempt 1 → immediate
Attempt 2 → short delay
Attempt 3 → longer delay
Attempt 4 → longer delay
```

The exact attempt count and delays should be configuration rather than
scattered constants.

------------------------------------------------------------------------

# 23. Failed Jobs

Jobs that exhaust their retries should become visible as failed.

Example:

``` text
Queue
  ↓
Retry
  ↓
Retry
  ↓
Retry
  ↓
FAILED
```

Failed jobs should be:

-   Logged
-   Observable
-   Inspectable
-   Retryable when appropriate

There should be no infinite retry loop.

------------------------------------------------------------------------

# 24. Worker Responsibilities

The worker should:

1.  Receive a job.
2.  Validate the payload.
3.  Load current data.
4.  Verify the operation is still valid.
5.  Perform the operation.
6.  Record the result.
7.  Handle errors.
8.  Retry transient failures.
9.  Log important execution information.

The worker should **not** contain unrelated business logic.

------------------------------------------------------------------------

# 25. Worker Architecture

The worker can be a separate Node.js process while sharing
application/domain code with the API.

``` text
Application Repository
│
├── API Process
│   └── HTTP requests
│
├── Worker Process
│   └── Background jobs
│
└── Shared Domain Code
```

This keeps the architecture simple while allowing independent scaling.

------------------------------------------------------------------------

# 26. Worker Scaling

### MVP

Start with:

``` text
1 API process
1 Worker process
1 Redis instance
1 PostgreSQL database
```

Later:

``` text
API × N
Worker × N
Redis
PostgreSQL
```

Multiple workers can consume from the same queue.

There is no need to build a complex distributed architecture before
traffic requires it.

------------------------------------------------------------------------

# 27. Concurrency

Workers should support controlled concurrency.

Example:

``` text
Worker
 ├── Job A
 ├── Job B
 ├── Job C
 └── Job D
```

The concurrency limit should be configurable.

This prevents a sudden backlog from overwhelming:

-   PostgreSQL
-   Email provider
-   External APIs

------------------------------------------------------------------------

# 28. Cancellation and Rescheduling

A scheduled job may become invalid before it runs.

Example:

``` text
Monday:
Follow-up scheduled for Friday

Wednesday:
User deletes follow-up

Friday:
Old reminder job executes
```

The worker should query the current state.

``` text
Follow-up exists?
        ↓
      NO
        ↓
Do nothing
```

This is safer than trying to perfectly remove every old queue job.

The same principle applies to rescheduled interviews.

------------------------------------------------------------------------

# 29. Database Transaction Consideration

A common problem is:

``` text
1. Save database record
2. Schedule queue job
3. Queue scheduling fails
```

Now the database says a reminder exists, but no job is scheduled.

For the MVP, scheduling should happen after the successful database
transaction and failed scheduling should be observable/recoverable.

For a more reliability-critical system, a **transactional outbox
pattern** can be introduced.

``` text
DB Transaction
 ├── Business record
 └── Outbox record

        ↓

Outbox processor

        ↓

Queue
```

This should be considered an evolution rather than mandatory MVP
complexity.

------------------------------------------------------------------------

# 30. Transactional Outbox --- Future Option

The outbox pattern is useful when guaranteed delivery between PostgreSQL
and the queue becomes important.

Instead of:

``` text
DB → Queue
```

the application performs:

``` text
DB transaction
    ↓
Business record + Outbox event
    ↓
Outbox processor
    ↓
Queue
```

This prevents the classic problem where the database succeeds but queue
scheduling fails.

------------------------------------------------------------------------

# 31. Redis Failure

If Redis becomes unavailable:

-   Existing PostgreSQL business data must remain safe.
-   API operations that require immediate queue scheduling may fail or
    enter a recoverable state.
-   Errors should be logged.
-   The system should recover when Redis returns.

Redis should never be the only copy of important business information.

------------------------------------------------------------------------

# 32. Database Failure

If PostgreSQL is unavailable:

-   Workers should fail safely.
-   Jobs should retry when the failure is transient.
-   No notification should be marked successful without the required
    database operation succeeding.

------------------------------------------------------------------------

# 33. Email Provider Failure

If email sending fails:

``` text
Worker
  ↓
Email Provider
  ↓
Failure
  ↓
Retry
```

If retries are exhausted:

``` text
Job → Failed
```

The in-app notification can remain available if it was successfully
created.

------------------------------------------------------------------------

# 34. Duplicate Delivery Protection

A provider timeout does not always mean the provider failed.

Example:

``` text
Worker sends email
        ↓
Provider sends email
        ↓
Network response is lost
        ↓
Worker thinks it failed
        ↓
Retry
```

This can create duplicate emails.

Therefore, where the provider supports it, use a provider-level
idempotency key.

This should complement the application's own idempotency strategy.

------------------------------------------------------------------------

# 35. Security

Job payloads should contain IDs rather than sensitive user information
whenever possible.

Prefer:

``` json
{
  "userId": "123",
  "followUpId": "456"
}
```

Instead of:

``` json
{
  "email": "...",
  "phone": "...",
  "personalData": "..."
}
```

Workers should retrieve current data from the database.

Secrets such as:

-   Email API keys
-   Redis credentials
-   Database credentials

must be stored in environment/secret management systems.

Never log secrets.

------------------------------------------------------------------------

# 36. Observability

Every job should have a useful execution identity.

Example:

``` text
jobId
jobType
userId
entityId
attempt
status
duration
error
```

Important metrics:

-   Queue depth
-   Jobs processed
-   Jobs failed
-   Retry count
-   Job processing duration
-   Worker uptime
-   Notification delivery failures
-   Email failures

------------------------------------------------------------------------

# 37. Worker Health

The worker should expose or publish enough information to determine
whether it is alive.

Useful health signals:

``` text
Worker running
Queue reachable
Last successful job
Failed job count
```

A future deployment can use worker health checks for restart/recovery.

------------------------------------------------------------------------

# 38. Logging

Useful log:

``` text
INFO
job=FOLLOWUP_REMINDER
jobId=abc123
followUpId=456
attempt=1
status=started
```

Successful completion:

``` text
INFO
job=FOLLOWUP_REMINDER
jobId=abc123
status=completed
durationMs=240
```

Failure:

``` text
ERROR
job=FOLLOWUP_REMINDER
jobId=abc123
attempt=3
error=EMAIL_PROVIDER_TIMEOUT
```

Do not log sensitive personal information unnecessarily.

------------------------------------------------------------------------

# 39. Monitoring Dashboard

A future internal/admin monitoring screen could show:

  Metric             Meaning
  ------------------ --------------------------
  Queue depth        Waiting jobs
  Active jobs        Currently processing
  Failed jobs        Jobs requiring attention
  Retry count        Reliability signal
  Average duration   Worker performance
  Email failures     Provider health
  Worker status      Worker availability

This is not required for the first MVP UI.

------------------------------------------------------------------------

# 40. Scheduling Model

A reminder should have an authoritative timestamp.

Example:

``` text
scheduledAt = 2026-10-10T04:30:00Z
```

The queue handles execution timing.

PostgreSQL retains the business meaning of the scheduled event.

This gives the system a recoverable source of truth.

------------------------------------------------------------------------

# 41. What Happens When a User Changes Timezone?

The system should distinguish between:

-   Stored UTC timestamps
-   User's current display timezone

Existing scheduled events should retain their intended instant unless
product behavior explicitly says they should move with the user's
timezone.

For recurring/future scheduling features, timezone semantics must be
explicitly defined.

------------------------------------------------------------------------

# 42. What Happens When a User Deletes an Application?

Related pending reminders should not send.

The worker should verify the referenced entity before performing the
action.

``` text
Job executes
   ↓
Application exists?
   ↓
NO
   ↓
Complete job without sending
```

This is a normal, non-error outcome.

------------------------------------------------------------------------

# 43. What Happens When a Follow-Up Is Completed?

If the follow-up is already completed:

``` text
Worker
  ↓
Follow-up status = COMPLETED
  ↓
No reminder required
  ↓
Job exits successfully
```

The worker should not treat this as a system failure.

------------------------------------------------------------------------

# 44. API Responsibilities

The API should:

-   Validate scheduling input.
-   Store business data.
-   Create/update/cancel relevant scheduling information.
-   Enqueue jobs.
-   Return an appropriate response.

The API should not:

-   Wait for email delivery.
-   Execute long-running tasks.
-   Perform expensive asynchronous processing inside HTTP requests.

------------------------------------------------------------------------

# 45. Worker Responsibilities vs API Responsibilities

  Responsibility              API   Worker
  ------------------------- ----- --------
  Validate user request        ✅ 
  Create application           ✅ 
  Create follow-up             ✅ 
  Schedule reminder            ✅ 
  Send reminder later                   ✅
  Send email                            ✅
  Retry failed email                    ✅
  Process delayed job                   ✅
  Read notification            ✅ 
  Mark notification read       ✅ 
  Generate future reports               ✅

------------------------------------------------------------------------

# 46. Testing Strategy

## Unit Tests

Test:

-   Job payload validation
-   Reminder eligibility
-   Idempotency logic
-   Retry classification
-   Notification creation
-   Timezone conversion

## Integration Tests

Test:

-   API → PostgreSQL → Queue
-   Worker → PostgreSQL
-   Worker → Notification
-   Worker → Email provider mock

## End-to-End Test

Example:

``` text
Create follow-up
      ↓
Schedule reminder
      ↓
Run worker
      ↓
Notification created
      ↓
User sees notification
```

------------------------------------------------------------------------

# 47. Important Test Cases

The system should test:

-   Follow-up reminder sent once.
-   Follow-up completed before reminder.
-   Follow-up deleted before reminder.
-   Follow-up rescheduled.
-   Interview cancelled.
-   Worker crashes and retries.
-   Email provider temporarily fails.
-   Email provider permanently fails.
-   Duplicate job execution.
-   Redis temporarily unavailable.
-   Database temporarily unavailable.
-   User timezone conversion.
-   Notification already processed.

------------------------------------------------------------------------

# 48. Development Strategy

Do not build the complete notification infrastructure before the core
product works.

Recommended implementation sequence:

### Phase 1

-   Notification database model
-   Basic in-app notifications
-   Worker process
-   Redis queue
-   Follow-up reminder

### Phase 2

-   Interview reminders
-   Retry handling
-   Idempotency
-   Notification preferences

### Phase 3

-   Email notifications
-   Provider abstraction
-   Monitoring improvements

### Phase 4

-   Advanced scheduling
-   Calendar integration
-   Additional notification channels

------------------------------------------------------------------------

# 49. MVP Boundary

### Included

-   Redis
-   Background worker
-   Follow-up reminders
-   Interview reminders
-   In-app notifications
-   Basic email notification architecture
-   Retry handling
-   Idempotency
-   Timezone-aware scheduling
-   Worker logging
-   Basic monitoring

### Not Included

-   Kafka
-   Complex event bus
-   Workflow orchestration platform
-   AI-based scheduling
-   SMS
-   Mobile push
-   Complex recurring workflows
-   Multi-region job processing
-   Distributed saga orchestration

------------------------------------------------------------------------

# 50. Architectural Decisions

### Decision 1 --- PostgreSQL remains the source of truth

Business state must not depend on Redis.

### Decision 2 --- Background processing uses a worker

Long-running and delayed operations should not block API requests.

### Decision 3 --- Jobs must be idempotent

Retries must be safe.

### Decision 4 --- Workers re-check current state

Queued jobs can become stale.

### Decision 5 --- Email provider is abstracted

The product should not become tightly coupled to one provider.

### Decision 6 --- Start simple

One worker is sufficient for the MVP.

------------------------------------------------------------------------

# 51. Failure Handling Philosophy

The system should prefer:

> **Safe failure over silent failure.**

If something goes wrong:

``` text
Detect
  ↓
Log
  ↓
Retry when appropriate
  ↓
Mark failed when necessary
  ↓
Make failure observable
```

The system should never silently lose important background work.

------------------------------------------------------------------------

# 52. Final Architecture

``` text
                         ┌──────────────┐
                         │    React     │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │     API      │
                         └───┬──────┬───┘
                             │      │
                             ▼      ▼
                    ┌───────────┐  ┌───────────┐
                    │PostgreSQL │  │   Redis   │
                    │  Source   │  │   Queue   │
                    │ of Truth  │  └─────┬─────┘
                    └───────────┘        │
                                         ▼
                                  ┌──────────────┐
                                  │    Worker    │
                                  └──────┬───────┘
                                         │
                              ┌──────────┼──────────┐
                              ▼          ▼          ▼
                        PostgreSQL    In-App      Email
                                   Notification  Provider
```

------------------------------------------------------------------------

# 53. End-to-End Example

A user creates:

> Follow up with Google recruiter on October 10 at 10:00 AM.

### Step 1

Frontend sends:

``` http
POST /api/v1/followups
```

### Step 2

API validates the request.

### Step 3

Follow-up is saved in PostgreSQL.

### Step 4

Reminder job is added to Redis.

### Step 5

At the scheduled time, the worker receives the job.

### Step 6

Worker checks PostgreSQL:

``` text
Follow-up exists?
Pending?
Still scheduled?
Already notified?
```

### Step 7

Worker creates an in-app notification.

### Step 8

If email is enabled, worker sends the email.

### Step 9

The job completes.

``` text
User
 ↓
Follow-up
 ↓
PostgreSQL
 ↓
Redis
 ↓
Worker
 ↓
Notification
 ↓
User
```

------------------------------------------------------------------------

# 54. Relationship With Other Documents

This document depends on:

-   **PRD** --- defines reminder and notification requirements.
-   **UX & User Flows** --- defines how users interact with
    notifications.
-   **System Architecture** --- defines Redis and worker architecture.
-   **Database Design** --- defines follow-ups, interviews, and
    notification persistence.
-   **API Design** --- defines notification and scheduling endpoints.
-   **Authentication & Security** --- defines user ownership and
    security requirements.

This document adds the execution architecture for asynchronous work.

------------------------------------------------------------------------

# 55. Implementation Checklist

Before implementation:

-   [ ] Redis configured.
-   [ ] Queue library selected.
-   [ ] Worker process created.
-   [ ] Notification model finalized.
-   [ ] Follow-up reminder job implemented.
-   [ ] Interview reminder job implemented.
-   [ ] Idempotency strategy implemented.
-   [ ] Retry policy configured.
-   [ ] Failed-job handling configured.
-   [ ] User timezone stored.
-   [ ] Email provider abstraction created.
-   [ ] Worker logging implemented.
-   [ ] Queue metrics defined.
-   [ ] Integration tests created.
-   [ ] End-to-end reminder test created.

------------------------------------------------------------------------

# 56. Final Design

The Job Application Tracker should use a **simple asynchronous job
architecture built around PostgreSQL, Redis, and a dedicated worker**.

The core rules are:

1.  PostgreSQL is the source of truth.
2.  Redis handles queued and delayed work.
3.  Workers execute asynchronous jobs.
4.  Jobs are idempotent.
5.  Workers verify current business state before acting.
6.  Transient failures are retried.
7.  Permanent failures become visible.
8.  Notifications are persisted.
9.  Timestamps are stored in UTC.
10. User timezone is respected.
11. Email delivery is abstracted.
12. The architecture should scale gradually rather than introducing
    distributed-system complexity prematurely.

This gives the product reliable reminders and notifications without
turning the MVP into an unnecessarily complicated distributed system.

------------------------------------------------------------------------

# 57. Next Document

The next logical document in the technical documentation chain is:

**File Storage Design**

It will define:

-   Whether the MVP needs file uploads
-   Storage architecture
-   Object storage
-   Upload/download flow
-   File metadata
-   Access control
-   Signed URLs
-   File validation
-   Security
-   Size/type limits
-   Cleanup and lifecycle
-   Future document/attachment support
