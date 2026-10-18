# Job Application Tracker --- Database Design Document

## Document Information

  Field           Value
  --------------- -------------------------------------------------
  Product         Job Application Tracker
  Document Type   Database Design Document
  Depends On      Product Discovery, PRD, UX, System Architecture
  Database        PostgreSQL
  ORM             Prisma
  Primary User    Individual job seeker
  Status          Working / MVP database design

------------------------------------------------------------------------

# 1. Purpose

This document defines the database design for the Job Application
Tracker.

The System Architecture established PostgreSQL as the primary source of
truth and defined the major domains.

This document turns those domains into an explicit relational model.

It covers:

-   entities
-   relationships
-   fields
-   primary keys
-   foreign keys
-   enums
-   constraints
-   indexes
-   timestamps
-   ownership
-   deletion behavior
-   transaction considerations
-   Prisma schema direction

The database should remain simple enough for an MVP while supporting the
product's future evolution.

------------------------------------------------------------------------

# 2. Database Principles

The database should follow these principles:

1.  PostgreSQL is the source of truth.
2.  Every user-owned resource has a clear ownership path.
3.  Relationships should be represented explicitly.
4.  Important business history should not be overwritten.
5.  Foreign keys should protect referential integrity.
6.  Constraints should prevent invalid states.
7.  Indexes should follow real query patterns.
8.  Schema complexity should match the MVP.
9.  Prisma migrations should be the source of schema changes.
10. Avoid premature denormalization.

------------------------------------------------------------------------

# 3. High-Level Entity Model

The core domain can be represented as:

``` text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
        Applications       Connections         Sessions
             │
     ┌───────┼────────┬──────────┬───────────┐
     │       │        │          │           │
     ▼       ▼        ▼          ▼           ▼
  Company   Role   Activities FollowUps  Interviews

             │
             ▼
           Notes
```

An application is the central domain entity.

------------------------------------------------------------------------

# 4. Entity Overview

The initial database contains these major entities:

  Entity                  Purpose
  ----------------------- ---------------------------------------------
  User                    Account and ownership
  Session                 Authentication sessions
  Company                 Employer/company
  Role                    Job/role opportunity
  Application             Candidate's application
  Activity                Application timeline/history
  FollowUp                Action/reminder associated with application
  Interview               Interview round
  Note                    Application context
  Connection              Recruiter/referral/contact
  ApplicationConnection   Application-contact relationship
  Notification            User notification/reminder record

Some entities can be deferred until the corresponding feature is
implemented.

------------------------------------------------------------------------

# 5. User

The `User` entity represents the person using the product.

## Fields

``` text
User
----
id
email
name
avatarUrl
createdAt
updatedAt
```

### Responsibilities

-   identify the account
-   own applications
-   own connections
-   own sessions
-   own preferences

------------------------------------------------------------------------

# 6. User ID

The primary key should use a non-sequential identifier such as UUID/CUID
depending on the project's final convention.

Example:

``` text
id String @id @default(cuid())
```

The exact identifier strategy can be finalized before implementation.

The important requirement is consistency across the schema.

------------------------------------------------------------------------

# 7. User Constraints

Potential constraints:

``` text
email UNIQUE
```

Email uniqueness should be enforced at the database level.

Application-level validation alone is insufficient.

------------------------------------------------------------------------

# 8. Session

Sessions support authenticated access.

## Fields

``` text
Session
-------
id
userId
refreshTokenHash
expiresAt
createdAt
updatedAt
revokedAt
```

Potential additional fields:

``` text
userAgent
ipAddress
lastUsedAt
```

These should only be stored if they provide a clear product/security
benefit.

------------------------------------------------------------------------

# 9. Session Relationship

``` text
User 1 ─────── N Session
```

One user may have multiple active sessions.

Example:

``` text
User
 ├── Laptop Session
 ├── Desktop Session
 └── Mobile Session
```

------------------------------------------------------------------------

# 10. Company

A company represents an employer.

## Fields

``` text
Company
-------
id
userId
name
website
description
location
linkedinUrl
createdAt
updatedAt
```

The exact fields can be reduced if the MVP does not require them.

------------------------------------------------------------------------

# 11. Company Ownership

For a personal job-search product, company records can initially be
user-scoped.

``` text
User
  |
  +-- Company
```

This means two users can independently have company records with the
same name.

This avoids prematurely introducing global/shared company data.

------------------------------------------------------------------------

# 12. Company Relationships

``` text
User 1 ───── N Company

Company 1 ───── N Application
```

A company can have multiple applications.

Example:

``` text
ABC Technologies
 ├── Frontend Developer
 ├── Full Stack Developer
 └── Backend Developer
```

------------------------------------------------------------------------

# 13. Role

A role represents the job opportunity.

## Fields

``` text
Role
----
id
companyId
title
description
jobUrl
location
employmentType
salaryMin
salaryMax
currency
createdAt
updatedAt
```

Some fields can remain optional.

------------------------------------------------------------------------

# 14. Role Relationships

``` text
Company 1 ───── N Role

Role 1 ───── N Application
```

A role may be referenced by an application.

However, the product should avoid forcing unnecessary normalization if
it creates a poor user experience.

The implementation should decide whether roles are:

-   explicitly reusable records
-   created automatically during application creation
-   embedded through application fields

The relational model supports the reusable approach.

------------------------------------------------------------------------

# 15. Application

The `Application` entity is the **core entity of the product**.

## Fields

``` text
Application
-----------
id
userId
companyId
roleId
status
source
jobUrl
appliedAt
location
employmentType
salaryMin
salaryMax
currency
description
createdAt
updatedAt
```

Potential future fields:

``` text
archivedAt
closedAt
```

------------------------------------------------------------------------

# 16. Application Ownership

Every application must belong to a user.

``` text
User 1 ───── N Application
```

Even if the application references a company and role, authorization
should always be traceable back to the user.

------------------------------------------------------------------------

# 17. Application Status

The MVP should use a controlled enum.

Possible values:

``` text
SAVED
APPLIED
RECRUITER_CONTACTED
INTERVIEW
OFFER
REJECTED
WITHDRAWN
```

The exact naming convention should be finalized before the Prisma
migration.

The database should not accept arbitrary status strings.

------------------------------------------------------------------------

# 18. Application Source

Source can represent where the opportunity came from.

Possible values:

``` text
LINKEDIN
NAUKRI
INDEED
COMPANY_WEBSITE
REFERRAL
RECRUITER
OTHER
```

The initial implementation may use a string instead of an enum if the
source list needs to remain highly flexible.

This is a product decision to finalize before implementation.

------------------------------------------------------------------------

# 19. Application Dates

Important date fields:

``` text
appliedAt
createdAt
updatedAt
```

The distinction is important.

`createdAt` means when the record was created.

`appliedAt` means when the candidate actually applied.

They should not be assumed to be identical.

------------------------------------------------------------------------

# 20. Activity

Activity represents an event in the application's history.

## Fields

``` text
Activity
--------
id
applicationId
type
title
description
occurredAt
metadata
createdAt
```

The activity entity is important because the product should preserve
history.

------------------------------------------------------------------------

# 21. Activity Types

Initial types may include:

``` text
APPLICATION_SUBMITTED
RECRUITER_CONTACTED
FOLLOW_UP_SENT
INTERVIEW_SCHEDULED
INTERVIEW_COMPLETED
OFFER_RECEIVED
REJECTION_RECEIVED
STATUS_CHANGED
NOTE_ADDED
CUSTOM
```

The exact list can evolve.

------------------------------------------------------------------------

# 22. Why Activity Is Separate From Application

The application stores the current state.

The activity table stores historical events.

Example:

``` text
Application.status = INTERVIEW
```

does not tell us:

``` text
Sep 20 → Applied
Sep 23 → Recruiter Contacted
Sep 25 → Follow-up Sent
Sep 28 → Interview Scheduled
```

Activities preserve this history.

------------------------------------------------------------------------

# 23. Activity Metadata

Some activity types may require additional structured information.

Example:

``` json
{
  "previousStatus": "APPLIED",
  "newStatus": "INTERVIEW"
}
```

PostgreSQL JSON/JSONB can be used for flexible event metadata where
appropriate.

However, important queryable business fields should not be hidden inside
JSON unnecessarily.

------------------------------------------------------------------------

# 24. FollowUp

A follow-up represents a future action.

## Fields

``` text
FollowUp
--------
id
userId
applicationId
title
description
dueAt
status
completedAt
createdAt
updatedAt
```

------------------------------------------------------------------------

# 25. Follow-Up Status

Possible values:

``` text
PENDING
COMPLETED
CANCELLED
```

A follow-up should not disappear when completed.

Keeping completed records provides useful history.

------------------------------------------------------------------------

# 26. Follow-Up Relationships

``` text
User 1 ───── N FollowUp

Application 1 ───── N FollowUp
```

The user association helps with efficient querying and authorization.

The application association preserves context.

------------------------------------------------------------------------

# 27. Follow-Up Rules

A pending follow-up should generally have:

``` text
completedAt = NULL
```

A completed follow-up should have:

``` text
completedAt != NULL
```

The service layer should enforce this state transition consistently.

------------------------------------------------------------------------

# 28. Interview

An interview represents an interview round associated with an
application.

## Fields

``` text
Interview
---------
id
applicationId
roundName
scheduledAt
interviewerName
interviewType
meetingUrl
status
notes
outcome
createdAt
updatedAt
```

------------------------------------------------------------------------

# 29. Interview Status

Possible values:

``` text
SCHEDULED
COMPLETED
CANCELLED
RESCHEDULED
```

The exact state model can be refined during implementation.

------------------------------------------------------------------------

# 30. Interview Relationship

``` text
Application 1 ───── N Interview
```

An application can contain multiple rounds.

Example:

``` text
Application
 ├── HR Screening
 ├── Technical Round 1
 ├── Technical Round 2
 └── Final HR
```

------------------------------------------------------------------------

# 31. Note

A note stores contextual information.

## Fields

``` text
Note
----
id
userId
applicationId
content
createdAt
updatedAt
```

A note belongs to a user and is associated with an application.

------------------------------------------------------------------------

# 32. Note Design Principle

Notes should remain simple.

The product should not attempt to become a full note-taking system.

The primary purpose is to preserve job-search context.

Examples:

``` text
Interview questions
Recruiter conversation
Company research
Salary discussion
Preparation notes
```

------------------------------------------------------------------------

# 33. Connection

A connection represents a person relevant to the job search.

Examples:

-   recruiter
-   employee
-   hiring manager
-   referral
-   professional contact

## Fields

``` text
Connection
----------
id
userId
name
role
companyId
email
phone
linkedinUrl
notes
createdAt
updatedAt
```

Most fields can be optional.

------------------------------------------------------------------------

# 34. ApplicationConnection

An application can involve multiple people.

A connection can also be relevant to multiple applications.

Therefore a many-to-many relationship may be useful.

``` text
Application
     N
     |
     |
ApplicationConnection
     |
     |
     N
Connection
```

Possible fields:

``` text
ApplicationConnection
---------------------
applicationId
connectionId
relationshipType
createdAt
```

Example:

``` text
John
 ├── Recruiter → Application A
 └── Referral  → Application B
```

------------------------------------------------------------------------

# 35. Notification

Notifications represent reminders or user-facing alerts.

## Fields

``` text
Notification
------------
id
userId
type
title
message
scheduledAt
sentAt
readAt
status
createdAt
```

This entity can be introduced when notification functionality is
implemented.

------------------------------------------------------------------------

# 36. Notification Relationship

``` text
User 1 ───── N Notification
```

Notifications are user-specific.

A notification may optionally reference another entity depending on
implementation.

------------------------------------------------------------------------

# 37. Entity Relationship Summary

The core relationships are:

``` text
User
 │
 ├───────────────< Session
 │
 ├───────────────< Company
 │                    │
 │                    └───────< Role
 │
 ├───────────────< Application
 │                    │
 │                    ├──── Company
 │                    ├──── Role
 │                    ├────< Activity
 │                    ├────< FollowUp
 │                    ├────< Interview
 │                    ├────< Note
 │                    └────< ApplicationConnection >──── Connection
 │
 ├───────────────< Connection
 │
 └───────────────< Notification
```

------------------------------------------------------------------------

# 38. Suggested Prisma Relationship Direction

Conceptually:

``` text
User
  applications Application[]
  companies    Company[]
  connections  Connection[]
  sessions     Session[]
  followUps    FollowUp[]
  notes        Note[]
  notifications Notification[]
```

Application:

``` text
Application
  user
  company
  role
  activities
  followUps
  interviews
  notes
  connections
```

The exact Prisma syntax should be written only after finalizing naming
and deletion decisions.

------------------------------------------------------------------------

# 39. Foreign Keys

Foreign keys should enforce relationships.

Examples:

``` text
Application.userId → User.id
Application.companyId → Company.id
Application.roleId → Role.id

Activity.applicationId → Application.id

FollowUp.userId → User.id
FollowUp.applicationId → Application.id

Interview.applicationId → Application.id

Note.userId → User.id
Note.applicationId → Application.id

Connection.userId → User.id
Connection.companyId → Company.id
```

------------------------------------------------------------------------

# 40. Deletion Strategy

Deletion behavior should be deliberate.

For application-owned child records:

``` text
Application
 ├── Activities
 ├── FollowUps
 ├── Interviews
 └── Notes
```

A practical MVP behavior is:

> Deleting an application deletes its dependent records.

This can use controlled cascading foreign keys.

However, permanent deletion should require explicit user confirmation.

------------------------------------------------------------------------

# 41. Company Deletion

Company deletion is more complicated because an application may
reference the company.

The preferred approach is to avoid casually deleting a company that is
still referenced.

Possible strategies:

1.  Prevent deletion while referenced.
2.  Archive the company.
3.  Soft-delete the company.

For MVP, preventing destructive deletion or providing archive behavior
is safer than cascading application deletion from company deletion.

------------------------------------------------------------------------

# 42. Role Deletion

Roles may similarly be referenced by applications.

A role should not be deleted in a way that unexpectedly deletes an
application.

A safe strategy is:

-   prevent deletion while referenced
-   or archive the role

------------------------------------------------------------------------

# 43. Soft Delete vs Hard Delete

The MVP does not need soft deletion everywhere.

Recommended approach:

### Applications

Hard delete with explicit confirmation, unless product requirements
later require recovery.

### Companies / Roles

Prefer archive/prevent deletion if referenced.

### Sessions

Revoke rather than immediately deleting where useful for security/audit.

### Notifications

Can be retained or cleaned up according to retention policy.

The important rule is not to add `deletedAt` to every table
automatically.

------------------------------------------------------------------------

# 44. Timestamps

Most mutable entities should contain:

``` text
createdAt
updatedAt
```

Entities representing time-based events should additionally have
domain-specific timestamps.

Examples:

``` text
Application.appliedAt
Activity.occurredAt
FollowUp.dueAt
Interview.scheduledAt
```

Do not use `createdAt` as a substitute for domain time.

------------------------------------------------------------------------

# 45. Time Zone Strategy

Date/time handling is important for:

-   interviews
-   follow-ups
-   reminders

A safe architecture is to store absolute timestamps in UTC and convert
them for display based on the user's timezone.

For date-only values such as an application date, the implementation
should distinguish them from timestamps.

------------------------------------------------------------------------

# 46. Index Strategy

Indexes should follow query patterns.

Likely indexes:

``` text
User.email

Application.userId
Application.status
Application.appliedAt
Application.updatedAt
Application.companyId
Application.roleId

Activity.applicationId
Activity.occurredAt

FollowUp.userId
FollowUp.applicationId
FollowUp.dueAt
FollowUp.status

Interview.applicationId
Interview.scheduledAt
Interview.status

Note.applicationId

Connection.userId
Connection.companyId

Notification.userId
Notification.scheduledAt
Notification.status
```

Composite indexes may be added after observing actual queries.

------------------------------------------------------------------------

# 47. Search Strategy

For the MVP, application search can initially use PostgreSQL-supported
text matching across selected fields.

Potential search fields:

-   company name
-   role title
-   notes

Do not introduce Elasticsearch or another search engine for the initial
product.

PostgreSQL should be sufficient.

------------------------------------------------------------------------

# 48. Uniqueness Rules

Avoid overly restrictive uniqueness.

For example, this should **not** necessarily be unique:

``` text
Company + Role
```

A candidate may legitimately apply to:

-   the same role twice
-   a similar role later
-   multiple openings at the same company

Uniqueness should only be added when the product requirement clearly
needs it.

------------------------------------------------------------------------

# 49. Application Status History

The current status should live on `Application`.

Historical changes should live in `Activity`.

Example:

``` text
Application.status = INTERVIEW

Activities:
1. APPLICATION_SUBMITTED
2. STATUS_CHANGED
3. RECRUITER_CONTACTED
4. INTERVIEW_SCHEDULED
```

This gives both:

-   fast current-state queries
-   historical context

------------------------------------------------------------------------

# 50. Transactions

The following should use database transactions where multiple writes
must remain consistent.

Example:

``` text
Update Application
+
Create Activity
```

Another example:

``` text
Create Interview
+
Create Activity
+
Schedule Reminder
```

The exact job scheduling transaction pattern depends on the queue
implementation.

------------------------------------------------------------------------

# 51. Data Integrity Rules

Important integrity rules include:

### Application

-   must belong to a user
-   status must be valid
-   company/role references must be valid when present

### Follow-Up

-   must belong to a user
-   must reference an application
-   completed state should correspond to completedAt

### Interview

-   must reference an application
-   scheduled time should be valid for scheduled interviews

### Note

-   must belong to a user
-   must reference an application

These rules should be enforced through a combination of:

-   database constraints
-   Prisma schema
-   backend validation
-   service-layer business rules

------------------------------------------------------------------------

# 52. Example Relational Schema

A simplified representation:

``` text
users
-----
id PK
email UNIQUE
name
avatar_url
created_at
updated_at


companies
---------
id PK
user_id FK → users.id
name
website
description
location
created_at
updated_at


roles
-----
id PK
company_id FK → companies.id
title
description
job_url
location
employment_type
created_at
updated_at


applications
------------
id PK
user_id FK → users.id
company_id FK → companies.id
role_id FK → roles.id
status
source
job_url
applied_at
created_at
updated_at


activities
----------
id PK
application_id FK → applications.id
type
title
description
occurred_at
metadata
created_at


follow_ups
----------
id PK
user_id FK → users.id
application_id FK → applications.id
title
description
due_at
status
completed_at
created_at
updated_at


interviews
----------
id PK
application_id FK → applications.id
round_name
scheduled_at
interviewer_name
interview_type
meeting_url
status
notes
outcome
created_at
updated_at


notes
-----
id PK
user_id FK → users.id
application_id FK → applications.id
content
created_at
updated_at


connections
-----------
id PK
user_id FK → users.id
company_id FK → companies.id
name
role
email
phone
linkedin_url
notes
created_at
updated_at


application_connections
-----------------------
application_id FK → applications.id
connection_id FK → connections.id
relationship_type
created_at


sessions
--------
id PK
user_id FK → users.id
refresh_token_hash
expires_at
revoked_at
created_at
updated_at


notifications
-------------
id PK
user_id FK → users.id
type
title
message
scheduled_at
sent_at
read_at
status
created_at
```

------------------------------------------------------------------------

# 53. Important Modeling Decision --- Application as Aggregate

The application should be treated as the primary aggregate for the
job-search workflow.

Conceptually:

``` text
Application
 ├── Activities
 ├── FollowUps
 ├── Interviews
 └── Notes
```

This makes application-centric operations easier to reason about.

The user owns the aggregate.

------------------------------------------------------------------------

# 54. API-to-Database Mapping

Example:

``` text
POST /applications
       ↓
ApplicationService
       ↓
Prisma
       ↓
applications
```

For application details:

``` text
GET /applications/:id
       ↓
ApplicationService
       ↓
Prisma
       ↓
application
 + company
 + role
 + activities
 + followUps
 + interviews
 + notes
```

Queries should select only the fields required by the API.

Avoid blindly loading every relation on every request.

------------------------------------------------------------------------

# 55. Database Query Principles

Avoid:

``` text
SELECT *
```

where it causes unnecessary data retrieval.

Prefer explicit selections.

Avoid N+1 queries.

For example, an application list should not make one company query for
every application if a single relational query can efficiently retrieve
the required data.

------------------------------------------------------------------------

# 56. Migration Strategy

Prisma migrations should be the source-controlled history of database
changes.

Example:

``` text
prisma/
  schema.prisma
  migrations/
    001_initial_schema/
    002_add_interviews/
    003_add_notifications/
```

Every schema change should be reviewed before production deployment.

------------------------------------------------------------------------

# 57. Seed Data

Development environments can contain seed data.

Example:

``` text
Demo User
Demo Companies
Demo Applications
Demo Interviews
Demo Follow-ups
```

Production should not accidentally receive development seed data.

------------------------------------------------------------------------

# 58. Database Testing

Integration tests should use an isolated test database.

Test important behavior:

-   foreign-key constraints
-   application ownership
-   status changes
-   cascade behavior
-   transactions
-   unique constraints
-   authorization queries

------------------------------------------------------------------------

# 59. Future Database Evolution

The schema should leave room for:

### Resume Files

``` text
Resume
  userId
  fileUrl
  name
```

### Application Attachments

``` text
Attachment
  applicationId
  fileUrl
```

### Job Source Tracking

More detailed source/provider information.

### Email Integration

External message IDs and processing metadata.

### Calendar Integration

External event IDs.

### AI Features

AI-generated summaries or suggestions should generally be stored
separately from original user data.

------------------------------------------------------------------------

# 60. What Should Not Be Added Yet

Do not prematurely add:

-   dozens of audit tables
-   complex event-sourcing tables
-   global company databases
-   generalized metadata tables for every entity
-   EAV schemas
-   multiple databases
-   search engines
-   complex soft-delete frameworks
-   excessive JSON fields

A relational schema should remain understandable to a developer opening
the project six months later.

------------------------------------------------------------------------

# 61. Prisma Schema Direction

A simplified conceptual Prisma model:

``` prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions      Session[]
  companies     Company[]
  applications  Application[]
  connections   Connection[]
  followUps     FollowUp[]
  notes         Note[]
  notifications Notification[]
}

model Application {
  id             String            @id @default(cuid())
  userId         String
  companyId      String?
  roleId         String?
  status         ApplicationStatus
  source         String?
  jobUrl         String?
  appliedAt      DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  user        User         @relation(fields: [userId], references: [id])
  company     Company?     @relation(fields: [companyId], references: [id])
  role        Role?        @relation(fields: [roleId], references: [id])
  activities  Activity[]
  followUps   FollowUp[]
  interviews  Interview[]
  notes       Note[]
}
```

This is **directional**, not the final production schema.

The final schema should be created after all naming, optionality, and
deletion decisions are frozen.

------------------------------------------------------------------------

# 62. Naming Conventions

Use consistent naming.

Recommended:

### Database

``` text
snake_case
```

Example:

``` text
created_at
application_id
```

### Prisma / TypeScript

``` text
camelCase
```

Example:

``` text
createdAt
applicationId
```

The project should select one database naming strategy and apply it
consistently.

------------------------------------------------------------------------

# 63. Enum Strategy

Enums should be used when values are controlled and meaningful.

Good candidates:

``` text
ApplicationStatus
InterviewStatus
FollowUpStatus
NotificationStatus
```

For highly user-defined values such as arbitrary sources, a string may
be more flexible.

Do not turn every field into an enum.

------------------------------------------------------------------------

# 64. Nullability

Optional information should be nullable.

For example:

``` text
jobUrl
salary
interviewerName
meetingUrl
description
```

should not be mandatory if the user may legitimately not know it.

Required fields should represent information essential to the entity.

------------------------------------------------------------------------

# 65. Database Design Checklist

Before implementation, verify:

### Entities

-   [ ] User
-   [ ] Session
-   [ ] Company
-   [ ] Role
-   [ ] Application
-   [ ] Activity
-   [ ] FollowUp
-   [ ] Interview
-   [ ] Note
-   [ ] Connection
-   [ ] Notification

### Relationships

-   [ ] User ownership
-   [ ] Application → Company
-   [ ] Application → Role
-   [ ] Application → Activities
-   [ ] Application → FollowUps
-   [ ] Application → Interviews
-   [ ] Application → Notes
-   [ ] Application ↔ Connections

### Integrity

-   [ ] Foreign keys
-   [ ] Constraints
-   [ ] Indexes
-   [ ] Timestamps
-   [ ] Transaction boundaries
-   [ ] Deletion behavior

### Security

-   [ ] User isolation
-   [ ] Session storage
-   [ ] Sensitive fields protected

------------------------------------------------------------------------

# 66. Final Database Architecture

The core database can be summarized as:

``` text
                         USER
                          │
         ┌────────────────┼─────────────────┐
         │                │                 │
         ▼                ▼                 ▼
      SESSION         COMPANY          CONNECTION
                          │                 │
                          ▼                 │
                         ROLE               │
                          │                 │
                          └──────┐    ┌─────┘
                                 ▼    ▼
                              APPLICATION
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
               ▼                  ▼                  ▼
            ACTIVITY           FOLLOW-UP          INTERVIEW
               │
               │
               ▼
              NOTE

USER
 │
 └─────────────── NOTIFICATION
```

The application remains the central object.

------------------------------------------------------------------------

# 67. Final Database Principle

> **Model the real job-search domain clearly, preserve important
> history, enforce ownership and integrity at the database/backend
> boundary, and avoid adding complexity before the product needs it.**

The database should make the core workflow easy to understand:

``` text
User
 ↓
Application
 ↓
Current Status
 ↓
History
 ↓
Next Actions
 ↓
Interviews
 ↓
Outcome
```

That is the heart of the Job Application Tracker.

------------------------------------------------------------------------

# 68. Next Document

The next technical artifact should be the:

**API Design Document**

It should define the actual API contract, including:

-   endpoint catalog
-   HTTP methods
-   request parameters
-   request bodies
-   response structures
-   error codes
-   pagination
-   filtering
-   sorting
-   authentication requirements
-   authorization behavior
-   status transitions
-   follow-up APIs
-   interview APIs
-   notes APIs
-   dashboard APIs
-   example requests/responses
