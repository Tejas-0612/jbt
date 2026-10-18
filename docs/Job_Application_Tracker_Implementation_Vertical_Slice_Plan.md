# Job Application Tracker --- Implementation & Vertical Slice Plan

**Document Status:** Implementation Planning\
**Product:** Job Application Tracker\
**Purpose:** Convert the completed product and technical design into an
executable development plan

------------------------------------------------------------------------

# 1. Purpose

The architecture and product documentation are now complete enough to
begin implementation.

This document answers:

> **What should we actually build first, in what order, and when do we
> consider each part complete?**

The project should not return to another long planning cycle.

The implementation approach is:

``` text
Plan enough
   ↓
Build one vertical slice
   ↓
Run it
   ↓
Test it
   ↓
Learn
   ↓
Improve
   ↓
Build next slice
```

------------------------------------------------------------------------

# 2. Implementation Philosophy

The biggest risk at this stage is not lack of documentation.

The biggest risk is spending too much time planning and too little time
building.

Therefore:

-   Do not design every future feature before coding.
-   Do not create abstractions before they are needed.
-   Do not implement future AI/extension/mobile architecture now.
-   Do not build every infrastructure capability before the MVP needs
    it.
-   Validate each major decision through working software.

The documentation is the **map**.

The implementation is the **actual journey**.

------------------------------------------------------------------------

# 3. Definition of MVP

The MVP should allow a real job seeker to perform this complete
workflow:

``` text
Sign in
   ↓
Create application
   ↓
View applications
   ↓
Open application
   ↓
Change status
   ↓
Record activity
   ↓
Create follow-up
   ↓
Track interview
   ↓
Record outcome
   ↓
Understand current job-search state
```

If this workflow works reliably, the project has a meaningful MVP.

------------------------------------------------------------------------

# 4. Build Order

The recommended implementation order is:

1.  Repository foundation
2.  Database foundation
3.  Authentication
4.  Application creation
5.  Application list
6.  Application detail
7.  Status + activity timeline
8.  Notes
9.  Follow-ups
10. Interviews
11. Dashboard
12. Search/filtering
13. Notifications
14. Testing hardening
15. Production deployment
16. Real-user validation

This order follows the core workflow rather than building isolated
technical layers for weeks.

------------------------------------------------------------------------

# 5. Phase 0 --- Repository Foundation

Set up:

-   Monorepo or repository structure
-   Frontend application
-   Backend application
-   Shared types where genuinely useful
-   Environment configuration
-   Linting
-   TypeScript
-   Formatting
-   Git workflow
-   Basic CI

Possible structure:

``` text
job-application-tracker/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
│
├── packages/
│   └── shared/
│
├── prisma/
├── docs/
└── package.json
```

The exact structure can differ if a simpler repository layout is
preferable.

------------------------------------------------------------------------

# 6. Phase 0 Completion Criteria

Do not move forward until:

-   [ ] Frontend starts locally.
-   [ ] Backend starts locally.
-   [ ] PostgreSQL connects.
-   [ ] Redis can run locally if required.
-   [ ] Type checking works.
-   [ ] Linting works.
-   [ ] Basic CI works.
-   [ ] Environment variables are documented.
-   [ ] README explains local setup.

This phase should remain small.

------------------------------------------------------------------------

# 7. Phase 1 --- Database Foundation

Implement the initial Prisma schema.

Core entities:

``` text
User
Session
Company
Role
Application
Activity
FollowUp
Interview
Note
Connection
ApplicationConnection
Notification
```

Start with the entities required for the first vertical slice.

Do not implement every future field immediately.

------------------------------------------------------------------------

# 8. Database First Vertical Slice

The first meaningful database slice should support:

``` text
User
Company
Role
Application
Activity
```

The first application workflow needs these entities.

Create:

-   Prisma schema
-   Migration
-   Seed/test data
-   Basic database access
-   Ownership relationships
-   Required indexes

------------------------------------------------------------------------

# 9. Phase 2 --- Authentication

Implement:

-   Google OAuth
-   User creation/login
-   Session creation
-   Access token
-   Refresh session
-   Refresh rotation
-   Logout
-   Session revocation
-   Authentication middleware
-   Ownership context

The frontend should be able to:

``` text
Sign in
   ↓
Receive authenticated session
   ↓
Call protected API
   ↓
Sign out
```

------------------------------------------------------------------------

# 10. Authentication Completion Criteria

-   [ ] Google login works.
-   [ ] New user is created correctly.
-   [ ] Existing user can sign in.
-   [ ] Protected endpoints reject unauthenticated requests.
-   [ ] Access token expires appropriately.
-   [ ] Refresh flow works.
-   [ ] Refresh session can be revoked.
-   [ ] Logout works.
-   [ ] User identity is available to protected services.

Security tests should be added before continuing.

------------------------------------------------------------------------

# 11. Phase 3 --- First True Vertical Slice

This is the most important phase.

Build:

> **Create Application**

End-to-end:

``` text
React Form
   ↓
POST /api/v1/applications
   ↓
Validation
   ↓
Authorization
   ↓
Application Service
   ↓
Prisma
   ↓
PostgreSQL
   ↓
Response
   ↓
Frontend updates
```

This proves that the architecture actually works.

------------------------------------------------------------------------

# 12. Create Application Scope

The initial application form can contain:

-   Company
-   Role
-   Job URL
-   Applied date
-   Status
-   Location
-   Employment type
-   Salary where applicable
-   Notes

Do not add every imaginable field.

Only add fields that have a clear product purpose.

------------------------------------------------------------------------

# 13. Create Application Tests

Test:

### Success

``` text
Authenticated user
+
Valid application
=
Application created
```

### Validation

``` text
Invalid input
=
Validation error
```

### Authorization

``` text
User A
cannot create data belonging to User B
```

### Database

Verify persisted relationships.

------------------------------------------------------------------------

# 14. Phase 4 --- Application List

Build:

``` text
GET /api/v1/applications
```

Frontend:

``` text
Applications
├── Search
├── Filters
├── Sort
├── Pagination
└── Application rows/cards
```

Each application should show enough information to understand its
current state quickly.

------------------------------------------------------------------------

# 15. Application List Completion Criteria

The user should be able to:

-   See all relevant applications.
-   Navigate pages.
-   Filter by status.
-   Search basic information.
-   Sort by supported fields.
-   Open an application.
-   See loading state.
-   See empty state.
-   See error state.

------------------------------------------------------------------------

# 16. Phase 5 --- Application Detail

Build:

``` text
GET /api/v1/applications/:id
```

The detail page becomes the center of the product.

Suggested structure:

``` text
Application Header
├── Company
├── Role
├── Status
└── Actions

Overview
Timeline
Follow-ups
Interviews
Notes
Connections
```

Not every section needs to be fully implemented immediately.

Start with Overview + Timeline.

------------------------------------------------------------------------

# 17. Phase 6 --- Status and Timeline

Implement application status transitions and activity history.

Example statuses:

``` text
SAVED
APPLIED
RECRUITER_CONTACTED
SCREENING
INTERVIEW
OFFER
REJECTED
WITHDRAWN
```

The exact status list should follow the PRD.

Every meaningful state change should be traceable through the
application history where appropriate.

------------------------------------------------------------------------

# 18. Status Vertical Slice

Build:

``` text
Application Detail
      ↓
Change Status
      ↓
PATCH /applications/:id
      ↓
Persist status
      ↓
Create activity
      ↓
Refresh timeline
```

This is another complete end-to-end slice.

------------------------------------------------------------------------

# 19. Phase 7 --- Notes

Implement application notes.

The user should be able to:

-   Add note
-   Edit note
-   Delete note where appropriate
-   View notes
-   Associate note with the application

Keep the first implementation simple.

A rich editor is not required unless the product needs it.

------------------------------------------------------------------------

# 20. Phase 8 --- Follow-Ups

Implement:

``` text
FollowUp
├── due date
├── type
├── status
├── notes
└── completed date
```

User workflow:

``` text
Application
   ↓
Create follow-up
   ↓
View upcoming follow-up
   ↓
Complete follow-up
```

------------------------------------------------------------------------

# 21. Follow-Up Completion Criteria

-   [ ] Create follow-up.
-   [ ] Edit follow-up.
-   [ ] Complete follow-up.
-   [ ] Display upcoming follow-ups.
-   [ ] Display overdue follow-ups.
-   [ ] Associate follow-up with application.
-   [ ] Authorization tested.

------------------------------------------------------------------------

# 22. Phase 9 --- Interviews

Implement interview rounds.

Potential fields:

-   Round number
-   Interview type
-   Scheduled date/time
-   Interviewer
-   Notes
-   Result
-   Feedback

Workflow:

``` text
Application
   ↓
Add interview round
   ↓
Interview happens
   ↓
Record notes/result
   ↓
Continue / reject / offer
```

Do not build advanced interview preparation features yet.

------------------------------------------------------------------------

# 23. Phase 10 --- Dashboard

Only after the core application workflow exists should the dashboard be
built.

Dashboard should summarize:

-   Total applications
-   Active applications
-   Upcoming follow-ups
-   Upcoming interviews
-   Applications by status
-   Recent activity
-   Basic job-search metrics

The dashboard should help the user answer:

> **What is happening with my job search right now?**

------------------------------------------------------------------------

# 24. Dashboard Principle

The dashboard is not the product.

The application workflow is the product.

Avoid spending excessive time making the dashboard visually impressive
before the core workflow is useful.

------------------------------------------------------------------------

# 25. Phase 11 --- Search and Filtering

Expand filtering once enough real application data exists.

Possible filters:

-   Status
-   Company
-   Role
-   Date
-   Location
-   Employment type
-   Follow-up state

Search:

-   Company name
-   Role title
-   Other fields where useful

Start with PostgreSQL.

------------------------------------------------------------------------

# 26. Phase 12 --- Notifications

Implement basic notifications after follow-ups and interviews exist.

Potential notification:

``` text
Follow-up due tomorrow
```

or:

``` text
Interview tomorrow at 11:00 AM
```

The first version can be simple.

Avoid building a large notification platform before there are actual
notification events.

------------------------------------------------------------------------

# 27. Phase 13 --- Worker

Introduce the worker when background processing becomes necessary.

Initial jobs:

``` text
Follow-up reminder
Interview reminder
Notification processing
```

Worker flow:

``` text
Scheduler / API
      ↓
Redis Queue
      ↓
Worker
      ↓
Notification
```

------------------------------------------------------------------------

# 28. Phase 14 --- Testing Hardening

After the major vertical slices exist:

Add stronger coverage for:

-   Authentication
-   Authorization
-   Application CRUD
-   Status transitions
-   Timeline
-   Follow-ups
-   Interviews
-   Dashboard
-   Notifications
-   Ownership isolation

Add critical E2E tests.

------------------------------------------------------------------------

# 29. Phase 15 --- Production Readiness

Before real users:

-   Production environment
-   HTTPS
-   Managed PostgreSQL
-   Redis
-   Object storage
-   CI/CD
-   Monitoring
-   Logging
-   Backups
-   Health checks
-   Error tracking
-   Deployment rollback process

The product does not need every advanced infrastructure feature from the
roadmap.

It needs reliable basics.

------------------------------------------------------------------------

# 30. Phase 16 --- Real User Validation

This is where development becomes product development rather than pure
implementation.

Use the product yourself.

Add real applications.

Ask:

-   Is creating an application fast enough?
-   Is the detail page useful?
-   Do I actually use the timeline?
-   Are follow-ups easy?
-   Is the dashboard useful?
-   What information do I repeatedly enter?
-   What do I still track outside the application?

These observations should influence the next iteration.

------------------------------------------------------------------------

# 31. Vertical Slice Rule

Every major feature should follow:

``` text
Product requirement
      ↓
UX
      ↓
API
      ↓
Database
      ↓
Backend logic
      ↓
Frontend
      ↓
Tests
      ↓
Working feature
```

Avoid building:

``` text
All database tables
      ↓
All APIs
      ↓
All frontend screens
      ↓
Maybe connect everything later
```

The vertical approach reveals integration problems much earlier.

------------------------------------------------------------------------

# 32. AI-Assisted Development Workflow

AI can be used heavily without giving up engineering thinking.

Recommended workflow:

### Step 1 --- Think first

Before asking AI:

-   Define the problem.
-   Identify inputs/outputs.
-   Think about edge cases.
-   Sketch the solution.
-   Decide where the change belongs.

### Step 2 --- Ask AI for implementation help

Give AI:

-   Existing code
-   Architecture constraints
-   Desired behavior
-   Acceptance criteria

### Step 3 --- Review the generated solution

Ask:

-   Why does this work?
-   Is it consistent with the architecture?
-   What assumptions did AI make?
-   What could fail?
-   Is there a simpler implementation?

### Step 4 --- Test it

Do not trust generated code merely because it compiles.

### Step 5 --- Explain it yourself

If you cannot explain the implementation, spend time understanding it
before moving on.

------------------------------------------------------------------------

# 33. AI Prompt Pattern for Coding

A useful implementation prompt structure:

``` text
Context:
[Relevant architecture/code]

Problem:
[What needs to change]

Expected behavior:
[Acceptance criteria]

Constraints:
[Patterns/libraries/API conventions]

Before coding:
Explain your proposed approach and important edge cases.

Then:
Implement the change.

Finally:
Explain the files changed, important decisions,
and tests I should run.
```

This keeps AI in the role of an engineering assistant rather than
replacing the developer's reasoning.

------------------------------------------------------------------------

# 34. Developer Thinking Rule

For each meaningful feature, first answer these yourself:

``` text
What is the problem?
What data is required?
Where should the logic live?
What API is needed?
What database changes are needed?
What can go wrong?
How should authorization work?
How will I test it?
```

Only then ask AI for implementation help.

This is especially important for improving independent problem-solving
ability.

------------------------------------------------------------------------

# 35. Feature Completion Template

Every vertical slice should have:

``` text
Feature:
[Name]

User Problem:
[Why it exists]

Acceptance Criteria:
[What must work]

Database:
[Changes]

API:
[Endpoints]

Frontend:
[Screens/components]

Validation:
[Rules]

Authorization:
[Rules]

Tests:
[Required tests]

Done When:
[Observable completion state]
```

This should be enough planning for most MVP features.

------------------------------------------------------------------------

# 36. What Not to Do

Do not:

-   Create another architecture document for every small feature.
-   Design future AI infrastructure before AI exists.
-   Build the browser extension before manual capture is validated.
-   Build mobile before responsive web is validated.
-   Optimize for millions of users.
-   Create microservices for theoretical scale.
-   Build an advanced workflow engine for three reminders.
-   Ask AI to implement an entire product blindly.
-   Copy generated code without understanding it.
-   Spend weeks polishing documentation while the product remains
    unbuilt.

------------------------------------------------------------------------

# 37. First Development Milestone

The first milestone should be:

> **A user can sign in and create a real job application, and the
> application is persisted correctly in PostgreSQL.**

Everything else comes after this.

------------------------------------------------------------------------

# 38. First Major Milestone

The first major milestone should be:

> **A user can manage a real application from creation through status
> changes, activities, follow-ups, and interviews.**

This proves the central product loop.

------------------------------------------------------------------------

# 39. MVP Completion Criteria

The MVP is ready for real-world validation when:

-   [ ] Authentication works.
-   [ ] Application creation works.
-   [ ] Application list works.
-   [ ] Application detail works.
-   [ ] Status management works.
-   [ ] Timeline works.
-   [ ] Notes work.
-   [ ] Follow-ups work.
-   [ ] Interviews work.
-   [ ] Search/filtering works.
-   [ ] Dashboard works.
-   [ ] Basic notifications work.
-   [ ] Critical security tests pass.
-   [ ] Critical E2E flows pass.
-   [ ] Production deployment works.
-   [ ] Backups exist.
-   [ ] Monitoring exists.
-   [ ] The developer has used it with real applications.

------------------------------------------------------------------------

# 40. Recommended Implementation Sequence

``` text
Week / Iteration 1
├── Repository foundation
├── PostgreSQL
└── Authentication

Iteration 2
├── Company
├── Role
├── Application
└── Create Application vertical slice

Iteration 3
├── Application list
├── Search/filter basics
└── Application detail

Iteration 4
├── Status
├── Activity timeline
└── Notes

Iteration 5
├── Follow-ups
└── Reminder foundations

Iteration 6
├── Interviews
└── Interview timeline

Iteration 7
├── Dashboard
├── Analytics basics
└── Notifications

Iteration 8
├── Testing hardening
├── Performance review
└── Production readiness
```

These are implementation groupings, not fixed calendar deadlines.

------------------------------------------------------------------------

# 41. The Rule for Each Iteration

At the end of each iteration:

``` text
Can I use this feature?
       ↓
Yes → Continue
No  → Fix before expanding
```

Working software is the primary progress signal.

Not:

``` text
Number of documents created
Number of files created
Number of tickets created
```

------------------------------------------------------------------------

# 42. Final Implementation Philosophy

The project has now moved from:

``` text
"What should we build?"
```

to:

``` text
"Let's build it."
```

The correct next step is not another large planning exercise.

It is:

``` text
Repository
   ↓
Database
   ↓
Authentication
   ↓
Create Application
   ↓
Use It
   ↓
Improve It
```

------------------------------------------------------------------------

# 43. Final Decision

The Job Application Tracker will be implemented through **small,
end-to-end vertical slices**.

The first coding milestone is:

> **Sign in → create a real application → persist it → retrieve it →
> display it.**

After that, each major capability should be added to the working system
rather than designed in isolation.

The documentation now serves as a reference.

The implementation should become the main activity.

------------------------------------------------------------------------

# 44. Immediate Next Action

Do this next:

### Step 1

Create the repository structure.

### Step 2

Set up React + TypeScript.

### Step 3

Set up Node.js + TypeScript API.

### Step 4

Set up PostgreSQL + Prisma.

### Step 5

Create the first migration.

### Step 6

Implement authentication.

### Step 7

Build the first **Create Application** vertical slice.

### Step 8

Test it with one real application.

Then continue from there.

**Do not create another planning phase before completing this slice.**
