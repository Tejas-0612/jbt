# Job Application Tracker --- Authentication & Security Design Document

## Document Information

  Field                     Value
  ------------------------- --------------------------------------------------
  Product                   Job Application Tracker
  Document Type             Authentication & Security Design
  Depends On                System Architecture, Database Design, API Design
  Authentication Provider   Google OAuth
  Session Model             Access Token + Refresh Session
  Database                  PostgreSQL
  Status                    Working / MVP security design

------------------------------------------------------------------------

# 1. Purpose

This document defines how authentication and security should work in the
Job Application Tracker.

The product stores personal job-search information such as:

-   applications
-   recruiter contacts
-   interview notes
-   salary information
-   follow-ups
-   job-search history

Therefore, authentication and authorization are core system
requirements.

This document covers:

-   Google OAuth
-   user creation
-   access tokens
-   refresh tokens
-   sessions
-   cookies
-   logout
-   token rotation
-   authorization
-   ownership checks
-   CSRF
-   CORS
-   rate limiting
-   security headers
-   input validation
-   secrets
-   logging
-   threat model
-   account/session security
-   future security improvements

------------------------------------------------------------------------

# 2. Security Principles

The system should follow these principles:

1.  Never trust the frontend for authorization.
2.  The backend is the security boundary.
3.  Store long-lived credentials securely.
4.  Minimize sensitive data exposure.
5.  Use HTTPS in production.
6.  Validate all external input.
7.  Use least privilege.
8.  Do not log secrets or tokens.
9.  Keep authentication logic centralized.
10. Prefer simple, well-understood security mechanisms.
11. Treat third-party authentication responses as untrusted input until
    validated.
12. Design for secure failure.

------------------------------------------------------------------------

# 3. Security Goals

The system should ensure:

### Confidentiality

One user must not be able to access another user's job-search data.

### Integrity

A user must not be able to modify data they do not own.

### Availability

Authentication and core application functionality should remain
available under normal operating conditions.

### Accountability

Important authentication/security events should be observable without
storing unnecessary sensitive information.

------------------------------------------------------------------------

# 4. Authentication vs Authorization

These are separate concerns.

## Authentication

Answers:

> Who is this user?

Example:

``` text
Google OAuth
    ↓
User identified
```

## Authorization

Answers:

> Can this user access this resource?

Example:

``` text
User A
   ↓
GET Application 123
   ↓
Application belongs to User B
   ↓
Access denied
```

Authentication alone is not sufficient.

------------------------------------------------------------------------

# 5. Authentication Strategy

The initial product uses:

> **Google OAuth for identity + application-managed sessions for API
> access.**

High-level flow:

``` text
Browser
   ↓
Google Login
   ↓
Google OAuth
   ↓
Backend Callback
   ↓
Validate Google Identity
   ↓
Find/Create User
   ↓
Create Session
   ↓
Issue Access Token
   ↓
Application
```

------------------------------------------------------------------------

# 6. Why Google OAuth

Using Google authentication avoids building and maintaining:

-   password storage
-   password reset
-   password hashing
-   password recovery emails
-   password strength rules
-   account lockout logic

The product can focus on the job-search experience.

------------------------------------------------------------------------

# 7. OAuth Flow

Recommended authorization-code flow:

``` text
User
 ↓
Frontend
 ↓
Backend OAuth endpoint
 ↓
Google authorization page
 ↓
User grants access
 ↓
Google redirects to backend callback
 ↓
Backend exchanges authorization code
 ↓
Backend validates identity
 ↓
Create/find user
 ↓
Create session
 ↓
Redirect to application
```

The authorization code should never be treated as an authenticated
application session by itself.

------------------------------------------------------------------------

# 8. OAuth State Protection

The OAuth flow should use a secure `state` value to protect against
login CSRF and authorization-response injection.

Conceptually:

``` text
Start OAuth
   ↓
Generate state
   ↓
Store/associate state with login attempt
   ↓
Redirect to Google
   ↓
Callback contains state
   ↓
Compare expected state
   ↓
Continue only if valid
```

An invalid or missing state should terminate the authentication attempt.

------------------------------------------------------------------------

# 9. OAuth Callback Security

The backend must validate:

-   authorization response
-   state
-   provider response
-   expected issuer/provider
-   identity information
-   token exchange result

The backend should not trust arbitrary values submitted to the callback.

------------------------------------------------------------------------

# 10. User Creation

After successful Google authentication:

``` text
Google Identity
      ↓
Find existing user
      │
      ├── Found → use existing account
      │
      └── Not Found → create user
```

The system should have a stable external-provider identity association.

------------------------------------------------------------------------

# 11. User Identity

The user record should contain a stable application identifier.

A separate provider identity mapping may be useful:

``` text
User
  ↓
External Identity
  ├── provider = GOOGLE
  └── providerUserId = ...
```

For a very small MVP, these fields can potentially live directly on the
user record.

A separate identity model is more extensible if additional providers are
planned.

------------------------------------------------------------------------

# 12. Access Token

The access token is short-lived.

Target lifetime:

``` text
~15 minutes
```

Purpose:

-   authenticate API requests
-   limit damage if an access token is exposed

Example:

``` http
Authorization: Bearer <access_token>
```

------------------------------------------------------------------------

# 13. Access Token Storage

For the web application, the preferred approach is:

> Keep the access token in application memory rather than persistent
> browser storage.

Avoid storing access tokens in:

``` text
localStorage
```

because JavaScript-accessible persistent storage increases the impact of
an XSS vulnerability.

The exact frontend implementation can use an in-memory auth state.

------------------------------------------------------------------------

# 14. Refresh Token

The refresh credential is longer-lived.

Target lifetime:

``` text
~30 days
```

It is used to obtain new access tokens.

The refresh credential should be:

-   HttpOnly
-   Secure in production
-   appropriately SameSite configured
-   rotated
-   associated with a server-side session

------------------------------------------------------------------------

# 15. Refresh Token Storage

The browser should receive the refresh token through a secure cookie.

Example conceptual cookie:

``` text
Set-Cookie:
  refresh_token=<opaque-token>
  HttpOnly
  Secure
  SameSite=Lax
  Path=/auth
```

The exact `Path` and SameSite behavior should be validated against the
final deployment architecture.

------------------------------------------------------------------------

# 16. Do Not Store Raw Refresh Tokens

The database should preferably store a hash of the refresh token rather
than the raw token.

Conceptually:

``` text
Browser
   ↓
Raw refresh token

Database
   ↓
Hash(refresh token)
```

If the database is compromised, attackers should not immediately receive
usable refresh credentials.

------------------------------------------------------------------------

# 17. Refresh Token Rotation

When a refresh request succeeds:

``` text
Old Refresh Token
       ↓
Validate
       ↓
Create New Refresh Token
       ↓
Invalidate Old Token
       ↓
Issue New Access Token
```

This reduces the usefulness of a stolen refresh token.

------------------------------------------------------------------------

# 18. Refresh Token Reuse Detection

A stronger implementation can detect reuse of an already-rotated refresh
token.

Conceptually:

``` text
Refresh Token A
   ↓
Used successfully
   ↓
Replaced by Token B
```

If Token A is later presented again:

``` text
Possible token theft
       ↓
Revoke related session/family
       ↓
Require fresh authentication
```

This is a security enhancement worth considering once the basic rotation
flow is stable.

------------------------------------------------------------------------

# 19. Session Model

The application should maintain server-side sessions.

``` text
User
 ├── Session 1
 ├── Session 2
 └── Session 3
```

Each session can contain:

``` text
id
userId
refreshTokenHash
expiresAt
createdAt
updatedAt
revokedAt
```

Potential metadata:

``` text
userAgent
ipAddress
lastUsedAt
```

Only collect metadata that has a clear security/product purpose.

------------------------------------------------------------------------

# 20. Multiple Devices

The session model supports:

-   laptop
-   desktop
-   mobile browser

Each can have an independent session.

Future settings can allow:

``` text
Active Sessions

Chrome — Windows
Last active: 2 hours ago

Chrome — Linux
Last active: yesterday

[Revoke]
```

This is not required for the first UI release but the backend should not
prevent it.

------------------------------------------------------------------------

# 21. Logout

Logout should revoke the current session.

Flow:

``` text
User clicks Logout
       ↓
POST /auth/logout
       ↓
Identify current session
       ↓
Revoke session
       ↓
Clear refresh cookie
       ↓
Clear frontend auth state
```

An access token that is already issued may remain technically valid
until expiration unless the architecture adds access-token revocation.
This is acceptable for short-lived access tokens if the threat model
permits it.

------------------------------------------------------------------------

# 22. Logout All Sessions

A future security feature can support:

``` text
POST /auth/logout-all
```

which revokes all active sessions for the user.

This is useful if the user suspects account compromise.

------------------------------------------------------------------------

# 23. Session Expiration

Sessions should expire after the configured refresh lifetime.

Example:

``` text
30 days
```

An expired session requires a new authentication flow.

The system should not silently keep sessions alive forever.

------------------------------------------------------------------------

# 24. Authorization Architecture

Every protected request should follow:

``` text
HTTP Request
     ↓
Authenticate
     ↓
currentUserId
     ↓
Load resource
     ↓
Check ownership
     ↓
Allow / Deny
```

The frontend must never determine whether the user is authorized.

------------------------------------------------------------------------

# 25. Ownership Model

Most product data ultimately belongs to a user.

Example:

``` text
Application
    ↓
userId
    ↓
User
```

For child resources:

``` text
Note
 ↓
Application
 ↓
User
```

Authorization can therefore follow the ownership chain.

------------------------------------------------------------------------

# 26. Direct Ownership Check

Example:

``` text
GET /applications/app_123
```

Backend query conceptually:

``` text
Find application
WHERE id = app_123
AND userId = currentUserId
```

This is preferable to:

``` text
Find application by ID
then
check ownership later
```

when practical, because the query itself enforces isolation.

------------------------------------------------------------------------

# 27. Nested Resource Authorization

For:

``` text
GET /applications/app_123/notes
```

the backend must ensure:

``` text
Application app_123 belongs to currentUserId
```

before returning its notes.

A user must not gain access merely by knowing or guessing an ID.

------------------------------------------------------------------------

# 28. ID Enumeration Protection

Identifiers should be difficult to enumerate.

Using UUID/CUID-style identifiers helps.

However:

> Non-sequential IDs are not an authorization mechanism.

Even with random IDs, ownership checks remain mandatory.

------------------------------------------------------------------------

# 29. Broken Access Control Threat

Potential attack:

``` text
User A
GET /applications/userB_application
```

Protection:

``` text
Authenticated User A
       ↓
Ownership query
       ↓
No matching userId
       ↓
404 or 403
```

The exact response strategy should be consistent across the API.

Returning `404` can also avoid revealing whether another user's resource
exists.

------------------------------------------------------------------------

# 30. CSRF

CSRF is especially relevant because refresh/session credentials use
cookies.

Protection should include:

-   appropriate SameSite cookie configuration
-   strict CORS
-   state protection for OAuth
-   CSRF protection for cookie-authenticated state-changing endpoints if
    required by the final architecture

If the API uses only an Authorization header for state-changing requests
and the refresh cookie is isolated to refresh endpoints, the CSRF
exposure can be reduced significantly.

------------------------------------------------------------------------

# 31. CORS

CORS should allow only trusted application origins.

Example:

``` text
https://app.example.com
```

Avoid:

``` text
Access-Control-Allow-Origin: *
```

for authenticated production APIs.

Allowed methods and headers should also be restricted.

------------------------------------------------------------------------

# 32. Cookie Security

Production refresh cookies should generally use:

``` text
HttpOnly
Secure
SameSite
```

Potentially:

``` text
__Host-
```

cookie prefix where deployment architecture permits it.

Never store authentication cookies without HTTPS in production.

------------------------------------------------------------------------

# 33. HTTPS

Production traffic must use HTTPS.

This protects:

-   access tokens
-   session cookies
-   application data
-   recruiter contact data
-   interview information

HTTP should redirect to HTTPS at the edge where applicable.

------------------------------------------------------------------------

# 34. XSS Protection

The frontend should:

-   avoid injecting untrusted HTML
-   sanitize content where HTML rendering is genuinely required
-   avoid dangerous DOM APIs
-   use framework escaping by default

User-provided notes should be rendered as text unless rich text is
explicitly required.

------------------------------------------------------------------------

# 35. Content Security Policy

A Content Security Policy can reduce the impact of XSS.

A future production configuration can restrict:

-   scripts
-   styles
-   images
-   frames
-   connections

The policy should be introduced carefully because OAuth and third-party
integrations may require specific origins.

------------------------------------------------------------------------

# 36. Security Headers

Recommended production headers include appropriate:

``` text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Legacy or unnecessary headers should not be added blindly.

------------------------------------------------------------------------

# 37. Input Validation

Every request is untrusted.

Validate:

-   strings
-   numbers
-   dates
-   URLs
-   IDs
-   enums
-   pagination
-   search parameters
-   request body size

Example:

``` text
salaryMin = "hello"
```

must never reach business logic as if it were a valid number.

------------------------------------------------------------------------

# 38. Output Validation

Sensitive fields should not accidentally appear in API responses.

For example, a user-facing session response should never return:

``` text
refreshTokenHash
```

or internal authentication metadata.

Response DTOs should explicitly define what leaves the backend.

------------------------------------------------------------------------

# 39. SQL Injection

Prisma's parameterized query mechanisms should be used.

Avoid constructing raw SQL using unsanitized user input.

If raw SQL is ever necessary:

-   parameterize values
-   review the query carefully
-   restrict its use to appropriate repository/service code

------------------------------------------------------------------------

# 40. Mass Assignment Protection

Do not allow clients to update arbitrary database fields.

Bad:

``` json
{
  "userId": "another-user",
  "role": "admin"
}
```

The API should explicitly define writable fields.

For an application update, for example:

``` text
status
jobUrl
location
description
...
```

Only allowed fields should be accepted.

------------------------------------------------------------------------

# 41. Rate Limiting

Rate limiting should protect:

-   OAuth initiation/callback endpoints
-   token refresh
-   login-related endpoints
-   expensive API operations
-   future public endpoints

Example conceptual limits:

``` text
Auth:
strict

Normal API:
moderate

Health:
very light/no application-level limit
```

Exact numbers should be based on deployment and traffic.

------------------------------------------------------------------------

# 42. Brute Force Protection

Because password authentication is not used initially, traditional
password brute force is avoided.

However, abuse can still target:

-   OAuth endpoints
-   refresh endpoints
-   API resources

Rate limiting and anomaly detection should therefore remain in place.

------------------------------------------------------------------------

# 43. Secrets Management

Secrets must never be committed to Git.

Examples:

``` text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DATABASE_URL
JWT_SIGNING_KEY
REDIS_URL
EMAIL_PROVIDER_KEY
```

Production secrets should come from the hosting platform's secret
manager/environment configuration.

------------------------------------------------------------------------

# 44. Local Environment Files

Local development may use:

``` text
.env.local
```

The repository should include:

``` text
.env.example
```

with placeholders:

``` text
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

The real `.env` file must be ignored by Git.

------------------------------------------------------------------------

# 45. Secret Rotation

Production secrets should be rotatable.

Particularly:

-   OAuth client secrets
-   token signing keys
-   database credentials
-   API keys

The architecture should avoid hard-coding secrets into application
builds.

------------------------------------------------------------------------

# 46. Logging Security

Logs must not contain:

-   access tokens
-   refresh tokens
-   authorization headers
-   OAuth client secrets
-   database passwords

Avoid logging full request bodies when they may contain personal
information.

------------------------------------------------------------------------

# 47. Authentication Logging

Useful security events include:

``` text
LOGIN_SUCCESS
LOGIN_FAILURE
SESSION_CREATED
SESSION_REVOKED
TOKEN_REFRESH
TOKEN_REUSE_DETECTED
LOGOUT
```

Logs should contain enough metadata to investigate abuse without
exposing credentials.

------------------------------------------------------------------------

# 48. Personal Data Logging

Avoid logs such as:

``` text
User email + entire application + interview notes
```

Instead:

``` text
userId
requestId
operation
result
timestamp
```

Personal data should be minimized.

------------------------------------------------------------------------

# 49. Request IDs

Every API request should ideally have a request/correlation ID.

Example:

``` text
X-Request-Id: req_123
```

This makes it easier to trace:

``` text
Frontend
 ↓
API
 ↓
Service
 ↓
Database
```

during debugging.

------------------------------------------------------------------------

# 50. Threat Model

The initial threat model should consider:

1.  stolen access token
2.  stolen refresh token
3.  broken authorization
4.  XSS
5.  CSRF
6.  OAuth login CSRF
7.  malicious input
8.  SQL injection
9.  brute-force/abuse
10. leaked secrets
11. database compromise
12. accidental sensitive logging

------------------------------------------------------------------------

# 51. Threat --- Stolen Access Token

### Risk

An attacker obtains a valid short-lived access token.

### Mitigation

-   short token lifetime
-   HTTPS
-   avoid localStorage
-   secure frontend handling
-   appropriate CSP
-   revoke/refresh session when suspicious behavior is detected

------------------------------------------------------------------------

# 52. Threat --- Stolen Refresh Token

### Risk

An attacker obtains the refresh credential.

### Mitigation

-   HttpOnly cookie
-   Secure cookie
-   token rotation
-   hashed database storage
-   expiration
-   reuse detection
-   session revocation

------------------------------------------------------------------------

# 53. Threat --- Broken Authorization

### Risk

User accesses another user's application.

### Mitigation

-   ownership checks on every protected resource
-   user-scoped database queries
-   authorization tests
-   never trusting client-provided user IDs

This is one of the highest-priority security risks for this product.

------------------------------------------------------------------------

# 54. Threat --- XSS

### Risk

Injected script accesses user data or browser credentials.

### Mitigation

-   React escaping
-   avoid dangerous HTML rendering
-   CSP
-   input/output handling
-   security review of third-party libraries

------------------------------------------------------------------------

# 55. Threat --- CSRF

### Risk

A malicious site causes an authenticated browser to perform unwanted
actions.

### Mitigation

-   SameSite cookies
-   strict CORS
-   OAuth state
-   CSRF protections where cookie-authenticated mutations require them

------------------------------------------------------------------------

# 56. Threat --- Malicious Input

### Risk

Malformed data reaches the application.

### Mitigation

-   schema validation
-   database constraints
-   parameterized queries
-   bounded request sizes
-   safe parsing

------------------------------------------------------------------------

# 57. Threat --- Database Compromise

### Risk

Attackers gain access to PostgreSQL.

### Mitigation

-   encrypted connections
-   strong database credentials
-   least-privileged database access
-   hashed refresh tokens
-   encrypted backups
-   secret management
-   minimized sensitive data

------------------------------------------------------------------------

# 58. Threat --- Secret Leakage

### Risk

Credentials appear in:

-   Git
-   logs
-   screenshots
-   CI output
-   error responses

### Mitigation

-   environment/secret manager
-   `.gitignore`
-   log filtering
-   CI secret scanning
-   careful error handling

------------------------------------------------------------------------

# 59. Account Linking

If the product supports only Google authentication initially, account
linking remains simple.

The backend should use a stable provider identity rather than blindly
trusting email strings as the only identifier.

If multiple login providers are added later, explicit account-linking
rules will be required.

------------------------------------------------------------------------

# 60. Email Changes

The user's Google identity should remain authoritative for
provider-managed identity information.

The application should avoid allowing a user to arbitrarily change the
primary authentication email if that could break identity mapping.

Profile fields and authentication identity should be conceptually
separated.

------------------------------------------------------------------------

# 61. Session Revocation

A session should be revocable when:

-   user logs out
-   refresh token reuse is detected
-   suspicious behavior is detected
-   session expires
-   user manually revokes it

Revocation should be server-side.

------------------------------------------------------------------------

# 62. Access Token Revocation

Because access tokens are short-lived, the MVP does not necessarily need
a centralized access-token blacklist.

Instead:

``` text
Short access-token lifetime
+
Refresh-session revocation
```

provides a simpler security model.

A token blacklist can be introduced later if requirements justify it.

------------------------------------------------------------------------

# 63. Authorization Middleware

Protected routes should use centralized middleware.

Conceptually:

``` text
authenticate()
    ↓
req.user
    ↓
authorizeResource()
    ↓
controller
```

Do not reimplement authentication parsing differently in every
controller.

------------------------------------------------------------------------

# 64. Service-Level Authorization

Middleware establishes identity.

Services should still enforce resource-specific ownership.

Example:

``` text
ApplicationService.update(applicationId, userId, data)
```

The service should verify that the application belongs to `userId`.

This prevents authorization from being accidentally bypassed by another
code path.

------------------------------------------------------------------------

# 65. Database-Level Defense

Application-level authorization is primary.

Database constraints provide defense in depth.

The database should enforce:

-   foreign keys
-   unique constraints
-   valid enum values where appropriate
-   non-null requirements
-   referential integrity

Do not depend entirely on application code for data integrity.

------------------------------------------------------------------------

# 66. Security Testing

Security tests should include:

### Authentication

-   invalid OAuth state
-   expired session
-   invalid refresh token
-   revoked session

### Authorization

-   user A accessing user B's application
-   user A editing user B's follow-up
-   user A accessing user B's notes

### Input

-   invalid IDs
-   oversized fields
-   invalid URLs
-   invalid enum values
-   malformed dates

### Session

-   refresh rotation
-   old refresh token rejection
-   logout
-   session expiration

------------------------------------------------------------------------

# 67. Security Checklist for Every Endpoint

Before adding an endpoint, ask:

``` text
1. Is authentication required?
2. Who owns this resource?
3. How is ownership verified?
4. What inputs are accepted?
5. Are all inputs validated?
6. Which fields can the client modify?
7. Could this leak another user's data?
8. Could this endpoint be abused?
9. What sensitive data could appear in logs?
10. What should happen on failure?
```

------------------------------------------------------------------------

# 68. Secure Request Flow

A protected API request should look like:

``` text
HTTP Request
     ↓
HTTPS
     ↓
CORS checks
     ↓
Authentication
     ↓
Token/session validation
     ↓
Rate limiting
     ↓
Input validation
     ↓
Authorization
     ↓
Business logic
     ↓
Database
     ↓
Safe response
```

The exact middleware order may differ slightly by framework, but all
security responsibilities must exist.

------------------------------------------------------------------------

# 69. Production Security Baseline

Before production launch:

-   [ ] HTTPS
-   [ ] secure cookies
-   [ ] OAuth state protection
-   [ ] CORS restricted
-   [ ] authorization checks
-   [ ] input validation
-   [ ] rate limiting
-   [ ] security headers
-   [ ] secrets outside Git
-   [ ] safe error responses
-   [ ] no tokens in logs
-   [ ] database backups
-   [ ] dependency auditing
-   [ ] authentication tests
-   [ ] authorization tests

------------------------------------------------------------------------

# 70. Dependency Security

The project should periodically review dependencies.

Use:

-   lockfiles
-   automated dependency updates where appropriate
-   vulnerability scanning
-   removal of unused packages

Do not install security-sensitive libraries without understanding their
behavior.

------------------------------------------------------------------------

# 71. Security vs Developer Experience

Security should not make normal product usage unnecessarily difficult.

The desired experience is:

``` text
Google Login
     ↓
You're in
     ↓
Application works normally
```

Security should operate largely in the background.

The user should only see security-related prompts when genuinely
necessary.

------------------------------------------------------------------------

# 72. Security Decisions

## ADR-SEC-001 --- Google OAuth

Use Google OAuth instead of password authentication for the MVP.

## ADR-SEC-002 --- Short-Lived Access Tokens

Use approximately 15-minute access tokens.

## ADR-SEC-003 --- Secure Refresh Cookie

Use an HttpOnly, Secure refresh cookie.

## ADR-SEC-004 --- Refresh Rotation

Rotate refresh credentials after successful refresh.

## ADR-SEC-005 --- Server-Side Authorization

Backend owns resource authorization.

## ADR-SEC-006 --- PostgreSQL Session Records

Maintain server-side session records for revocation and session
management.

## ADR-SEC-007 --- No Access Token in localStorage

Avoid persistent browser storage for access credentials.

------------------------------------------------------------------------

# 73. What Should Not Be Overengineered Yet

The MVP does not need:

-   hardware security keys
-   enterprise SSO
-   complex identity federation
-   zero-trust service mesh
-   advanced fraud detection
-   biometric authentication
-   elaborate security event pipelines
-   a custom identity provider

The security architecture should be strong without becoming a separate
product.

------------------------------------------------------------------------

# 74. Future Security Improvements

As the product grows:

-   multi-provider authentication
-   account linking
-   session management UI
-   suspicious-login alerts
-   stronger refresh-token reuse detection
-   security audit logs
-   data export/deletion workflows
-   encrypted sensitive fields where justified
-   stronger automated security testing
-   penetration testing

These should be introduced based on real risk and product scale.

------------------------------------------------------------------------

# 75. Final Security Architecture

``` text
                       Google
                         │
                         ▼
                  OAuth Authorization
                         │
                         ▼
                  Backend Callback
                         │
                  Validate Identity
                         │
                         ▼
                       User
                         │
                         ▼
                      Session
                    ┌────┴────┐
                    │         │
             Access Token   Refresh
             short-lived    Cookie
                    │         │
                    ▼         ▼
                 API Server  Session DB
                    │
             ┌──────┴──────┐
             │             │
        Authorization   Validation
             │             │
             └──────┬──────┘
                    ▼
                 Services
                    │
                    ▼
                PostgreSQL
```

------------------------------------------------------------------------

# 76. Final Security Principle

> **The frontend can request an action, but only the backend can decide
> whether the action is allowed.**

The most important security boundary is:

``` text
Authenticated User
        ↓
Backend Authorization
        ↓
Owned Resource
        ↓
Business Logic
        ↓
Database
```

If this boundary is consistently enforced, the product has a strong
foundation for the MVP.

------------------------------------------------------------------------

# 77. Next Document

The next logical document is the:

**Notification & Background Jobs Design**

It should define:

-   follow-up reminders
-   interview reminders
-   job scheduling
-   Redis/job queue
-   worker architecture
-   retry behavior
-   idempotency
-   failed jobs
-   notification delivery
-   in-app notifications
-   email notifications
-   scheduling and time zones
-   monitoring worker health
