# Job Application Tracker --- Product Requirements Document (PRD)

## Document Information

  Field           Value
  --------------- -----------------------------------------------------------
  Product         Job Application Tracker
  Document Type   Product Requirements Document
  Product Stage   MVP
  Primary User    Individual job seeker
  Core Object     Job Application
  Status          Working / reconstructed from previous product discussions

------------------------------------------------------------------------

# 1. Purpose of This Document

This PRD defines **what the Job Application Tracker should actually
do**.

The Product Discovery document established:

-   why the product should exist
-   who it is for
-   the problems it solves
-   the product vision
-   the product principles
-   the initial MVP boundary

This document moves one level deeper and defines:

-   the MVP feature set
-   user flows
-   functional requirements
-   application lifecycle
-   data relationships
-   dashboard behavior
-   follow-ups
-   interviews
-   notes
-   filtering and search
-   notifications/reminders
-   reporting
-   non-functional expectations
-   MVP priorities
-   future features that should not be built yet

The goal is to prevent the project from becoming an unnecessarily large
product before the core workflow has been validated.

------------------------------------------------------------------------

# 2. Product Summary

The Job Application Tracker is a personal application-management system
for people actively looking for a job.

Instead of managing job applications across:

-   Excel/Google Sheets
-   browser bookmarks
-   LinkedIn
-   email
-   calendar
-   personal notes
-   task managers

the user should have one place where each job application and everything
related to it can be managed.

The central idea is:

> **An application should contain the complete context of the
> candidate's journey with that opportunity.**

That means an application can be connected to:

-   company
-   role
-   application status
-   application date
-   timeline/activity
-   follow-ups
-   interviews
-   notes
-   recruiter/contact information
-   referral/networking information
-   outcome

------------------------------------------------------------------------

# 3. Product Vision

> **Build a personal operating system for a candidate's job search.**

The MVP should not attempt to build the entire long-term vision.

The first goal is much simpler:

> Make it significantly easier for a job seeker to know what they
> applied to, where each application stands, what happened, and what
> they need to do next.

------------------------------------------------------------------------

# 4. Target User

## 4.1 Primary User

An individual actively searching for a job.

Typical characteristics:

-   applying to multiple jobs
-   using multiple job platforms
-   communicating with recruiters
-   attending interviews
-   following up with companies
-   talking to referrals/connections
-   losing track of application status
-   wanting to understand job-search progress

## 4.2 Initial Product Focus

The first version is **candidate-first**.

It is not initially intended for:

-   recruiters
-   hiring teams
-   companies
-   enterprise HR departments

------------------------------------------------------------------------

# 5. Core User Problems

The product should solve these problems first.

## 5.1 Losing Track of Applications

A candidate may have dozens of applications and no reliable way to
remember:

-   when they applied
-   which role they applied for
-   current status
-   recruiter/contact
-   next action

## 5.2 Forgetting Follow-Ups

A candidate may intend to follow up after:

-   applying
-   an interview
-   recruiter communication
-   a technical round
-   an HR discussion

but forget to do so.

## 5.3 Losing Interview Context

Candidates often need to remember:

-   which round they completed
-   who interviewed them
-   what was discussed
-   what they were asked
-   what the next step is

## 5.4 Scattered Information

Information about one opportunity can exist in:

-   email
-   LinkedIn
-   WhatsApp
-   notes
-   calendar
-   browser tabs
-   spreadsheets

The product should bring the important context together.

## 5.5 Lack of Job-Search History

After applying to many jobs, candidates should be able to understand:

-   how many applications they made
-   how many progressed
-   how many interviews they received
-   how many were rejected
-   where their opportunities are currently stuck

------------------------------------------------------------------------

# 6. Core Product Concept

The most important product decision is:

> **The Application is the core object.**

Everything important should connect back to an application.

Conceptually:

``` text
User
 |
 +-- Applications
       |
       +-- Company
       |
       +-- Role
       |
       +-- Timeline / Activities
       |
       +-- Follow-ups
       |
       +-- Interviews
       |
       +-- Notes
       |
       +-- Connections / Contacts
       |
       +-- Outcome
```

This prevents the product from becoming a collection of unrelated
features.

------------------------------------------------------------------------

# 7. Core Product Workflow

The primary workflow is:

``` text
Find Job
   ↓
Save / Apply
   ↓
Create Application
   ↓
Track Status
   ↓
Record Activity
   ↓
Take Next Action
   ↓
Follow Up / Interview
   ↓
Record Outcome
   ↓
Learn From History
```

The MVP should make this workflow easy.

------------------------------------------------------------------------

# 8. MVP Scope

## 8.1 MVP Features

The initial MVP should include:

1.  Authentication
2.  Dashboard
3.  Application management
4.  Application details
5.  Application status tracking
6.  Application timeline/activity history
7.  Follow-ups
8.  Interview rounds
9.  Notes
10. Search and filtering
11. Basic reminders/notifications
12. Basic job-search statistics

------------------------------------------------------------------------

# 9. Authentication

## 9.1 Goal

Allow a user to securely create and access their personal job-search
workspace.

## 9.2 Initial Authentication Direction

The previously discussed direction is:

-   Google OAuth
-   no traditional password authentication in the initial version
-   backend-controlled authorization
-   session-based refresh mechanism
-   support for multiple active sessions/devices

Authentication implementation details belong in the System Architecture
document, but the PRD requirement is simply that each user's data is
private to that user.

## 9.3 Requirements

The system should allow the user to:

-   sign in
-   sign out
-   maintain a session
-   access only their own applications
-   have their data isolated from other users

------------------------------------------------------------------------

# 10. Dashboard

The dashboard is the user's starting point after login.

## 10.1 Dashboard Goals

The dashboard should answer:

> **"What is happening with my job search right now?"**

## 10.2 Key Information

The dashboard should show useful high-level information such as:

-   total applications
-   active applications
-   interviews
-   pending follow-ups
-   offers
-   rejections
-   applications by status
-   recent activity
-   upcoming interviews
-   overdue/pending follow-ups

## 10.3 Dashboard Should Not Become an Analytics Platform

The first dashboard should prioritize actionable information.

For example:

``` text
12 Active Applications
3 Interviews Upcoming
4 Follow-ups Due
2 Offers
8 Rejections
```

The user should immediately understand what needs attention.

------------------------------------------------------------------------

# 11. Application Management

Application management is the most important MVP feature.

## 11.1 Create Application

The user should be able to create a new application.

### Core information

An application can contain:

-   company
-   role/job title
-   job URL
-   application date
-   source/platform
-   current status
-   location
-   employment type
-   salary information where relevant
-   description
-   notes

Not every field needs to be mandatory.

The creation experience should avoid excessive data entry.

## 11.2 Edit Application

The user should be able to modify application information after
creation.

## 11.3 Delete Application

The user should be able to delete an application.

Because deletion can remove related information, the final
implementation should define whether:

-   related records are deleted automatically
-   related records are archived
-   deletion requires confirmation

------------------------------------------------------------------------

# 12. Application Status

The application needs a clear lifecycle.

The exact status list should remain simple in the MVP.

A possible initial status model:

``` text
Saved
Applied
Recruiter Contacted
Interview
Offer
Rejected
Withdrawn
```

The product should avoid creating dozens of statuses.

The status should answer:

> "Where does this application currently stand?"

------------------------------------------------------------------------

# 13. Application List

The user should have a page containing all applications.

Each application should provide enough information to understand it
quickly.

Example:

  --------------------------------------------------------------------------
  Company        Role           Status         Applied        Next Action
  -------------- -------------- -------------- -------------- --------------
  Company A      Frontend       Interview      Sep 20         Technical
                 Developer                                    Round

  Company B      Full Stack     Applied        Sep 22         Follow Up
                 Developer                                    

  Company C      Software       Rejected       Sep 15         ---
                 Engineer                                     
  --------------------------------------------------------------------------

## 13.1 Requirements

The user should be able to:

-   view applications
-   search applications
-   filter applications
-   sort applications
-   open application details
-   update status
-   perform relevant actions

------------------------------------------------------------------------

# 14. Search and Filtering

As application count grows, the user should not have to manually scan
the entire list.

## 14.1 Search

Search should support useful fields such as:

-   company
-   role
-   notes

## 14.2 Filters

Useful initial filters include:

-   status
-   company
-   source
-   date range
-   location

## 14.3 Sorting

Useful sorting options include:

-   newest application
-   oldest application
-   recently updated
-   upcoming activity

The final set can be refined during implementation.

------------------------------------------------------------------------

# 15. Application Details

The application details page is the main workspace for one job
opportunity.

It should bring together the application's context.

Example structure:

``` text
Company
Role
Status
Application Date
Job URL

--------------------------------

Timeline

--------------------------------

Upcoming Follow-ups

--------------------------------

Interview Rounds

--------------------------------

Notes

--------------------------------

Contacts / Connections
```

The user should not need to search through multiple unrelated pages to
understand an application.

------------------------------------------------------------------------

# 16. Application Timeline

The timeline is an important part of the product.

Instead of storing only the current status, the product should preserve
what happened over time.

## 16.1 Example

``` text
Sep 20
Applied

Sep 23
Recruiter contacted candidate

Sep 25
Follow-up sent

Sep 28
Technical interview scheduled

Oct 02
Technical interview completed

Oct 04
HR interview scheduled
```

## 16.2 Why Timeline Matters

The timeline gives the user:

-   historical context
-   a record of interactions
-   interview history
-   follow-up history
-   a clearer understanding of progress

The application therefore becomes a history of the candidate's journey
rather than just a status field.

------------------------------------------------------------------------

# 17. Follow-Ups

Follow-ups are one of the important action-oriented features.

## 17.1 Create Follow-Up

A user should be able to create a follow-up associated with an
application.

A follow-up can contain:

-   title
-   description/note
-   due date
-   status
-   completion date

## 17.2 Follow-Up States

A simple model can use:

``` text
Pending
Completed
Cancelled
```

## 17.3 Follow-Up Workflow

Example:

``` text
Interview completed
       ↓
Create follow-up
       ↓
Due date arrives
       ↓
User receives reminder
       ↓
User contacts recruiter
       ↓
Mark follow-up complete
```

## 17.4 Follow-Up Visibility

Pending follow-ups should appear:

-   on the dashboard
-   on the relevant application
-   in a follow-up view/list

------------------------------------------------------------------------

# 18. Interviews

Interview tracking should be connected to an application.

## 18.1 Interview Round

An application can have multiple interview rounds.

Example:

``` text
Application
   |
   +-- HR Screening
   |
   +-- Technical Round 1
   |
   +-- Technical Round 2
   |
   +-- Managerial Round
   |
   +-- HR / Final Round
```

## 18.2 Interview Information

An interview round can contain:

-   round name
-   scheduled date/time
-   interviewer
-   type
-   status
-   meeting link
-   notes
-   outcome
-   feedback

## 18.3 Interview States

Possible states:

``` text
Scheduled
Completed
Cancelled
Rescheduled
```

The exact model can be finalized during technical design.

------------------------------------------------------------------------

# 19. Notes

Users should be able to store contextual notes.

Notes can be useful for:

-   recruiter conversations
-   interview preparation
-   interview questions
-   company research
-   salary discussion
-   personal observations
-   next steps

Notes should be associated with the relevant application whenever
possible.

The product should not attempt to become a full note-taking application.

------------------------------------------------------------------------

# 20. Companies

Companies should be reusable entities rather than duplicated text
everywhere.

An application can reference a company.

A company may have:

-   name
-   website
-   description
-   location
-   social links
-   notes

The exact company model should remain lightweight in the MVP.

------------------------------------------------------------------------

# 21. Roles / Jobs

A role represents the job opportunity.

Potential information:

-   title
-   description
-   job URL
-   location
-   employment type
-   salary information
-   source

A role can be associated with a company and application.

The data model should avoid unnecessary complexity here.

------------------------------------------------------------------------

# 22. Connections / Networking

Networking was discussed as an important part of the broader product.

A user may have:

-   recruiter
-   referral
-   employee contact
-   hiring manager
-   other professional connection

A connection may contain:

-   name
-   company
-   role
-   email/contact information
-   LinkedIn/social URL
-   notes

Connections can be associated with applications.

### MVP principle

Networking should be useful but lightweight.

It should not turn the product into a CRM in the first version.

------------------------------------------------------------------------

# 23. Notifications and Reminders

The product should eventually help the user remember important actions.

Examples:

-   follow-up due
-   interview approaching
-   overdue action

The first implementation should be simple.

The product should avoid building a complicated notification engine
before the core workflow is proven.

------------------------------------------------------------------------

# 24. Basic Analytics / Reporting

The product should provide enough reporting to answer basic questions.

Examples:

-   applications this week/month
-   applications by status
-   interviews obtained
-   offers
-   rejections
-   application-to-interview conversion
-   application-to-offer conversion

The purpose is to help the user understand their job search.

Advanced analytics are not part of the initial MVP.

------------------------------------------------------------------------

# 25. Example End-to-End User Journey

Consider a user applying for a Full Stack Developer role.

### Step 1 --- Create Application

The user enters:

``` text
Company: ABC Technologies
Role: Full Stack Developer
Source: LinkedIn
Applied: Today
Job URL: ...
Status: Applied
```

### Step 2 --- Recruiter Contact

The recruiter contacts the candidate.

The user updates the application and records the activity.

``` text
Status → Recruiter Contacted
```

### Step 3 --- Follow-Up

The user creates:

``` text
Follow-up:
Contact recruiter about next steps

Due:
Friday
```

### Step 4 --- Interview

The recruiter schedules a technical interview.

The user creates:

``` text
Technical Round 1
Date: Friday
Status: Scheduled
```

### Step 5 --- Interview Completed

The user records:

-   questions
-   interviewer
-   notes
-   outcome

### Step 6 --- Next Round

A second interview is scheduled.

The application timeline now contains the entire journey.

### Step 7 --- Outcome

Eventually:

``` text
Status → Offer
```

The user can now see the complete history of that opportunity.

------------------------------------------------------------------------

# 26. Core User Stories

## Authentication

**US-001**

As a user, I want to sign in so that I can access my job-search data.

**US-002**

As a user, I want my applications to be private so that another user
cannot access them.

------------------------------------------------------------------------

## Applications

**US-003**

As a user, I want to create an application so that I can track a job I
applied for.

**US-004**

As a user, I want to edit an application so that its information remains
accurate.

**US-005**

As a user, I want to delete an application so that I can remove unwanted
records.

**US-006**

As a user, I want to update an application's status so that I know where
it stands.

------------------------------------------------------------------------

## Application Discovery

**US-007**

As a user, I want to search my applications so that I can quickly find a
job.

**US-008**

As a user, I want to filter applications so that I can focus on specific
opportunities.

**US-009**

As a user, I want to sort applications so that I can organize my work.

------------------------------------------------------------------------

## Timeline

**US-010**

As a user, I want to see an application's history so that I understand
everything that happened.

**US-011**

As a user, I want activities to be associated with an application so
that the context is preserved.

------------------------------------------------------------------------

## Follow-Ups

**US-012**

As a user, I want to create a follow-up so that I do not forget
important actions.

**US-013**

As a user, I want to see pending follow-ups so that I know what I need
to do.

**US-014**

As a user, I want to mark a follow-up as completed so that my task list
stays accurate.

------------------------------------------------------------------------

## Interviews

**US-015**

As a user, I want to create interview rounds so that I can track my
interview process.

**US-016**

As a user, I want to record interview notes so that I can remember what
happened.

**US-017**

As a user, I want to see upcoming interviews so that I can prepare.

------------------------------------------------------------------------

## Notes

**US-018**

As a user, I want to attach notes to an application so that important
context is not lost.

------------------------------------------------------------------------

## Dashboard

**US-019**

As a user, I want to see a dashboard so that I can understand my current
job-search situation.

**US-020**

As a user, I want to see pending actions so that I know what requires my
attention.

------------------------------------------------------------------------

# 27. Functional Requirements

## FR-001 --- User Authentication

The system shall allow users to authenticate and establish a secure
session.

## FR-002 --- User Isolation

The system shall ensure that users can access only their own job-search
data.

## FR-003 --- Application Creation

The system shall allow a user to create an application.

## FR-004 --- Application Update

The system shall allow a user to edit an application.

## FR-005 --- Application Deletion

The system shall allow a user to delete an application.

## FR-006 --- Application Status

The system shall allow a user to update the status of an application.

## FR-007 --- Application Listing

The system shall display the user's applications.

## FR-008 --- Application Search

The system shall allow users to search applications.

## FR-009 --- Application Filtering

The system shall allow users to filter applications.

## FR-010 --- Application Details

The system shall provide a detailed view of an application.

## FR-011 --- Timeline

The system shall maintain an activity history for an application.

## FR-012 --- Follow-Ups

The system shall allow users to create, view, update, and complete
follow-ups.

## FR-013 --- Interviews

The system shall allow users to manage multiple interview rounds for an
application.

## FR-014 --- Notes

The system shall allow users to store application-related notes.

## FR-015 --- Dashboard

The system shall provide a dashboard containing useful job-search
information.

## FR-016 --- Reminders

The system should provide reminders for relevant pending actions.

## FR-017 --- Basic Analytics

The system should provide basic job-search statistics.

------------------------------------------------------------------------

# 28. Non-Functional Requirements

## 28.1 Security

User data must be protected.

The backend must verify ownership/authorization for every user-owned
resource.

## 28.2 Performance

Common operations should feel fast:

-   opening dashboard
-   loading applications
-   searching
-   filtering
-   opening application details

## 28.3 Reliability

User-created application data should not be lost during normal
operation.

## 28.4 Maintainability

The codebase should use clear modular boundaries so the product can grow
without becoming difficult to change.

## 28.5 Scalability

The initial system does not need massive scale.

However, architecture should avoid decisions that make future growth
unnecessarily difficult.

------------------------------------------------------------------------

# 29. MVP Priority

A practical implementation priority is:

## P0 --- Must Have

-   Authentication
-   Application CRUD
-   Application list
-   Application details
-   Status management
-   Basic timeline
-   Basic dashboard

## P1 --- Important

-   Follow-ups
-   Interviews
-   Notes
-   Search
-   Filters
-   Basic reminders

## P2 --- After Core MVP

-   Advanced analytics
-   Networking improvements
-   richer reporting
-   automation
-   integrations
-   AI capabilities

------------------------------------------------------------------------

# 30. Explicitly Out of MVP

The following should **not** be allowed to expand the initial MVP
unnecessarily.

## Not Now

### AI-first features

Do not add AI simply because AI is popular.

Potential AI features should be introduced only when a real user problem
is identified.

### Browser Extension

A browser extension could eventually allow:

``` text
Find Job
   ↓
Click Extension
   ↓
Capture Job
   ↓
Create Application
```

But this should come after the core application workflow works.

### Mobile App

A dedicated mobile application is a future possibility.

The initial product can be web-first.

### Enterprise / Team Accounts

The product should not initially become:

-   recruiter software
-   enterprise ATS
-   collaborative hiring platform

### Advanced Automation

Do not start with a large workflow engine.

### Complex Notification Infrastructure

Start with only the reminders that provide clear value.

### Public API

There is no need for a public API in the first version.

### Offline-First Architecture

Offline functionality is not an initial requirement.

------------------------------------------------------------------------

# 31. Future Product Opportunities

Once the core workflow is validated, the product could expand.

## 31.1 Browser Extension

Capture job postings directly from job sites.

## 31.2 Calendar Integration

Automatically connect interviews with the user's calendar.

## 31.3 Email Integration

Potentially detect recruiter communication and application updates.

## 31.4 AI Assistance

Possible future examples:

-   summarize job descriptions
-   prepare interview questions
-   analyze application history
-   suggest follow-up timing
-   identify patterns in applications
-   help tailor resumes
-   generate follow-up messages

AI should remain **problem-driven**, not feature-driven.

## 31.5 Advanced Analytics

Potential metrics:

-   source conversion rate
-   company response rate
-   role conversion rate
-   interview conversion
-   offer conversion
-   time between stages
-   average time to response

## 31.6 Job Search Automation

Long-term automation could help reduce repetitive work.

However, automation should be added only after the underlying workflow
is reliable.

------------------------------------------------------------------------

# 32. Product Design Principles

## Principle 1 --- Application First

The application is the center of the system.

## Principle 2 --- Context Over Isolated Records

Information should remain connected to the opportunity it belongs to.

## Principle 3 --- Actionable Over Decorative

The product should tell the user what matters and what needs attention.

## Principle 4 --- Simple Before Powerful

Do not add complexity just because the product can support it.

## Principle 5 --- Manual Before Automated

First understand the workflow manually.

Then automate the parts that repeatedly create friction.

## Principle 6 --- AI Must Solve a Problem

AI should not become a feature checklist.

## Principle 7 --- Build Vertically

A feature is not finished when only the frontend or backend exists.

A meaningful feature should work end-to-end.

------------------------------------------------------------------------

# 33. Suggested MVP Screens

The initial product can be built around a small number of screens.

``` text
1. Login
      ↓
2. Dashboard
      ↓
3. Applications
      ↓
4. Create Application
      ↓
5. Application Details
      ├── Timeline
      ├── Follow-ups
      ├── Interviews
      └── Notes
```

Potential later screens:

``` text
6. Follow-ups
7. Interviews
8. Analytics
9. Connections
10. Settings
```

The exact navigation can be refined during UX design.

------------------------------------------------------------------------

# 34. Vertical Slice Implementation Strategy

Instead of building every frontend screen first and then every backend
service, the product should be built in working vertical slices.

## Slice 1

``` text
Authentication
   ↓
Dashboard shell
```

## Slice 2

``` text
Create Application
   ↓
Backend API
   ↓
Database
   ↓
Application List
```

## Slice 3

``` text
Application Details
   ↓
Status
   ↓
Timeline
```

## Slice 4

``` text
Follow-Ups
   ↓
Due Dates
   ↓
Dashboard Visibility
```

## Slice 5

``` text
Interviews
   ↓
Interview Timeline
   ↓
Upcoming Interviews
```

## Slice 6

``` text
Notes
   ↓
Search
   ↓
Filters
```

This approach keeps the product usable throughout development.

------------------------------------------------------------------------

# 35. Acceptance Criteria for the Core MVP

The MVP should be considered meaningfully usable when a user can
complete the following journey without manual database or developer
intervention:

``` text
Sign In
   ↓
Create a job application
   ↓
See it in the application list
   ↓
Open application details
   ↓
Change application status
   ↓
See the change reflected in the timeline
   ↓
Create a follow-up
   ↓
See the follow-up on the dashboard
   ↓
Create an interview round
   ↓
See the interview associated with the application
   ↓
Add notes
   ↓
Return later and understand the complete application history
```

This is more important than having a large number of features.

------------------------------------------------------------------------

# 36. Success Criteria

The first version should be evaluated based on whether it solves the
original problem.

The product is successful if users can:

-   stop relying on scattered spreadsheets for applications
-   quickly understand their current applications
-   remember what happened with an opportunity
-   avoid missing important follow-ups
-   keep interview information organized
-   return to an application and immediately understand its context

The strongest validation is repeated usage during a real job search.

------------------------------------------------------------------------

# 37. Risks

## Risk 1 --- Too Much Data Entry

If creating an application takes too long, users may return to
spreadsheets.

### Response

Keep the initial form simple and allow information to be added later.

------------------------------------------------------------------------

## Risk 2 --- Feature Creep

The product can easily grow into:

-   CRM
-   ATS
-   AI assistant
-   automation platform
-   analytics platform
-   job discovery platform

### Response

Keep the application-management workflow as the center.

------------------------------------------------------------------------

## Risk 3 --- Building Before Validating

A large architecture and feature set can be built without knowing
whether users actually need it.

### Response

Build a small working product and use it.

------------------------------------------------------------------------

## Risk 4 --- Overusing AI

AI can make development faster but can also hide weak product thinking.

### Response

Decide the product behavior first. Use AI primarily to help implement,
review, test, and improve it.

------------------------------------------------------------------------

# 38. Open Questions

These decisions should be finalized before or during implementation
rather than assumed permanently.

1.  Exact application status values
2.  Exact required fields for application creation
3.  Whether companies and roles are created independently or
    automatically during application creation
4.  Exact timeline event types
5.  Whether deleted applications are hard-deleted or archived
6.  Exact notification channels
7.  Reminder scheduling behavior
8.  Exact interview fields
9.  Exact analytics shown in the first dashboard
10. Whether networking is included in the first MVP release or
    immediately after it

These are implementation/product refinement questions, not reasons to
delay the entire project.

------------------------------------------------------------------------

# 39. What This PRD Does Not Define

This PRD intentionally does not fully define:

-   database implementation details
-   Prisma schema
-   exact API request/response schemas
-   React component architecture
-   infrastructure configuration
-   deployment architecture
-   CI/CD implementation
-   detailed authentication token mechanics
-   exact cloud services
-   detailed UI pixel specifications

Those belong in the appropriate technical/design documents.

------------------------------------------------------------------------

# 40. Relationship With Other Product Documents

The project should be thought of as a sequence:

``` text
Product Discovery
       ↓
PRD
       ↓
UX / User Flows
       ↓
System Architecture
       ↓
Database Design
       ↓
API Design
       ↓
Implementation
       ↓
Testing
       ↓
Deployment
```

The important distinction is:

### Product Discovery

Answers:

> Why are we building this and for whom?

### PRD

Answers:

> What exactly should the product do?

### Architecture

Answers:

> How should we technically build it?

------------------------------------------------------------------------

# 41. Final MVP Definition

The Job Application Tracker MVP is a **candidate-first personal
job-search management application** centered around the application
lifecycle.

Its core promise is:

> **Know every application, understand what happened, and know what to
> do next.**

The MVP therefore focuses on:

``` text
Applications
    +
Status
    +
Timeline
    +
Follow-Ups
    +
Interviews
    +
Notes
    +
Dashboard
```

Everything else should be evaluated against this core promise.

If a feature does not significantly improve this workflow, it should
probably wait.

------------------------------------------------------------------------

# 42. Next Document

After this PRD is finalized, the next logical product artifact is the
**UX / User Flow specification** or, if the original project sequence is
being followed, the **System Architecture Document**.

Before implementation, the most important thing is not to create more
documentation indefinitely.

The practical next step should be:

> **Freeze the MVP scope, choose the first vertical slice, and start
> building it.**
