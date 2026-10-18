# Job Application Tracker --- Product Discovery Document

**Document Type:** Product Discovery\
**Product:** Job Application Tracker\
**Status:** Historical reconstruction / working product discovery
document\
**Purpose:** Establish the problem, users, opportunity, product
direction, assumptions, and boundaries before writing the PRD.

------------------------------------------------------------------------

# 1. Executive Summary

Job searching is often managed using a combination of spreadsheets,
browser bookmarks, emails, notes, calendars, LinkedIn messages, and
memory.

This becomes increasingly difficult when a person applies to many
companies or manages multiple interview processes at the same time.

The proposed **Job Application Tracker** is a personal job-search
management product that brings the important parts of the job-search
journey into one place.

The product should help a candidate:

-   remember where they applied,
-   understand the current state of every application,
-   track follow-ups,
-   manage interview rounds,
-   keep notes and history,
-   remember recruiter/referral connections,
-   understand their job-search performance,
-   and eventually automate repetitive parts of the process.

The important product insight is that this should **not** be treated as
simply another application spreadsheet.

The long-term opportunity is to build a **personal operating system for
a job search**.

------------------------------------------------------------------------

# 2. Why We Are Exploring This Product

The original idea came from a simple observation:

> Once someone starts applying seriously, keeping track of everything
> manually becomes difficult.

A candidate may have:

-   applied through LinkedIn,
-   applied through a company career page,
-   spoken with a recruiter,
-   received an email,
-   scheduled an interview,
-   promised to follow up,
-   received a referral,
-   changed the application status,
-   and taken interview notes.

These events are usually spread across different tools.

The candidate therefore has to maintain the context themselves.

The product opportunity is to make the **job application itself the
center of the workflow**.

------------------------------------------------------------------------

# 3. Problem Statement

## Primary Problem

Job seekers lack a simple system that keeps the entire job-search
process organized from application through final outcome.

Existing solutions often solve only one part of the problem:

-   spreadsheets store data,
-   calendars store events,
-   email stores communication,
-   LinkedIn stores networking,
-   notes apps store thoughts,
-   task managers store reminders.

The user is responsible for connecting all of these pieces.

## Core Problem

> **A candidate should not have to remember the state, history, next
> action, and context of every job application manually.**

------------------------------------------------------------------------

# 4. Problems Experienced by the User

## 4.1 Losing Track of Applications

A candidate may remember applying to a company but forget:

-   when they applied,
-   which role they applied for,
-   where they found it,
-   which job URL they used,
-   whether the recruiter responded,
-   or what the current status is.

------------------------------------------------------------------------

## 4.2 Forgetting Follow-Ups

A common workflow is:

> Apply → wait → wonder whether to follow up → forget → miss the
> opportunity.

There is no reliable place to track:

-   when a follow-up should happen,
-   whether it was completed,
-   what was communicated,
-   and when the next follow-up should occur.

------------------------------------------------------------------------

## 4.3 Losing Interview Context

When several interviews happen across different companies, candidates
can forget:

-   who interviewed them,
-   which round they attended,
-   what questions were asked,
-   what they answered,
-   what they struggled with,
-   what the interviewer said,
-   and what they need to prepare next.

------------------------------------------------------------------------

## 4.4 Scattered Recruiter and Networking Information

A candidate may know:

> "I spoke to a recruiter from Company X."

But that information may exist only inside:

-   LinkedIn messages,
-   WhatsApp,
-   email,
-   notes,
-   or memory.

There is no consistent relationship between the contact and the
application.

------------------------------------------------------------------------

## 4.5 No Useful Job-Search History

Most trackers answer:

> "How many applications did I send?"

A better product should eventually help answer:

-   Which sources produce the most interviews?
-   Which roles have the highest response rate?
-   Which companies progressed furthest?
-   How long does my process usually take?
-   How many applications result in interviews?
-   How many interviews result in offers?
-   Am I improving over time?

This transforms raw application data into useful feedback.

------------------------------------------------------------------------

# 5. Target User

## Primary User

The initial product is designed for an **individual job seeker actively
managing a job search**.

The strongest use case is someone who is serious about switching jobs
and has enough active applications that manual tracking starts becoming
painful.

Examples:

-   developers,
-   designers,
-   product managers,
-   analysts,
-   fresh graduates,
-   experienced professionals,
-   people returning to the job market.

------------------------------------------------------------------------

# 6. Initial User Focus

The product should initially optimize for:

> **A serious individual job seeker who wants control over their
> job-search process.**

We should not attempt to build for every possible recruiting workflow
immediately.

The initial product is **candidate-first**, not recruiter-first.

------------------------------------------------------------------------

# 7. User Persona

## Primary Persona

### The Active Job Seeker

Typical characteristics:

-   applying to multiple companies,
-   using several job platforms,
-   tracking applications manually,
-   attending interviews,
-   communicating with recruiters,
-   occasionally getting referrals,
-   struggling to remember every application's status,
-   wanting to improve their job-search strategy.

### Goals

They want to:

1.  Stay organized.
2.  Never miss an important follow-up.
3.  Know what needs attention today.
4.  Prepare better for interviews.
5.  Understand their job-search performance.
6.  Eventually reduce repetitive work.

### Frustrations

They dislike:

-   maintaining spreadsheets,
-   repeatedly entering the same information,
-   searching through old messages,
-   forgetting follow-ups,
-   losing interview notes,
-   checking multiple applications manually.

------------------------------------------------------------------------

# 8. Jobs To Be Done

## Functional Jobs

When I apply for a job, I want to record it quickly so that I don't
forget it.

When I have multiple applications, I want to see their current status so
that I know where everything stands.

When I need to follow up, I want a reminder so that I don't miss the
opportunity.

When I attend an interview, I want to record what happened so that I can
prepare better for the next round.

When I receive a referral or speak with a recruiter, I want to associate
that relationship with the relevant opportunity.

When my job search is over, I want to understand what worked so that I
can improve future searches.

------------------------------------------------------------------------

# 9. Emotional Jobs

The product should also reduce the mental load associated with job
searching.

The user should feel:

-   organized,
-   in control,
-   prepared,
-   less anxious about forgetting something,
-   confident that important information is captured.

The product should not make the job search feel like another
administrative job.

------------------------------------------------------------------------

# 10. Product Opportunity

The opportunity is larger than creating a better spreadsheet.

A spreadsheet can store:

``` text
Company | Role | Status | Date
```

But the actual job-search journey looks more like:

``` text
Job discovered
      ↓
Application submitted
      ↓
Recruiter contacted
      ↓
Follow-up
      ↓
Interview scheduled
      ↓
Interview round 1
      ↓
Interview round 2
      ↓
HR / Manager round
      ↓
Offer / Rejection / Withdrawal
```

Each stage creates information.

The product opportunity is to connect these events into one continuous
journey.

------------------------------------------------------------------------

# 11. Product Vision

> **Build the personal operating system for a candidate's job search.**

The product should eventually become the place where a candidate can
understand:

-   what they applied to,
-   what is happening now,
-   what they need to do next,
-   who they are talking to,
-   how interviews went,
-   and what their overall job-search performance looks like.

------------------------------------------------------------------------

# 12. Product Principles

## 12.1 Candidate First

Every feature should answer:

> "Does this make the candidate's job search easier?"

------------------------------------------------------------------------

## 12.2 Simple Before Powerful

The first version should be easy to understand.

Avoid building complex systems before proving that users need them.

------------------------------------------------------------------------

## 12.3 The Application Is the Core Object

Applications should connect the other pieces of the system.

Conceptually:

``` text
Company
   │
   └── Role
         │
         └── Application
               ├── Status
               ├── Timeline
               ├── Follow-ups
               ├── Interviews
               ├── Notes
               └── Connections
```

------------------------------------------------------------------------

## 12.4 History Is Valuable

A status field alone is not enough.

The system should eventually preserve meaningful events over time.

Example:

``` text
Oct 1 — Application submitted
Oct 5 — Recruiter contacted
Oct 7 — Follow-up sent
Oct 10 — Interview scheduled
Oct 14 — Technical round completed
Oct 16 — HR round completed
Oct 20 — Offer received
```

This history can later power analytics and insights.

------------------------------------------------------------------------

## 12.5 Automation Comes After Validation

Automation is attractive, but it should not define the first version.

The product should first prove that the core workflow is useful.

Only then should we automate repetitive actions.

------------------------------------------------------------------------

## 12.6 AI Should Solve Real Problems

AI should not be added simply because AI is popular.

Potential AI capabilities should be evaluated only after understanding
real user behavior and pain points.

------------------------------------------------------------------------

# 13. Existing Alternatives / Current User Behavior

Users can currently combine:

-   Excel / Google Sheets,
-   Notion,
-   Trello,
-   Airtable,
-   task managers,
-   calendar applications,
-   LinkedIn,
-   email,
-   browser bookmarks,
-   notes applications.

The problem is not necessarily that these tools are bad.

The problem is that they are **general-purpose tools**.

They do not necessarily understand the complete candidate job-search
lifecycle.

------------------------------------------------------------------------

# 14. Why Build a Dedicated Product?

A dedicated product can understand concepts such as:

-   application status,
-   interview rounds,
-   follow-ups,
-   recruiters,
-   referrals,
-   application timeline,
-   response rates,
-   interview conversion,
-   offer conversion.

This domain-specific understanding creates opportunities for better
workflows than a generic spreadsheet.

------------------------------------------------------------------------

# 15. Core Product Loop

The most important loop is:

``` text
Find Job
   ↓
Save / Apply
   ↓
Track Application
   ↓
Take Next Action
   ↓
Record Result
   ↓
Learn
   ↓
Improve Next Application
```

This loop should guide product decisions.

------------------------------------------------------------------------

# 16. Product Pillars

The product can be organized around six pillars.

## Pillar 1 --- Application Management

Keep all job applications organized.

## Pillar 2 --- Activity & Timeline

Keep a history of what happened.

## Pillar 3 --- Follow-Up Management

Help the user take the next action at the right time.

## Pillar 4 --- Interview Management

Help the user prepare, record and learn from interviews.

## Pillar 5 --- Networking

Connect recruiters, referrals and other contacts to opportunities.

## Pillar 6 --- Insights

Turn accumulated job-search data into useful information.

------------------------------------------------------------------------

# 17. Potential Differentiation

The product should eventually differentiate through:

### Context

Everything related to a job is connected.

### History

The user can see how an opportunity evolved.

### Next Action

The product can tell the user what needs attention.

### Insights

The product can explain what is working.

### Automation

The product can reduce repetitive work.

------------------------------------------------------------------------

# 18. Long-Term Opportunity

Once enough structured data exists, several advanced capabilities become
possible.

## Browser Extension

A user sees a job online and can save it directly.

``` text
Job Listing
    ↓
Browser Extension
    ↓
Save Job
    ↓
Tracker
```

The extension could potentially extract:

-   company,
-   role,
-   location,
-   URL,
-   job description,
-   source.

------------------------------------------------------------------------

## Smart Follow-Ups

The system could help determine when a follow-up is appropriate.

------------------------------------------------------------------------

## Calendar Integration

Interview events could be synchronized with the user's calendar.

------------------------------------------------------------------------

## Advanced Analytics

The system could identify:

-   strongest job sources,
-   strongest roles,
-   application-to-interview rate,
-   interview-to-offer rate,
-   average process duration.

------------------------------------------------------------------------

## AI Assistance

Potential future areas:

-   job description analysis,
-   resume-job matching,
-   interview preparation,
-   interview feedback summarization,
-   personalized preparation plans,
-   application prioritization.

These are **future opportunities**, not MVP requirements.

------------------------------------------------------------------------

# 19. MVP Hypothesis

The first product hypothesis is:

> **If a candidate can easily track applications, statuses, follow-ups,
> interviews and notes in one place, they will find the product more
> useful than maintaining a spreadsheet or several disconnected tools.**

This hypothesis should be tested before building a large automation/AI
platform.

------------------------------------------------------------------------

# 20. MVP Boundary

The initial product should focus on:

``` text
Authentication
      ↓
Dashboard
      ↓
Applications
      ↓
Application Details
      ↓
Timeline
      ↓
Follow-ups
      ↓
Interviews
      ↓
Notes
```

The MVP should **not** require:

-   AI,
-   browser extension,
-   mobile app,
-   enterprise accounts,
-   complex collaboration,
-   advanced automation,
-   public API,
-   offline-first architecture.

------------------------------------------------------------------------

# 21. Success Metrics

The product should eventually measure behavior rather than only signups.

Potential metrics:

## Activation

Percentage of users who create their first application.

## Core Usage

Applications tracked per active user.

## Retention

Whether users return to update applications.

## Workflow Completion

Percentage of applications that have meaningful activity beyond
creation.

## Follow-Up Usage

Number of follow-ups created/completed.

## Interview Usage

Number of interview rounds recorded.

## Value

Percentage of users who say the product helps them stay organized during
a job search.

------------------------------------------------------------------------

# 22. Risks and Assumptions

## Risk 1 --- Users may prefer spreadsheets

The product needs to be significantly easier or more useful than a
spreadsheet.

## Risk 2 --- Data Entry May Be Too Much Work

If every application requires many fields, users may stop using it.

Therefore:

> The fastest useful workflow should be extremely simple.

## Risk 3 --- Users May Not Apply Frequently Enough

A person may only need the product during an active job search.

This makes retention different from typical SaaS products.

## Risk 4 --- Automation May Be Hard

Job sites can change their interfaces and may restrict automation.

Therefore automation should not be the foundation of the MVP.

## Risk 5 --- Too Many Features

The product can easily become a huge platform.

The MVP must remain narrow.

------------------------------------------------------------------------

# 23. Important Product Decisions

  Decision            Direction
  ------------------- ------------------------------------------------
  Primary user        Individual job seeker
  Product type        Personal job-search management tool
  Core object         Application
  Core workflow       Application → activity → next action → outcome
  MVP approach        Manual-first
  Automation          Later
  AI                  Later / problem-driven
  Browser extension   Future phase
  Mobile              Future phase
  Enterprise          Not initial focus
  Collaboration       Not initial focus

------------------------------------------------------------------------

# 24. What We Should NOT Build Yet

This section is intentionally explicit.

Do not start by building:

-   a massive AI job-search agent,
-   a browser extension,
-   a mobile application,
-   a recruiter CRM,
-   a job-board aggregator,
-   a social network,
-   a team collaboration platform,
-   an enterprise recruiting product,
-   complex workflow automation.

Those could all become separate products by themselves.

The first question is much smaller:

> **Will a candidate consistently use this to manage their job search?**

------------------------------------------------------------------------

# 25. Product Discovery Conclusion

The Job Application Tracker has a reasonable product opportunity because
job searching is a multi-step process with fragmented information.

The strongest initial value proposition is not:

> "Track your applications."

It is:

> **"Keep your entire job search organized and always know what
> happened, where things stand, and what you should do next."**

The product should therefore start as a **simple candidate workflow
tool**, prove the core behavior, and expand only when real usage reveals
the next important problem.

------------------------------------------------------------------------

# 26. Transition to the PRD

This document answers:

> **Why should we build this? Who is it for? What problem are we
> solving? What should the product become?**

The next document should answer:

> **Exactly what should the product do?**

That is the responsibility of the **Product Requirements Document
(PRD)**.

The PRD should therefore define:

-   features,
-   requirements,
-   user flows,
-   functional behavior,
-   MVP scope,
-   acceptance criteria,
-   priorities,
-   edge cases.

It should not repeat this entire discovery document.

------------------------------------------------------------------------

# Document Status

**Product Discovery:** Established\
**Core problem:** Defined\
**Target user:** Defined\
**Product vision:** Defined\
**Product pillars:** Defined\
**MVP hypothesis:** Defined\
**Product boundaries:** Defined\
**Next artifact:** Product Requirements Document
