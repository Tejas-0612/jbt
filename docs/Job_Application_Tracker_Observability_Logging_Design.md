# Job Application Tracker --- Observability & Logging Design

**Document Type:** Technical Design\
**Product:** Job Application Tracker\
**Status:** Working / MVP Design

------------------------------------------------------------------------

## 1. Purpose

Observability answers three questions:

1.  What is happening?
2.  Why did it happen?
3.  Is the system healthy?

For this product, observability covers:

-   API requests and errors
-   Authentication events
-   PostgreSQL
-   Redis and background workers
-   Notifications and email
-   File storage
-   Application performance
-   Production health

The goal is not to build a huge monitoring platform. The goal is:

> **When something breaks, we should be able to understand what happened
> without guessing.**

------------------------------------------------------------------------

## 2. Core Principles

1.  Logs should be structured.
2.  Important operations should have request/correlation IDs.
3.  Sensitive information must never be logged.
4.  Errors should contain enough context to debug them.
5.  Metrics should focus on meaningful system behavior.
6.  Health checks should detect important dependency failures.
7.  Workers should be observable separately from the API.
8.  Development and production logging should be appropriate to each
    environment.
9.  Start simple and add advanced observability only when needed.

------------------------------------------------------------------------

## 3. Observability Pillars

``` text
             Observability
                  |
        +---------+---------+
        |         |         |
       Logs     Metrics    Traces
```

### Logs

Answer:

> What happened?

### Metrics

Answer:

> How often and how badly is something happening?

### Traces

Answer:

> Where did a particular request spend time?

For the MVP, **structured logs + metrics + request IDs** are the
priority. Full distributed tracing can come later.

------------------------------------------------------------------------

## 4. High-Level Architecture

``` text
                         +--------------+
                         |   Frontend   |
                         +------+-------+
                                |
                                v
                         +--------------+
                         |     API      |
                         +------+-------+
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
         PostgreSQL           Redis          External APIs
              |                 |                 |
              +-----------------+-----------------+
                                |
                                v
                       +-----------------+
                       | Observability   |
                       | Logs + Metrics  |
                       +-----------------+
                                ^
                                |
                         +--------------+
                         |    Worker    |
                         +--------------+
```

------------------------------------------------------------------------

## 5. Structured Logging

Production logs should preferably be JSON/structured.

Instead of:

``` text
Something went wrong
```

prefer:

``` json
{
  "level": "error",
  "event": "APPLICATION_UPDATE_FAILED",
  "requestId": "req_123",
  "userId": "user_456",
  "applicationId": "app_789",
  "errorCode": "DATABASE_ERROR"
}
```

Structured logs make searching, filtering, and aggregation much easier.

------------------------------------------------------------------------

## 6. Log Levels

### DEBUG

Detailed development diagnostics.

### INFO

Normal important events:

-   server started
-   user authenticated
-   application created
-   job completed

### WARN

Unexpected but recoverable conditions:

-   retry scheduled
-   provider temporarily unavailable
-   stale job ignored

### ERROR

An operation failed:

-   database failure
-   email failure
-   unexpected exception
-   job exhausted retries

### FATAL

Use only when the process cannot operate normally, such as missing
critical configuration during startup.

------------------------------------------------------------------------

## 7. Important Events

### Authentication

``` text
AUTH_LOGIN_STARTED
AUTH_LOGIN_SUCCESS
AUTH_LOGIN_FAILED
AUTH_LOGOUT
AUTH_REFRESH
AUTH_SESSION_REVOKED
```

### Applications

``` text
APPLICATION_CREATED
APPLICATION_UPDATED
APPLICATION_DELETED
APPLICATION_STATUS_CHANGED
```

### Follow-ups

``` text
FOLLOWUP_CREATED
FOLLOWUP_COMPLETED
FOLLOWUP_REMINDER_SENT
```

### Interviews

``` text
INTERVIEW_CREATED
INTERVIEW_UPDATED
INTERVIEW_CANCELLED
INTERVIEW_REMINDER_SENT
```

### Notifications

``` text
NOTIFICATION_CREATED
NOTIFICATION_SENT
NOTIFICATION_FAILED
NOTIFICATION_READ
```

### Files

``` text
FILE_UPLOAD_STARTED
FILE_UPLOAD_COMPLETED
FILE_UPLOAD_FAILED
FILE_DELETED
```

------------------------------------------------------------------------

## 8. Request IDs

Every API request should have a unique request ID.

``` text
Frontend
   |
API Request
   |
requestId generated
   |
Controller
   |
Service
   |
Database
```

Example:

``` text
req_01JABC123
```

Relevant logs generated during that request should carry the same ID.

------------------------------------------------------------------------

## 9. Correlation IDs

A correlation ID becomes useful when one operation crosses multiple
components.

Example:

``` text
Create Follow-up
      |
PostgreSQL
      |
Queue Job
      |
Worker
      |
Notification
      |
Email Provider
```

Where practical, preserve a correlation identifier across the
asynchronous boundary.

This makes it possible to trace one business operation end-to-end.

------------------------------------------------------------------------

## 10. Background Job Logging

Every job should expose useful execution information:

``` text
jobId
jobType
attempt
status
duration
relatedEntityId
userId
errorCode
```

Example:

``` json
{
  "level": "info",
  "event": "JOB_COMPLETED",
  "jobId": "job_123",
  "jobType": "FOLLOWUP_REMINDER",
  "attempt": 1,
  "durationMs": 180
}
```

------------------------------------------------------------------------

## 11. Error Logging

Useful error fields include:

``` text
timestamp
level
event
requestId
userId
resourceId
errorCode
message
stack
environment
service
```

Do not automatically dump entire request bodies, database records, or
headers.

------------------------------------------------------------------------

## 12. Error Codes

Use stable machine-readable error codes.

Examples:

``` text
APPLICATION_NOT_FOUND
APPLICATION_ACCESS_DENIED
INVALID_APPLICATION_STATUS
DATABASE_UNAVAILABLE
EMAIL_PROVIDER_TIMEOUT
FILE_UPLOAD_FAILED
QUEUE_UNAVAILABLE
```

The frontend can use these codes to decide appropriate user-facing
behavior.

------------------------------------------------------------------------

## 13. User-Facing Errors vs Internal Errors

Never expose internal implementation details.

Bad:

``` text
PrismaClientKnownRequestError: Unique constraint failed...
```

Better:

``` text
Unable to save the application right now.
Please try again.
```

The detailed technical error can still be logged securely.

------------------------------------------------------------------------

## 14. Sensitive Data

Never log:

-   access tokens
-   refresh tokens
-   OAuth authorization codes
-   passwords
-   cookies
-   API keys
-   database credentials
-   storage credentials
-   uploaded document contents

Avoid logging complete request headers, especially `Authorization` and
`Cookie`.

------------------------------------------------------------------------

## 15. Personal Data

The product may contain:

-   recruiter/contact information
-   salary information
-   interview notes
-   application history
-   resumes

Prefer IDs over complete objects.

Use:

``` text
userId=user_123
applicationId=app_456
```

rather than logging the entire application.

------------------------------------------------------------------------

## 16. Authentication & Authorization Logging

Useful authentication events include:

``` text
LOGIN_SUCCESS
LOGIN_FAILURE
OAUTH_FAILURE
SESSION_CREATED
SESSION_REFRESHED
SESSION_REVOKED
LOGOUT
```

Authorization failures should also be observable.

Example:

``` text
User A requested Application B
Application B belongs to User C
-> ACCESS_DENIED
```

Log the relevant IDs, but do not expose another user's information in
the API response.

------------------------------------------------------------------------

## 17. Database Observability

Monitor:

-   connection failures
-   query errors
-   transaction failures
-   slow queries
-   connection-pool exhaustion
-   migration failures

Useful metrics:

``` text
DB connection count
DB pool usage
DB query duration
DB error count
```

------------------------------------------------------------------------

## 18. Slow Queries

Configure a threshold for slow database operations.

``` text
query duration > configured threshold
        |
        v
log as slow query
```

The threshold should be tuned using real application behavior.

Do not unnecessarily log sensitive query parameters.

------------------------------------------------------------------------

## 19. API Metrics

Track at minimum:

``` text
Request count
Error count
Response latency
Status-code distribution
```

Important HTTP groups:

``` text
2xx
4xx
5xx
```

Latency can be measured using:

``` text
p50
p95
p99
```

------------------------------------------------------------------------

## 20. Endpoint-Level Metrics

Metrics can eventually be grouped by endpoint:

``` text
GET    /applications
POST   /applications
GET    /applications/:id
PATCH  /applications/:id
GET    /dashboard
GET    /notifications
```

This helps identify slow or unreliable areas.

------------------------------------------------------------------------

## 21. Background Job Metrics

Important worker metrics:

``` text
Jobs processed
Jobs failed
Jobs retried
Queue depth
Processing duration
Active jobs
```

Example:

``` text
FOLLOWUP_REMINDER
processed: 500
failed: 3
retried: 8
average duration: 180ms
```

------------------------------------------------------------------------

## 22. Queue Health

Monitor:

-   Redis connection status
-   waiting jobs
-   active jobs
-   failed jobs
-   delayed jobs
-   retry count

A continuously growing queue may indicate:

-   worker failure
-   insufficient worker capacity
-   external provider slowdown
-   database problems

------------------------------------------------------------------------

## 23. Worker Health

The worker should expose a heartbeat or equivalent health signal.

``` text
Worker started
     |
Heartbeat
     |
Heartbeat
     |
Heartbeat
```

If heartbeats stop, the deployment environment should be able to
identify the worker as unhealthy.

------------------------------------------------------------------------

## 24. External Provider Monitoring

External dependencies may include:

-   Google OAuth
-   email provider
-   object storage
-   future calendar integrations

Track:

``` text
Request count
Success count
Failure count
Latency
Timeouts
```

Do not log sensitive provider responses.

------------------------------------------------------------------------

## 25. Email Metrics

Useful metrics:

``` text
emails attempted
emails sent
emails failed
provider timeouts
retry count
```

Future metrics may include:

``` text
delivery rate
bounce rate
complaint rate
```

------------------------------------------------------------------------

## 26. File Storage Metrics

Useful metrics:

``` text
uploads attempted
uploads completed
uploads failed
downloads requested
download failures
storage usage
cleanup failures
```

Never store file contents in logs.

------------------------------------------------------------------------

## 27. Health Checks

The API should expose a basic health endpoint:

``` http
GET /health
```

Simple response:

``` json
{
  "status": "ok"
}
```

A separate readiness check can verify important dependencies.

------------------------------------------------------------------------

## 28. Liveness vs Readiness

### Liveness

> Is the process alive?

Example:

``` text
API process responding
```

### Readiness

> Can the process safely receive traffic?

Example:

``` text
API running
+
Database available
+
Required configuration loaded
```

These checks can be used by the deployment platform.

------------------------------------------------------------------------

## 29. Dependency Health

A readiness check may consider:

``` text
API
 |
PostgreSQL
 |
Redis
```

Optional dependencies should not necessarily make the entire API
unavailable.

Health checks should represent what the process genuinely requires to
operate.

------------------------------------------------------------------------

## 30. Frontend Error Monitoring

The frontend should eventually capture unexpected runtime errors such
as:

-   React rendering failures
-   unexpected state errors
-   failed critical API calls
-   navigation failures

Do not send sensitive application data in error reports.

------------------------------------------------------------------------

## 31. Frontend Performance

Useful future measurements:

-   page load time
-   route transition performance
-   API latency experienced by users
-   JavaScript errors
-   large asset loading

The MVP can start with basic frontend error monitoring.

------------------------------------------------------------------------

## 32. Distributed Tracing

Full distributed tracing is **not required for the MVP**.

It becomes more valuable if the system eventually becomes:

``` text
API
 |
Worker
 |
Multiple services
 |
External APIs
```

For the current modular monolith:

> **Request IDs + structured logs + metrics are sufficient to start.**

------------------------------------------------------------------------

## 33. Alerting

Alerts should focus on actionable problems.

### API

-   sustained high 5xx rate
-   API unavailable
-   severe latency increase

### Database

-   unavailable
-   connection exhaustion
-   severe query degradation

### Worker

-   worker stopped
-   queue continuously growing
-   high job failure rate

### External services

-   sustained email failure
-   storage failures
-   authentication provider problems

------------------------------------------------------------------------

## 34. Avoid Alert Noise

Do not alert on every individual failure.

Bad:

``` text
One failed email
-> ALERT
```

Better:

``` text
Email failure rate exceeds threshold
for a sustained period
-> ALERT
```

Alerts should require human attention.

------------------------------------------------------------------------

## 35. Production Logging

Production logs should generally be:

-   structured
-   searchable
-   centralized
-   timestamped
-   correlated with request/job IDs

The exact logging provider is an infrastructure decision.

------------------------------------------------------------------------

## 36. Development Logging

Local development can be more verbose.

Example:

``` text
DEBUG
Database query completed
duration=23ms
```

Developers should be able to understand application behavior without
production monitoring infrastructure.

------------------------------------------------------------------------

## 37. Environment Differences

  Capability         Development           Production
  ------------------ --------------------- -----------------
  Debug logs         More verbose          Limited
  Structured logs    Recommended           Required
  Centralized logs   Optional              Recommended
  Error monitoring   Useful                Important
  Metrics            Basic                 Important
  Alerts             Usually unnecessary   Required
  Tracing            Optional              Add when useful

------------------------------------------------------------------------

## 38. Log Retention

Logs should not be kept forever by default.

Retention should balance:

``` text
Debugging value
+
Security
+
Privacy
+
Storage cost
```

The exact retention period belongs to the infrastructure/security
policy.

------------------------------------------------------------------------

## 39. Monitoring Dashboard

A future internal monitoring view could show:

``` text
System Health
--------------------
API              Healthy
Database         Healthy
Redis            Healthy
Worker           Healthy

API Requests     12,420
Error Rate       0.4%
p95 Latency      210ms

Queue Depth      4
Failed Jobs      2
```

This is not a product-facing screen.

------------------------------------------------------------------------

## 40. Incident Investigation

Example issue:

> "My follow-up reminder didn't arrive."

Investigation path:

``` text
User
 |
Application
 |
Follow-up
 |
Notification
 |
Job ID
 |
Worker logs
 |
Email provider
```

Useful identifiers:

-   user ID
-   application ID
-   notification ID
-   job ID
-   request/correlation ID

The goal is to trace the operation rather than guess.

------------------------------------------------------------------------

## 41. Example Investigation

``` text
Follow-up exists
      |
Reminder job scheduled
      |
Worker received job
      |
Email provider timed out
      |
Retry 1
      |
Retry 2
      |
Success
```

The logs should make this sequence visible.

------------------------------------------------------------------------

## 42. Error Tracking

An error-tracking service may eventually be used for:

-   unhandled backend exceptions
-   frontend runtime exceptions
-   repeated failures
-   stack traces
-   release tracking

The provider should remain an infrastructure choice rather than becoming
part of business logic.

------------------------------------------------------------------------

## 43. Release Tracking

Production errors should be associated with an application version.

Example:

``` text
version=1.4.2
environment=production
```

This helps answer:

> Did this problem start after a new deployment?

------------------------------------------------------------------------

## 44. Audit Logging vs Application Activity

These are different concepts.

### Technical logs

For developers and operators:

``` text
DATABASE_TIMEOUT
```

### User-facing activity

For the candidate:

``` text
Application status changed to Interview
```

The application's timeline/activity system should represent important
user-facing history.

Do not force developers to use technical logs as the product's business
history.

------------------------------------------------------------------------

## 45. Testing Observability

Test that:

-   request IDs are generated
-   errors contain useful context
-   sensitive values are excluded
-   worker jobs log lifecycle events
-   health endpoints behave correctly
-   metrics are emitted
-   authorization failures are observable
-   failed jobs are visible

Tests should not depend on exact log formatting unless necessary.

------------------------------------------------------------------------

## 46. MVP Boundary

### Include

-   Structured backend logs
-   Request IDs
-   Error codes
-   Basic health endpoint
-   Worker/job logging
-   Database error logging
-   Redis/queue error logging
-   Authentication event logging
-   Basic API metrics
-   Production error monitoring
-   Sensitive-data filtering

### Defer

-   Full distributed tracing
-   Advanced analytics
-   Complex observability platform
-   Custom monitoring dashboard
-   AI anomaly detection
-   Multi-region observability
-   Large-scale log analytics

------------------------------------------------------------------------

## 47. Recommended Implementation Sequence

### Phase 1 --- Foundation

-   logging configuration
-   log levels
-   request ID middleware
-   global error handler
-   health endpoint

### Phase 2 --- Core Metrics

-   API request count
-   API errors
-   API latency
-   database health
-   Redis health

### Phase 3 --- Worker Observability

-   job lifecycle logs
-   queue depth
-   retry metrics
-   failed-job metrics
-   worker heartbeat

### Phase 4 --- Production Monitoring

-   centralized logs
-   error tracking
-   alerts
-   release/version tracking

### Phase 5 --- Advanced

-   distributed tracing
-   advanced dashboards
-   detailed performance analysis

------------------------------------------------------------------------

## 48. Example Structured Log

Successful request:

``` json
{
  "timestamp": "2026-10-07T10:30:00Z",
  "level": "info",
  "service": "api",
  "environment": "production",
  "event": "HTTP_REQUEST_COMPLETED",
  "requestId": "req_123",
  "method": "POST",
  "route": "/api/v1/applications",
  "statusCode": 201,
  "durationMs": 142
}
```

Error:

``` json
{
  "timestamp": "2026-10-07T10:31:00Z",
  "level": "error",
  "service": "api",
  "environment": "production",
  "event": "APPLICATION_CREATE_FAILED",
  "requestId": "req_124",
  "errorCode": "DATABASE_ERROR"
}
```

No token, password, cookie, or unnecessary personal data is included.

------------------------------------------------------------------------

## 49. Example Worker Log

``` json
{
  "timestamp": "2026-10-07T10:35:00Z",
  "level": "info",
  "service": "worker",
  "event": "JOB_COMPLETED",
  "jobId": "job_123",
  "jobType": "FOLLOWUP_REMINDER",
  "attempt": 1,
  "durationMs": 184
}
```

Failure:

``` json
{
  "timestamp": "2026-10-07T10:36:00Z",
  "level": "error",
  "service": "worker",
  "event": "JOB_FAILED",
  "jobId": "job_124",
  "jobType": "SEND_EMAIL",
  "attempt": 3,
  "errorCode": "EMAIL_PROVIDER_TIMEOUT"
}
```

------------------------------------------------------------------------

## 50. Final Architecture

``` text
                         +--------------+
                         |   Frontend   |
                         +------+-------+
                                |
                                v
                         +--------------+
                         |     API      |
                         +------+-------+
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
         PostgreSQL           Redis          External APIs
              |                 |                 |
              +-----------------+-----------------+
                                |
                                v
                       +-----------------+
                       | Observability   |
                       | Logs + Metrics  |
                       +-----------------+
                                ^
                                |
                         +--------------+
                         |    Worker    |
                         +--------------+
```

The observability layer observes the system rather than becoming part of
the core business logic.

------------------------------------------------------------------------

## 51. Final Design Decisions

1.  Use structured logs.
2.  Generate a request ID for API requests.
3.  Preserve correlation IDs across asynchronous operations where
    practical.
4.  Use stable machine-readable error codes.
5.  Never log secrets or tokens.
6.  Prefer IDs over personal data in logs.
7.  Monitor API latency and errors.
8.  Monitor database and Redis health.
9.  Monitor worker and queue health.
10. Keep user-facing activities separate from technical logs.
11. Start with logs + metrics before introducing full tracing.
12. Add alerts only for actionable conditions.
13. Keep observability provider-agnostic where practical.
14. Keep MVP observability simple.

------------------------------------------------------------------------

## 52. Relationship With Other Documents

This document depends on:

-   **System Architecture** --- API, database, Redis, worker, and
    deployment boundaries.
-   **Database Design** --- data and business activity history.
-   **API Design** --- request/response and error behavior.
-   **Authentication & Security** --- security-sensitive events and
    logging restrictions.
-   **Notification & Background Jobs** --- worker and queue
    observability.
-   **File Storage Design** --- upload/download/storage monitoring.

This document defines how the system's behavior becomes visible to
developers and operators.

------------------------------------------------------------------------

## 53. Implementation Checklist

Before production:

-   [ ] Structured logging configured.
-   [ ] Request ID middleware implemented.
-   [ ] Global error handler implemented.
-   [ ] Stable error codes defined.
-   [ ] Sensitive-data filtering implemented.
-   [ ] Health endpoint implemented.
-   [ ] Database health monitored.
-   [ ] Redis health monitored.
-   [ ] Worker logs implemented.
-   [ ] Queue metrics implemented.
-   [ ] API latency metrics implemented.
-   [ ] API error metrics implemented.
-   [ ] Production error tracking configured.
-   [ ] Alerts defined for actionable failures.
-   [ ] Release/version information included.
-   [ ] Log retention policy defined.

------------------------------------------------------------------------

## 54. Final Recommendation

Observability should be treated as **engineering visibility, not another
product feature**.

For the MVP, the ideal foundation is:

``` text
Structured Logs
      +
Request IDs
      +
Error Codes
      +
Basic Metrics
      +
Health Checks
      +
Worker Monitoring
```

That is enough to make the system understandable and debuggable.

As the product grows, tracing, advanced dashboards, alerting, and deeper
performance monitoring can be added based on actual needs.

> **Build enough observability that when something breaks, you can find
> the reason quickly --- then move on.**

------------------------------------------------------------------------

## 55. Next Document

The next logical technical document is:

**Performance & Scalability Design**

It will define:

-   performance goals
-   frontend performance
-   API performance
-   database optimization
-   indexes and query patterns
-   caching
-   Redis usage
-   pagination
-   concurrency
-   worker scaling
-   load expectations
-   scalability boundaries
-   what not to optimize prematurely
