# Job Application Tracker --- API Design Document

## Document Information

  -----------------------------------------------------------------------
  Field                               Value
  ----------------------------------- -----------------------------------
  Product                             Job Application Tracker

  Document Type                       API Design Document

  Depends On                          Product Discovery, PRD, UX, System
                                      Architecture, Database Design

  API Style                           REST

  Base Path                           `/api/v1`

  Authentication                      Google OAuth + application sessions

  Status                              Working / MVP API contract
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 1. Purpose

This document defines the API contract for the Job Application Tracker.

The database document defined **how data is stored**.

This document defines:

> **How the frontend and backend communicate.**

It covers:

-   endpoint structure
-   HTTP methods
-   authentication
-   authorization
-   request bodies
-   query parameters
-   responses
-   errors
-   pagination
-   filtering
-   sorting
-   status changes
-   applications
-   activities
-   follow-ups
-   interviews
-   notes
-   connections
-   dashboard
-   notifications

The API should be predictable, consistent, secure, and easy to consume
from the React frontend.

------------------------------------------------------------------------

# 2. API Design Principles

The API should follow these principles:

1.  RESTful resource-oriented design.
2.  Version APIs under `/api/v1`.
3.  Use standard HTTP methods.
4.  Keep controllers thin.
5.  Validate all client input on the backend.
6.  Enforce authorization on every protected resource.
7.  Return consistent response structures.
8.  Use machine-readable error codes.
9.  Paginate potentially large collections.
10. Never trust user IDs supplied by the client for authorization.
11. Keep business rules in services rather than controllers.
12. Design APIs around user workflows, not database tables alone.

------------------------------------------------------------------------

# 3. Base URL

Production:

``` text
https://api.example.com/api/v1
```

Development:

``` text
http://localhost:4000/api/v1
```

The actual production domain is an infrastructure decision.

------------------------------------------------------------------------

# 4. Authentication Model

The API uses authenticated user sessions.

Conceptually:

``` text
Browser
   ↓
Google OAuth
   ↓
Backend
   ↓
User Session
   ↓
Access Token
   ↓
Protected API
```

The exact implementation follows the authentication architecture defined
in the System Architecture document.

------------------------------------------------------------------------

# 5. Public vs Protected Endpoints

## Public

Potentially:

``` text
GET /health
GET /auth/google
GET /auth/google/callback
```

## Protected

Most product APIs:

``` text
/applications
/companies
/roles
/followups
/interviews
/notes
/connections
/dashboard
/notifications
```

Every protected request must establish the current authenticated user.

------------------------------------------------------------------------

# 6. Authentication Headers

For access-token based requests:

``` http
Authorization: Bearer <access_token>
```

Refresh tokens should not be manually supplied by the frontend.

They should be handled through the secure session/HttpOnly-cookie
mechanism.

------------------------------------------------------------------------

# 7. Authentication Endpoints

## GET `/auth/google`

Starts Google OAuth.

### Response

Usually a redirect to Google's authorization page.

------------------------------------------------------------------------

## GET `/auth/google/callback`

Handles the OAuth callback.

The backend should:

1.  validate the OAuth response
2.  identify/create the user
3.  create a session
4.  issue the application authentication mechanism
5.  redirect the user to the web application

------------------------------------------------------------------------

## POST `/auth/refresh`

Refreshes an expired/expiring access token using the authenticated
refresh session.

### Response

``` json
{
  "data": {
    "accessToken": "..."
  }
}
```

The exact token response depends on the final browser/session
implementation.

------------------------------------------------------------------------

## POST `/auth/logout`

Revokes the current session.

### Response

``` json
{
  "data": {
    "success": true
  }
}
```

------------------------------------------------------------------------

## GET `/auth/me`

Returns the currently authenticated user.

### Response

``` json
{
  "data": {
    "id": "user_123",
    "name": "Tejas",
    "email": "user@example.com",
    "avatarUrl": "..."
  }
}
```

------------------------------------------------------------------------

# 8. Standard Success Response

Single resource:

``` json
{
  "data": {
    "id": "..."
  }
}
```

Collection:

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

The exact pagination metadata can be refined during implementation.

------------------------------------------------------------------------

# 9. Standard Error Response

All API errors should follow a consistent structure.

``` json
{
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Application not found"
  }
}
```

For validation errors:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "companyId": "Company is required"
    }
  }
}
```

------------------------------------------------------------------------

# 10. Standard HTTP Status Codes

Recommended mapping:

  Status   Meaning
  -------- ------------------------------------------
  200      Successful request
  201      Resource created
  204      Successful request with no response body
  400      Invalid request
  401      Unauthenticated
  403      Authenticated but not authorized
  404      Resource not found
  409      Conflict
  422      Validation failure, if used
  429      Rate limited
  500      Internal server error

The project should use a consistent policy rather than mixing meanings.

------------------------------------------------------------------------

# 11. Error Codes

Initial error codes may include:

``` text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR

USER_NOT_FOUND

APPLICATION_NOT_FOUND
APPLICATION_ACCESS_DENIED
INVALID_APPLICATION_STATUS

COMPANY_NOT_FOUND
ROLE_NOT_FOUND

FOLLOWUP_NOT_FOUND
INTERVIEW_NOT_FOUND
NOTE_NOT_FOUND
CONNECTION_NOT_FOUND
```

Error codes are intended for programmatic handling.

Error messages are intended for humans/logging.

------------------------------------------------------------------------

# 12. Applications API

Applications are the core resource.

Base:

``` text
/api/v1/applications
```

------------------------------------------------------------------------

# 13. List Applications

## GET `/applications`

Returns the authenticated user's applications.

### Query Parameters

``` text
page
pageSize
search
status
companyId
source
fromDate
toDate
sortBy
order
```

Example:

``` text
GET /api/v1/applications?page=1&pageSize=20&status=INTERVIEW
```

------------------------------------------------------------------------

# 14. Search Applications

Example:

``` text
GET /api/v1/applications?search=frontend
```

The backend may search relevant fields such as:

-   company name
-   role title
-   application notes

Search implementation should remain within PostgreSQL for the MVP.

------------------------------------------------------------------------

# 15. Filter Applications

Example:

``` text
GET /api/v1/applications?status=APPLIED
```

Multiple filters can be combined:

``` text
GET /api/v1/applications
    ?status=INTERVIEW
    &companyId=company_123
    &source=LINKEDIN
```

The API should reject unsupported filter fields.

------------------------------------------------------------------------

# 16. Sort Applications

Example:

``` text
GET /api/v1/applications?sortBy=appliedAt&order=desc
```

Initial allowed fields:

``` text
appliedAt
createdAt
updatedAt
```

Potential future:

``` text
nextActionAt
```

------------------------------------------------------------------------

# 17. Create Application

## POST `/applications`

Creates an application.

### Request

``` json
{
  "companyId": "company_123",
  "roleId": "role_123",
  "status": "APPLIED",
  "source": "LINKEDIN",
  "jobUrl": "https://example.com/job",
  "appliedAt": "2026-10-07T10:00:00Z",
  "location": "Pune",
  "employmentType": "FULL_TIME",
  "salaryMin": 800000,
  "salaryMax": 1200000,
  "currency": "INR",
  "description": "Full stack developer role"
}
```

Only appropriate fields should be required.

### Response

``` http
201 Created
```

``` json
{
  "data": {
    "id": "application_123",
    "status": "APPLIED",
    "appliedAt": "2026-10-07T10:00:00Z"
  }
}
```

------------------------------------------------------------------------

# 18. Get Application

## GET `/applications/:applicationId`

Returns a detailed application.

Example:

``` text
GET /api/v1/applications/application_123
```

The response should provide enough information for the Application
Details page.

### Response

``` json
{
  "data": {
    "id": "application_123",
    "status": "INTERVIEW",
    "company": {},
    "role": {},
    "activities": [],
    "followUps": [],
    "interviews": [],
    "notes": []
  }
}
```

The backend should avoid returning unnecessary data.

------------------------------------------------------------------------

# 19. Update Application

## PATCH `/applications/:applicationId`

Updates selected application fields.

### Request

``` json
{
  "jobUrl": "https://example.com/new-url",
  "location": "Hyderabad"
}
```

PATCH should support partial updates.

### Response

``` json
{
  "data": {
    "id": "application_123",
    "location": "Hyderabad"
  }
}
```

------------------------------------------------------------------------

# 20. Update Application Status

Status changes are important enough to have a clear service-level
operation.

Two valid API styles are possible:

### Option A

``` text
PATCH /applications/:id
```

with:

``` json
{
  "status": "INTERVIEW"
}
```

### Option B

``` text
PATCH /applications/:id/status
```

with:

``` json
{
  "status": "INTERVIEW"
}
```

For the MVP, either can work.

The important requirement is:

> A status change must also create the appropriate timeline/history
> record.

------------------------------------------------------------------------

# 21. Status Change Transaction

When status changes:

``` text
PATCH status
      ↓
Validate transition
      ↓
Verify ownership
      ↓
Update Application
      +
Create Activity
      ↓
Commit Transaction
```

If the activity creation fails, the application update should not
silently remain without its corresponding history.

------------------------------------------------------------------------

# 22. Delete Application

## DELETE `/applications/:applicationId`

Deletes an application.

The backend must:

1.  authenticate user
2.  verify ownership
3.  apply deletion strategy
4.  delete/archive dependent records according to database rules

### Response

``` http
204 No Content
```

A confirmation dialog belongs to the frontend.

------------------------------------------------------------------------

# 23. Companies API

Base:

``` text
/api/v1/companies
```

------------------------------------------------------------------------

# 24. List Companies

## GET `/companies`

Returns the user's companies.

Potential query parameters:

``` text
search
page
pageSize
```

------------------------------------------------------------------------

# 25. Create Company

## POST `/companies`

### Request

``` json
{
  "name": "ABC Technologies",
  "website": "https://abc.example",
  "location": "Pune"
}
```

### Response

``` http
201 Created
```

------------------------------------------------------------------------

# 26. Get Company

## GET `/companies/:companyId`

Returns company details accessible to the current user.

------------------------------------------------------------------------

# 27. Update Company

## PATCH `/companies/:companyId`

Updates company information.

------------------------------------------------------------------------

# 28. Delete / Archive Company

## DELETE `/companies/:companyId`

The backend should prevent destructive behavior if referenced
applications would be affected.

The exact MVP behavior should be finalized with the database deletion
strategy.

------------------------------------------------------------------------

# 29. Roles API

Base:

``` text
/api/v1/roles
```

A role belongs to a company.

------------------------------------------------------------------------

# 30. Create Role

## POST `/roles`

### Request

``` json
{
  "companyId": "company_123",
  "title": "Full Stack Developer",
  "description": "Build web applications",
  "jobUrl": "https://example.com/job",
  "location": "Pune"
}
```

### Response

``` http
201 Created
```

------------------------------------------------------------------------

# 31. Get Role

## GET `/roles/:roleId`

Returns a role accessible to the current user.

------------------------------------------------------------------------

# 32. Update Role

## PATCH `/roles/:roleId`

Updates role information.

------------------------------------------------------------------------

# 33. Activities API

Base:

``` text
/api/v1/applications/:applicationId/activities
```

Activities are primarily application-scoped.

------------------------------------------------------------------------

# 34. List Activities

## GET `/applications/:applicationId/activities`

Returns the application's timeline.

### Query Parameters

Potentially:

``` text
page
pageSize
sort
```

For typical application timelines, the response can be small enough to
load directly.

------------------------------------------------------------------------

# 35. Create Activity

## POST `/applications/:applicationId/activities`

### Request

``` json
{
  "type": "RECRUITER_CONTACTED",
  "title": "Recruiter contacted me",
  "description": "Recruiter reached out on LinkedIn",
  "occurredAt": "2026-10-07T09:30:00Z"
}
```

### Response

``` http
201 Created
```

------------------------------------------------------------------------

# 36. Activity Update/Delete

Activity modification should be limited because history is valuable.

If editing/deleting is allowed:

``` text
PATCH /applications/:applicationId/activities/:activityId
DELETE /applications/:applicationId/activities/:activityId
```

The product should decide whether system-generated activities can be
edited.

A safer approach is:

> System-generated history should be immutable or tightly controlled.

------------------------------------------------------------------------

# 37. Follow-Ups API

Base:

``` text
/api/v1/followups
```

------------------------------------------------------------------------

# 38. List Follow-Ups

## GET `/followups`

Query parameters:

``` text
status
fromDate
toDate
applicationId
page
pageSize
```

Example:

``` text
GET /api/v1/followups?status=PENDING
```

------------------------------------------------------------------------

# 39. Create Follow-Up

## POST `/followups`

### Request

``` json
{
  "applicationId": "application_123",
  "title": "Follow up with recruiter",
  "description": "Ask about next steps",
  "dueAt": "2026-10-10T09:00:00Z"
}
```

### Response

``` http
201 Created
```

``` json
{
  "data": {
    "id": "followup_123",
    "status": "PENDING",
    "dueAt": "2026-10-10T09:00:00Z"
  }
}
```

------------------------------------------------------------------------

# 40. Get Follow-Up

## GET `/followups/:followUpId`

Returns one follow-up.

------------------------------------------------------------------------

# 41. Update Follow-Up

## PATCH `/followups/:followUpId`

Example:

``` json
{
  "title": "Follow up with recruiter tomorrow",
  "dueAt": "2026-10-11T09:00:00Z"
}
```

------------------------------------------------------------------------

# 42. Complete Follow-Up

Possible endpoint:

``` text
POST /followups/:followUpId/complete
```

Alternative:

``` text
PATCH /followups/:followUpId
```

with:

``` json
{
  "status": "COMPLETED"
}
```

For a simple REST design, PATCH is sufficient.

When completed, the backend may create a corresponding application
activity.

------------------------------------------------------------------------

# 43. Cancel Follow-Up

``` text
PATCH /followups/:followUpId
```

Request:

``` json
{
  "status": "CANCELLED"
}
```

------------------------------------------------------------------------

# 44. Interviews API

Base:

``` text
/api/v1/interviews
```

Interviews are application-scoped.

------------------------------------------------------------------------

# 45. List Interviews

## GET `/interviews`

Potential query parameters:

``` text
status
fromDate
toDate
applicationId
page
pageSize
```

------------------------------------------------------------------------

# 46. Create Interview

## POST `/interviews`

### Request

``` json
{
  "applicationId": "application_123",
  "roundName": "Technical Round 1",
  "scheduledAt": "2026-10-10T11:00:00Z",
  "interviewerName": "John Doe",
  "interviewType": "VIDEO",
  "meetingUrl": "https://meet.example.com/abc"
}
```

### Response

``` http
201 Created
```

------------------------------------------------------------------------

# 47. Get Interview

## GET `/interviews/:interviewId`

Returns interview details.

------------------------------------------------------------------------

# 48. Update Interview

## PATCH `/interviews/:interviewId`

Example:

``` json
{
  "scheduledAt": "2026-10-11T11:00:00Z",
  "status": "RESCHEDULED"
}
```

------------------------------------------------------------------------

# 49. Complete Interview

An interview can be completed by updating:

``` text
PATCH /interviews/:interviewId
```

with:

``` json
{
  "status": "COMPLETED",
  "notes": "Discussed React and system design",
  "outcome": "PASSED"
}
```

The backend may create an application timeline activity.

------------------------------------------------------------------------

# 50. Notes API

Notes are application-scoped.

Base:

``` text
/api/v1/applications/:applicationId/notes
```

------------------------------------------------------------------------

# 51. List Notes

## GET `/applications/:applicationId/notes`

Returns notes for the application.

------------------------------------------------------------------------

# 52. Create Note

## POST `/applications/:applicationId/notes`

### Request

``` json
{
  "content": "Prepare React performance questions before next round."
}
```

### Response

``` http
201 Created
```

------------------------------------------------------------------------

# 53. Update Note

## PATCH `/applications/:applicationId/notes/:noteId`

### Request

``` json
{
  "content": "Updated interview preparation notes."
}
```

------------------------------------------------------------------------

# 54. Delete Note

## DELETE `/applications/:applicationId/notes/:noteId`

### Response

``` http
204 No Content
```

------------------------------------------------------------------------

# 55. Connections API

Base:

``` text
/api/v1/connections
```

------------------------------------------------------------------------

# 56. List Connections

## GET `/connections`

Query parameters:

``` text
search
companyId
page
pageSize
```

------------------------------------------------------------------------

# 57. Create Connection

## POST `/connections`

### Request

``` json
{
  "name": "John Doe",
  "role": "Recruiter",
  "companyId": "company_123",
  "email": "john@example.com",
  "linkedinUrl": "https://linkedin.com/in/johndoe"
}
```

------------------------------------------------------------------------

# 58. Get Connection

## GET `/connections/:connectionId`

------------------------------------------------------------------------

# 59. Update Connection

## PATCH `/connections/:connectionId`

------------------------------------------------------------------------

# 60. Delete Connection

## DELETE `/connections/:connectionId`

Deletion should not automatically delete applications.

Application relationships should be handled according to the join-table
rules.

------------------------------------------------------------------------

# 61. Application ↔ Connection API

To associate a connection with an application:

## POST `/applications/:applicationId/connections`

### Request

``` json
{
  "connectionId": "connection_123",
  "relationshipType": "RECRUITER"
}
```

------------------------------------------------------------------------

# 62. List Application Connections

## GET `/applications/:applicationId/connections`

Returns contacts relevant to that application.

------------------------------------------------------------------------

# 63. Remove Application Connection

## DELETE `/applications/:applicationId/connections/:connectionId`

Removes the relationship without deleting the underlying connection.

------------------------------------------------------------------------

# 64. Dashboard API

The dashboard should avoid requiring the frontend to make many
independent requests if a single aggregated endpoint is appropriate.

## GET `/dashboard`

Example response:

``` json
{
  "data": {
    "stats": {
      "totalApplications": 25,
      "activeApplications": 12,
      "interviews": 4,
      "offers": 1,
      "rejections": 8
    },
    "needsAttention": [],
    "upcomingInterviews": [],
    "recentApplications": [],
    "recentActivity": []
  }
}
```

------------------------------------------------------------------------

# 65. Dashboard Design Principle

The dashboard endpoint should return information that directly supports
the dashboard.

It should not expose the entire database.

The backend can aggregate multiple queries into one useful response.

------------------------------------------------------------------------

# 66. Notification API

Base:

``` text
/api/v1/notifications
```

------------------------------------------------------------------------

# 67. List Notifications

## GET `/notifications`

Potential query parameters:

``` text
unread
page
pageSize
```

------------------------------------------------------------------------

# 68. Mark Notification Read

## PATCH `/notifications/:notificationId`

Request:

``` json
{
  "read": true
}
```

------------------------------------------------------------------------

# 69. Mark All Notifications Read

Possible endpoint:

``` text
POST /notifications/mark-all-read
```

or a PATCH collection operation.

The final choice should prioritize consistency with the rest of the API.

------------------------------------------------------------------------

# 70. User Settings API

Potential base:

``` text
/api/v1/me
```

or:

``` text
/api/v1/settings
```

Possible settings:

``` text
timezone
notification preferences
profile information
```

These should only be added as actual product requirements emerge.

------------------------------------------------------------------------

# 71. Health API

## GET `/health`

Response:

``` json
{
  "data": {
    "status": "ok"
  }
}
```

This endpoint may be public.

A deeper readiness endpoint can be added:

``` text
GET /ready
```

if infrastructure requires it.

------------------------------------------------------------------------

# 72. Pagination Contract

Collection endpoints should use a consistent pagination format.

Request:

``` text
?page=1&pageSize=20
```

Response:

``` json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

The server should enforce reasonable maximum page sizes.

Example:

``` text
pageSize <= 100
```

------------------------------------------------------------------------

# 73. Sorting Contract

Use:

``` text
sortBy
order
```

Example:

``` text
?sortBy=updatedAt&order=desc
```

Allowed sort fields should be explicitly whitelisted.

Never pass arbitrary client-provided field names directly into database
queries.

------------------------------------------------------------------------

# 74. Filtering Contract

Filters should use predictable parameter names.

Example:

``` text
?status=INTERVIEW
&companyId=company_123
&source=LINKEDIN
```

Date filters:

``` text
?fromDate=2026-10-01
&toDate=2026-10-31
```

The API should validate date formats.

------------------------------------------------------------------------

# 75. Search Contract

Example:

``` text
GET /applications?search=react
```

The search parameter should be treated as user input and safely
parameterized.

The backend should decide which fields are searchable.

------------------------------------------------------------------------

# 76. Authorization Pattern

For every protected resource:

``` text
Request
 ↓
Authenticate
 ↓
Extract currentUserId
 ↓
Load resource
 ↓
Verify ownership
 ↓
Perform operation
```

Do not do:

``` text
Request contains userId
 ↓
Trust userId
```

The authenticated identity is authoritative.

------------------------------------------------------------------------

# 77. Nested Resource Authorization

For:

``` text
GET /applications/:applicationId/notes
```

the backend must verify:

``` text
Note → Application → User
```

A user should not be able to access another user's notes by guessing an
application or note ID.

------------------------------------------------------------------------

# 78. Input Validation

Every create/update endpoint must validate:

-   required fields
-   data types
-   enum values
-   string lengths
-   dates
-   URLs
-   numeric ranges
-   IDs

Validation errors should return a consistent error response.

------------------------------------------------------------------------

# 79. Partial Update Semantics

PATCH should update only provided fields.

Example:

``` json
{
  "location": "Hyderabad"
}
```

should not reset:

``` text
status
salary
jobUrl
description
```

to null.

The service must distinguish:

-   field omitted
-   field explicitly set to null

where relevant.

------------------------------------------------------------------------

# 80. Idempotency

Normal GET requests are naturally safe.

For operations that may be retried by clients or workers, idempotency
should be considered.

Especially:

-   notification processing
-   external integrations
-   webhook processing
-   future job ingestion

The initial CRUD API does not need an idempotency-key requirement
everywhere.

------------------------------------------------------------------------

# 81. Concurrency

The API should handle simultaneous requests safely.

Example:

``` text
Browser Tab A → Status = INTERVIEW
Browser Tab B → Status = REJECTED
```

The final consistency behavior should be defined using database updates
and, where needed, optimistic concurrency/versioning.

Complex concurrency controls are not required unless real usage
demonstrates the need.

------------------------------------------------------------------------

# 82. API Transaction Examples

## Status Update

``` text
PATCH /applications/:id
       ↓
Update Application
       +
Create Activity
       ↓
COMMIT
```

## Complete Follow-Up

``` text
PATCH /followups/:id
       ↓
Update FollowUp
       +
Create Activity
       ↓
COMMIT
```

## Complete Interview

``` text
PATCH /interviews/:id
       ↓
Update Interview
       +
Create Activity
       ↓
COMMIT
```

------------------------------------------------------------------------

# 83. API Security Requirements

The API must:

-   require authentication for private resources
-   verify ownership
-   validate input
-   protect session credentials
-   use HTTPS in production
-   rate-limit sensitive endpoints
-   avoid leaking internal errors
-   avoid exposing secrets
-   log security-relevant failures appropriately

------------------------------------------------------------------------

# 84. API Versioning

The first public API version is:

``` text
/api/v1
```

Breaking changes should result in a new version where appropriate.

Avoid casually changing response structures once frontend clients depend
on them.

------------------------------------------------------------------------

# 85. API Documentation

The API should eventually have machine-readable documentation,
preferably using OpenAPI.

Potential workflow:

``` text
API Contract
     ↓
OpenAPI Specification
     ↓
Documentation
     ↓
Frontend/API testing
```

OpenAPI is useful but should not become a reason to delay MVP
implementation.

------------------------------------------------------------------------

# 86. API Testing

Critical endpoints should have integration tests.

### Authentication

-   login
-   refresh
-   logout
-   current user

### Applications

-   create
-   list
-   get
-   update
-   delete
-   status change
-   authorization

### Follow-Ups

-   create
-   list
-   update
-   complete

### Interviews

-   create
-   list
-   update
-   complete

### Notes

-   create
-   update
-   delete

### Dashboard

-   correct aggregation
-   user isolation

------------------------------------------------------------------------

# 87. Endpoint Summary

## Auth

``` text
GET    /auth/google
GET    /auth/google/callback
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
```

## Applications

``` text
GET    /applications
POST   /applications
GET    /applications/:id
PATCH  /applications/:id
DELETE /applications/:id
```

## Companies

``` text
GET    /companies
POST   /companies
GET    /companies/:id
PATCH  /companies/:id
DELETE /companies/:id
```

## Roles

``` text
GET    /roles
POST   /roles
GET    /roles/:id
PATCH  /roles/:id
```

## Activities

``` text
GET    /applications/:id/activities
POST   /applications/:id/activities
```

## Follow-Ups

``` text
GET    /followups
POST   /followups
GET    /followups/:id
PATCH  /followups/:id
```

## Interviews

``` text
GET    /interviews
POST   /interviews
GET    /interviews/:id
PATCH  /interviews/:id
```

## Notes

``` text
GET    /applications/:id/notes
POST   /applications/:id/notes
PATCH  /applications/:id/notes/:noteId
DELETE /applications/:id/notes/:noteId
```

## Connections

``` text
GET    /connections
POST   /connections
GET    /connections/:id
PATCH  /connections/:id
DELETE /connections/:id

GET    /applications/:id/connections
POST   /applications/:id/connections
DELETE /applications/:id/connections/:connectionId
```

## Dashboard

``` text
GET    /dashboard
```

## Notifications

``` text
GET    /notifications
PATCH  /notifications/:id
```

## Health

``` text
GET    /health
```

------------------------------------------------------------------------

# 88. Example Complete Application Workflow

## Create

``` http
POST /api/v1/applications
```

↓

``` text
Application created
```

## Recruiter Contact

``` http
POST /api/v1/applications/application_123/activities
```

↓

``` text
Recruiter contact recorded
```

## Follow-Up

``` http
POST /api/v1/followups
```

↓

``` text
Follow-up scheduled
```

## Interview

``` http
POST /api/v1/interviews
```

↓

``` text
Interview scheduled
```

## Interview Complete

``` http
PATCH /api/v1/interviews/interview_123
```

↓

``` text
Interview completed
+
Timeline updated
```

## Offer

``` http
PATCH /api/v1/applications/application_123
```

``` json
{
  "status": "OFFER"
}
```

↓

``` text
Application status updated
+
Timeline updated
```

------------------------------------------------------------------------

# 89. API Design Rules for Developers

When adding an endpoint:

1.  Identify the resource.
2.  Define ownership.
3.  Choose the correct HTTP method.
4.  Define request schema.
5.  Validate input.
6.  Define authorization.
7.  Define service-layer behavior.
8.  Define response schema.
9.  Define errors.
10. Add integration tests.
11. Document the endpoint.

Do not create endpoints simply because a database table exists.

The API should represent meaningful product operations.

------------------------------------------------------------------------

# 90. What Should Not Be Added Yet

Avoid prematurely adding:

-   GraphQL
-   multiple API versions
-   public API keys
-   webhooks everywhere
-   complex batch APIs
-   generic CRUD generators
-   arbitrary database query endpoints
-   complex query languages
-   microservice-specific APIs

The API should remain understandable.

------------------------------------------------------------------------

# 91. API Contract Checklist

Before implementation:

### Authentication

-   [ ] OAuth flow
-   [ ] refresh behavior
-   [ ] logout
-   [ ] current user

### Applications

-   [ ] CRUD
-   [ ] status
-   [ ] search
-   [ ] filters
-   [ ] sorting
-   [ ] pagination

### Timeline

-   [ ] list
-   [ ] create
-   [ ] system-generated events

### Follow-Ups

-   [ ] CRUD
-   [ ] completion
-   [ ] due dates

### Interviews

-   [ ] CRUD
-   [ ] scheduling
-   [ ] completion

### Notes

-   [ ] CRUD

### Connections

-   [ ] CRUD
-   [ ] application relationship

### Dashboard

-   [ ] summary
-   [ ] attention items
-   [ ] recent activity
-   [ ] upcoming interviews

### Security

-   [ ] authentication
-   [ ] authorization
-   [ ] validation
-   [ ] rate limiting
-   [ ] safe errors

------------------------------------------------------------------------

# 92. Final API Principle

> **The API should make the core job-search workflow easy to express
> while keeping authorization, validation, and business rules on the
> server.**

The ideal flow is:

``` text
React
  ↓
Clear REST API
  ↓
Domain Service
  ↓
Validated Database Operation
  ↓
Consistent Response
```

The API should be boring in a good way:

-   predictable
-   consistent
-   secure
-   easy to test
-   easy to debug
-   easy to extend

------------------------------------------------------------------------

# 93. Next Document

The next logical technical document is the:

**Authentication & Security Design Document**

It should go deeper into:

-   Google OAuth
-   session lifecycle
-   access tokens
-   refresh tokens
-   cookie security
-   token rotation
-   logout/revocation
-   CSRF
-   CORS
-   authorization
-   rate limiting
-   validation
-   secrets
-   security headers
-   threat model
-   account/session security
