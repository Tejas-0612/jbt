# Job Application Tracker --- UX & User Flow Specification

## Document Information

  Field           Value
  --------------- -----------------------------------------------
  Product         Job Application Tracker
  Document Type   UX / User Flow Specification
  Depends On      Product Discovery + PRD
  Product Stage   MVP
  Primary User    Individual job seeker
  Status          Working / reconstructed product specification

------------------------------------------------------------------------

# 1. Purpose

This document defines how a user should move through the Job Application
Tracker.

The PRD defined **what the product should do**.

This document defines:

-   the main user journeys
-   navigation
-   page responsibilities
-   important interactions
-   forms
-   empty states
-   loading/error states
-   application lifecycle flows
-   follow-up flows
-   interview flows
-   dashboard behavior
-   MVP UX priorities

The goal is to keep the product simple and focused.

------------------------------------------------------------------------

# 2. Core UX Principle

The product should answer three questions quickly:

> **What have I applied to?**

> **What happened with each application?**

> **What do I need to do next?**

Every major screen should support at least one of these questions.

------------------------------------------------------------------------

# 3. Core UX Model

The application is the center of the experience.

``` text
Dashboard
    |
    +---- Applications
              |
              +---- Application Details
                        |
                        +---- Timeline
                        +---- Follow-ups
                        +---- Interviews
                        +---- Notes
                        +---- Contacts
```

The user should be able to move from a high-level overview to the
complete context of one application without unnecessary navigation.

------------------------------------------------------------------------

# 4. Primary Navigation

The MVP navigation should remain small.

Recommended structure:

``` text
Sidebar / Navigation

Dashboard
Applications
Follow-ups
Interviews

----------------

Settings
```

Potential future navigation:

``` text
Analytics
Connections
Integrations
AI Tools
```

These should not clutter the first version.

------------------------------------------------------------------------

# 5. Main Screens

The MVP should revolve around these screens:

1.  Authentication
2.  Dashboard
3.  Applications
4.  Create Application
5.  Application Details
6.  Follow-ups
7.  Interviews
8.  Settings

Some features can be represented as sections or dialogs rather than
separate pages.

------------------------------------------------------------------------

# 6. Authentication Flow

## 6.1 Login

Initial flow:

``` text
Open App
   ↓
Login Page
   ↓
Continue with Google
   ↓
Authentication
   ↓
Dashboard
```

## 6.2 First-Time User

A new user should reach a useful starting point quickly.

Possible flow:

``` text
First Login
   ↓
Dashboard
   ↓
No Applications
   ↓
"Add your first application"
   ↓
Create Application
```

The user should not be forced through a long onboarding process.

------------------------------------------------------------------------

# 7. Dashboard UX

The dashboard is the user's command center.

## 7.1 Primary Goal

The dashboard should answer:

> **"What requires my attention today?"**

rather than simply displaying numbers.

## 7.2 Recommended Structure

``` text
------------------------------------------------
Dashboard

Good morning, [Name]

[Applications] [Interviews] [Follow-ups] [Offers]

------------------------------------------------

Needs Attention

• Follow-up due today
• Interview tomorrow
• Application waiting for response

------------------------------------------------

Recent Applications

Company A — Frontend Developer — Interview
Company B — Full Stack Developer — Applied
Company C — Software Engineer — Recruiter Contacted

------------------------------------------------

Recent Activity

Application updated
Interview completed
Follow-up completed
------------------------------------------------
```

## 7.3 Dashboard Priority

The visual hierarchy should generally be:

1.  actions requiring attention
2.  upcoming interviews/follow-ups
3.  active applications
4.  recent activity
5.  statistics

Statistics should not dominate the page.

------------------------------------------------------------------------

# 8. Empty Dashboard

For a new user:

``` text
Welcome!

You don't have any applications yet.

Start tracking your job search by adding your first application.

[ + Add Application ]
```

The empty state should explain what to do next.

Avoid displaying a large collection of empty charts.

------------------------------------------------------------------------

# 9. Applications Page

The Applications page is the main data-management screen.

## 9.1 Layout

``` text
Applications

[ Search applications... ]

[Status] [Company] [Source] [Date]       [Sort]

                                      [+ Add Application]

----------------------------------------------------

Company       Role                 Status       Applied
ABC           Frontend Developer  Interview    Sep 20
XYZ           Full Stack Dev      Applied      Sep 22
DEF           Software Engineer   Rejected     Sep 15
```

## 9.2 Application Row

Each row/card should expose:

-   company
-   role
-   status
-   application date
-   next action where available

The user should be able to open the application directly.

------------------------------------------------------------------------

# 10. Application Creation Flow

Creating an application should be fast.

## 10.1 Primary Flow

``` text
Applications
   ↓
+ Add Application
   ↓
Application Form
   ↓
Save Application
   ↓
Application Details
```

## 10.2 Suggested Form

### Required / Core

``` text
Company
Role
Application Date
Status
```

### Optional

``` text
Job URL
Source
Location
Employment Type
Salary
Description
Notes
```

The exact required fields should be finalized during implementation.

## 10.3 UX Principle

Do not ask the user for every possible piece of information during
creation.

A user should be able to create:

``` text
Company + Role + Date + Status
```

and fill in additional information later.

------------------------------------------------------------------------

# 11. Application Details UX

This is the most important screen in the product.

The user should be able to understand the complete opportunity from this
page.

## 11.1 Suggested Layout

``` text
------------------------------------------------
< Back to Applications

Frontend Developer
ABC Technologies

[Interview ▼]

Applied Sep 20
LinkedIn
Location

[Edit] [More]
------------------------------------------------

NEXT ACTION

Technical interview
Tomorrow at 11:00 AM

------------------------------------------------

TIMELINE

Sep 20   Applied
Sep 23   Recruiter contacted
Sep 25   Follow-up sent
Sep 28   Technical interview scheduled

------------------------------------------------

INTERVIEWS

Technical Round 1
Tomorrow — Scheduled

------------------------------------------------

FOLLOW-UPS

Recruiter follow-up
Due Friday

------------------------------------------------

NOTES

Interview preparation...
------------------------------------------------
```

The exact visual design can evolve, but the information hierarchy should
remain.

------------------------------------------------------------------------

# 12. Status Update Flow

Changing status should be quick.

``` text
Application Details
   ↓
Status selector
   ↓
Select new status
   ↓
Save
   ↓
Status updated
   ↓
Timeline records change
```

Example:

``` text
Applied
   ↓
Recruiter Contacted
```

The system should preserve the history instead of silently replacing the
previous state.

------------------------------------------------------------------------

# 13. Timeline UX

The timeline should visually communicate progress.

Example:

``` text
● Oct 04
  Technical interview completed
  "Discussed React architecture..."

● Oct 02
  Technical interview scheduled

● Sep 28
  Recruiter contacted

● Sep 20
  Application submitted
```

Newest activity can appear first or last depending on the final design.

The important requirement is consistency.

------------------------------------------------------------------------

# 14. Adding an Activity

The user should be able to record an important event.

Possible interaction:

``` text
[ + Add Activity ]

Activity Type
[ Recruiter Contact ▼ ]

Date
[ 04 Oct 2026 ]

Notes
[ ... ]

[ Save ]
```

The activity model should remain simple.

Possible initial activity types:

-   Application submitted
-   Recruiter contact
-   Follow-up sent
-   Interview scheduled
-   Interview completed
-   Offer received
-   Rejection received
-   Custom note/activity

------------------------------------------------------------------------

# 15. Follow-Up UX

## 15.1 Creating a Follow-Up

From an application:

``` text
Application Details
   ↓
+ Add Follow-up
   ↓
Title
Description
Due Date
   ↓
Save
```

## 15.2 Follow-Up List

The dedicated Follow-ups page can show:

``` text
Follow-ups

OVERDUE
────────────────────
ABC Technologies
Contact recruiter
Due yesterday

TODAY
────────────────────
XYZ
Ask about interview result
Due today

UPCOMING
────────────────────
DEF
Follow up after interview
Due Oct 10
```

This page should be action-oriented.

------------------------------------------------------------------------

# 16. Follow-Up Completion

Flow:

``` text
Pending Follow-up
   ↓
User completes action
   ↓
Mark Complete
   ↓
Follow-up becomes Completed
   ↓
Activity can appear in timeline
```

The user should not need to manually reconstruct the history after
completing a follow-up if the system can reasonably record the
completion.

------------------------------------------------------------------------

# 17. Interview UX

## 17.1 Creating an Interview

``` text
Application Details
   ↓
+ Add Interview
   ↓
Interview Form
```

Suggested fields:

``` text
Round Name
Date
Time
Interviewer
Interview Type
Meeting Link
Notes
Status
```

## 17.2 Interview Detail

The user should be able to see:

``` text
Technical Round 1

Scheduled:
Oct 10, 11:00 AM

Interviewer:
John Doe

Type:
Video

Meeting:
[Join Meeting]

Notes:
...

Status:
Scheduled
```

------------------------------------------------------------------------

# 18. Upcoming Interview Experience

Upcoming interviews should be visible from the dashboard.

Example:

``` text
Upcoming

Tomorrow — 11:00 AM
ABC Technologies
Technical Round 1

[View Application]
```

The user should be able to reach the application context directly.

------------------------------------------------------------------------

# 19. Interview Completion Flow

``` text
Interview Scheduled
       ↓
Interview Happens
       ↓
Open Interview
       ↓
Mark Completed
       ↓
Add Notes / Outcome
       ↓
Save
       ↓
Application Timeline Updated
```

This keeps the interview connected to the broader application journey.

------------------------------------------------------------------------

# 20. Notes UX

Notes should be easy to add without creating a separate note-management
workflow.

From application details:

``` text
Notes

[ + Add Note ]

Interview preparation
--------------------
Need to revise system design.

Interview questions
--------------------
React performance
API design
Database indexing
```

Notes are contextual information, not a separate productivity product.

------------------------------------------------------------------------

# 21. Company and Contact UX

A user may interact with several people during an application.

Example:

``` text
Contacts

Jane — Recruiter
John — Engineering Manager
Mike — Employee Referral
```

The user should be able to associate relevant contacts with the
application.

The first version should keep contact management lightweight.

------------------------------------------------------------------------

# 22. Search UX

Search should be immediately accessible on the Applications page.

Example:

``` text
[ Search company, role, notes... ]
```

As the user types:

``` text
"frontend"
```

the list should narrow to relevant applications.

Search should not require a separate search page in the MVP.

------------------------------------------------------------------------

# 23. Filtering UX

Filters should be simple and removable.

Example:

``` text
Status: Interview ×
Source: LinkedIn ×
```

A clear option should exist:

``` text
Clear Filters
```

The user should always understand why an application is or is not
visible.

------------------------------------------------------------------------

# 24. Sorting UX

Useful sorting options:

``` text
Newest Applied
Oldest Applied
Recently Updated
Upcoming Activity
```

Avoid providing too many sorting options initially.

------------------------------------------------------------------------

# 25. Delete Flow

Deleting an application is destructive.

Flow:

``` text
Application Details
   ↓
More
   ↓
Delete
   ↓
Confirmation Dialog
```

Example:

``` text
Delete this application?

This will remove the application and its
associated information.

[Cancel] [Delete]
```

The exact cascading behavior is a backend/data-model decision.

------------------------------------------------------------------------

# 26. Loading States

Every data-dependent screen should have a clear loading state.

Example:

``` text
Applications
----------------
Loading applications...
```

For the application details page:

``` text
Loading application...
```

Avoid blank screens while data is loading.

------------------------------------------------------------------------

# 27. Error States

Errors should be understandable.

Bad:

``` text
Error 500
```

Better:

``` text
We couldn't load your applications.

Please try again.

[Retry]
```

For failed saves:

``` text
We couldn't save this application.

Your changes were not saved.

[Try Again]
```

------------------------------------------------------------------------

# 28. Empty States

Important empty states should provide a next action.

## No Applications

``` text
No applications yet.

Start tracking your job search.

[Add Application]
```

## No Follow-Ups

``` text
No pending follow-ups.

You're all caught up! 🎉
```

## No Interviews

``` text
No interviews scheduled.

Interviews associated with your applications
will appear here.
```

## No Search Results

``` text
No applications found.

Try changing your search or filters.
```

------------------------------------------------------------------------

# 29. Responsive UX

The product should be web-first and responsive.

The primary desktop experience can use:

-   sidebar navigation
-   tables/lists
-   detailed application workspace

On smaller screens:

-   sidebar can collapse
-   application rows can become cards
-   detail sections can stack vertically
-   actions should remain accessible

A separate mobile application is not required for MVP.

------------------------------------------------------------------------

# 30. UX Rules for Forms

Forms should follow a few rules.

### Rule 1

Ask only for information needed at that moment.

### Rule 2

Use sensible defaults.

### Rule 3

Show validation close to the field.

### Rule 4

Do not erase user-entered data after validation errors.

### Rule 5

Make Save/Cancel behavior predictable.

### Rule 6

Avoid extremely long forms.

------------------------------------------------------------------------

# 31. UX Rules for Status

Status should always be visible in important application contexts.

For example:

-   application list
-   application details
-   dashboard
-   relevant follow-up/interview context

Status should have a consistent visual treatment throughout the product.

------------------------------------------------------------------------

# 32. UX Rules for Dates

Dates are important because job-search actions are time-sensitive.

The UI should make it obvious whether something is:

-   upcoming
-   due today
-   overdue
-   completed

Example:

``` text
Due today
Due tomorrow
Overdue by 2 days
Completed Oct 03
```

This is more useful than showing only raw dates.

------------------------------------------------------------------------

# 33. Important Interaction: "What Next?"

The product should encourage the user toward the next useful action.

For example, an application could show:

``` text
Current Status:
Interview

Next Action:
Prepare for technical interview

[View Interview]
```

Or:

``` text
Current Status:
Applied

No next action scheduled.

[Create Follow-up]
```

This is an important part of making the product more useful than a
spreadsheet.

------------------------------------------------------------------------

# 34. Core UX Journey

The complete intended journey is:

``` text
                    ┌───────────────┐
                    │    Dashboard  │
                    └───────┬───────┘
                            │
                     Add Application
                            │
                            ▼
                    ┌───────────────┐
                    │  Application  │
                    │     List      │
                    └───────┬───────┘
                            │
                       Open Job
                            │
                            ▼
                    ┌───────────────┐
                    │  Application  │
                    │    Details    │
                    └───────┬───────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
          Timeline       Follow-ups     Interviews
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                          Notes
                            │
                            ▼
                         Outcome
```

------------------------------------------------------------------------

# 35. Primary Happy Path

The most important UX path should be extremely smooth.

``` text
Login
 ↓
Dashboard
 ↓
Add Application
 ↓
Save
 ↓
Application Details
 ↓
Update Status
 ↓
Add Follow-up
 ↓
Add Interview
 ↓
Complete Interview
 ↓
Add Notes
 ↓
Final Outcome
```

If this flow works well, the MVP has achieved its primary purpose.

------------------------------------------------------------------------

# 36. UX Priority

Not every screen deserves equal design effort.

## Highest Priority

1.  Application creation
2.  Application list
3.  Application details
4.  Timeline
5.  Dashboard
6.  Follow-ups

## Medium Priority

7.  Interviews
8.  Notes
9.  Search/filtering
10. Settings

## Lower Priority

11. Advanced analytics
12. Networking management
13. Integrations
14. AI features

------------------------------------------------------------------------

# 37. What the UX Should Avoid

The product should avoid:

-   too many dashboards
-   excessive charts
-   giant forms
-   too many statuses
-   unnecessary confirmation dialogs
-   hidden actions
-   complex navigation
-   feature-heavy onboarding
-   forcing users to enter everything immediately
-   AI everywhere
-   turning the product into a CRM
-   turning the product into a project-management tool

The experience should feel like a **focused job-search workspace**.

------------------------------------------------------------------------

# 38. MVP UX Validation Checklist

Before considering the UX ready for implementation, verify that a user
can answer:

### Applications

-   Can I add an application quickly?
-   Can I find it later?
-   Can I update its status?
-   Can I delete it?

### Context

-   Can I understand everything that happened with an application?
-   Can I see important notes?
-   Can I see related interviews and contacts?

### Actions

-   Can I create a follow-up?
-   Can I see what is due?
-   Can I see upcoming interviews?

### Overview

-   Can I understand my current job search from the dashboard?

### Usability

-   Are empty states clear?
-   Are errors understandable?
-   Are forms short enough?
-   Is the next action obvious?

If these answers are yes, the UX is serving the MVP.

------------------------------------------------------------------------

# 39. Design Direction

The final visual design should prioritize:

-   clarity
-   information hierarchy
-   fast scanning
-   low cognitive load
-   consistent components
-   obvious actions
-   useful whitespace
-   responsive behavior

The product does not need to look extremely complex to feel
professional.

A clean interface with excellent information organization is more
valuable than visual decoration.

------------------------------------------------------------------------

# 40. Relationship With Other Documents

The current product documentation sequence is:

``` text
Product Discovery
       ↓
PRD
       ↓
UX / User Flows       ← THIS DOCUMENT
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

The UX document defines **how the user experiences the product**.

The System Architecture document will define **how the technical system
supports that experience**.

------------------------------------------------------------------------

# 41. Final UX Definition

The Job Application Tracker should feel like:

> **A calm, focused workspace where a job seeker can open the product
> and immediately understand their job-search situation.**

The experience should revolve around one simple loop:

``` text
Application
     ↓
What happened?
     ↓
What is happening now?
     ↓
What should I do next?
```

Everything in the MVP should reinforce this loop.

------------------------------------------------------------------------

# 42. Next Document

The next technical document should be the:

**System Architecture Document (SAD)**

It should translate the product and UX requirements into the technical
structure required to build the system, including:

-   frontend architecture
-   backend architecture
-   database architecture
-   authentication architecture
-   API architecture
-   security
-   background jobs
-   notifications
-   file storage
-   observability
-   testing
-   deployment
-   CI/CD
-   architectural decisions
-   future evolution
