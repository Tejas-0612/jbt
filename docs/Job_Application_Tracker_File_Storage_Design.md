# Job Application Tracker --- File Storage Design

**Document Type:** Technical Design\
**Product:** Job Application Tracker\
**Status:** Working / MVP Design\
**Purpose:** Define whether and how the product should store
user-uploaded files.

------------------------------------------------------------------------

# 1. Purpose

This document defines the file-storage architecture for the Job
Application Tracker.

The core MVP does not require a large file-management system. However,
the product may eventually need files such as:

-   Resume versions
-   Cover letters
-   Job descriptions
-   Interview documents
-   Offer documents
-   Supporting notes or attachments

The design should therefore provide a simple, secure path for adding
file support without making file storage a major dependency of the
initial application.

------------------------------------------------------------------------

# 2. Core Decision

For the MVP:

> **Do not make file uploads a blocking requirement for the core
> application workflow.**

The core product should work completely without uploaded files.

The application workflow remains:

``` text
Create Application
        ↓
Track Status
        ↓
Record Activity
        ↓
Follow Up
        ↓
Manage Interviews
        ↓
Capture Outcome
```

File attachments are supporting functionality.

------------------------------------------------------------------------

# 3. MVP Recommendation

If file uploads are required in the first release:

-   Use object storage.
-   Store files outside PostgreSQL.
-   Store only file metadata in PostgreSQL.
-   Generate short-lived signed URLs for access.
-   Validate file type and size on the backend.
-   Enforce ownership through the application/user relationship.

If file uploads are not required for the first vertical slice:

> Defer implementation until a real workflow requires it.

This keeps the first build focused.

------------------------------------------------------------------------

# 4. Why Not Store Files in PostgreSQL?

Large binary files should not normally be stored directly inside the
relational database for this product.

Instead:

``` text
PostgreSQL
    ↓
File metadata

Object Storage
    ↓
Actual file
```

PostgreSQL is better suited to:

-   ownership
-   metadata
-   relationships
-   search/filtering
-   application state

Object storage is better suited to:

-   PDFs
-   DOCX files
-   images
-   other binary objects

------------------------------------------------------------------------

# 5. Recommended Architecture

``` text
                  ┌──────────────┐
                  │   Frontend   │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │     API      │
                  └───┬──────┬───┘
                      │      │
             metadata │      │ signed upload
                      │      ▼
                      │  ┌───────────────┐
                      │  │ Object Storage│
                      │  └───────────────┘
                      ▼
                ┌──────────────┐
                │ PostgreSQL   │
                │ File Metadata│
                └──────────────┘
```

The API remains responsible for authorization and file metadata.

The actual file can be uploaded directly to object storage using a
short-lived signed URL.

------------------------------------------------------------------------

# 6. Object Storage

The exact provider should remain an infrastructure decision.

Possible categories include:

-   S3-compatible object storage
-   Cloud provider object storage
-   Managed storage services

The application should avoid deeply coupling its domain logic to one
provider.

A storage abstraction can be used:

``` text
FileStorage
├── upload()
├── delete()
├── createUploadUrl()
└── createDownloadUrl()
```

------------------------------------------------------------------------

# 7. File Metadata

PostgreSQL should contain a file record.

Conceptually:

``` text
File
----
id
userId
applicationId
originalName
storageKey
mimeType
sizeBytes
status
createdAt
updatedAt
```

Optional future fields:

``` text
checksum
uploadedAt
deletedAt
```

The exact Prisma schema can be finalized when file uploads are
implemented.

------------------------------------------------------------------------

# 8. File Ownership

Every file must have a clear ownership path.

Example:

``` text
User
 ↓
Application
 ↓
File
```

The backend should verify ownership before:

-   generating an upload URL
-   generating a download URL
-   deleting a file
-   updating metadata

The frontend must never be trusted to enforce this.

------------------------------------------------------------------------

# 9. Storage Key Design

Do not use the original filename as the storage object's primary key.

Instead, use an application-generated key.

Example:

``` text
users/{userId}/applications/{applicationId}/files/{fileId}
```

This avoids collisions and reduces the risk of exposing user-controlled
filenames as storage paths.

------------------------------------------------------------------------

# 10. Original Filename

The original filename can still be stored in PostgreSQL.

Example:

``` text
resume-tejas-final-v3.pdf
```

The filename is display metadata, not the storage identity.

This also allows the UI to show a friendly filename while the storage
layer uses a stable generated key.

------------------------------------------------------------------------

# 11. Supported File Types

The initial supported formats should be intentionally limited.

Possible MVP formats:

``` text
PDF
DOC
DOCX
PNG
JPG
JPEG
```

The exact list should be finalized according to the actual feature
requirement.

Do not accept arbitrary file types simply because the storage provider
allows them.

------------------------------------------------------------------------

# 12. File Size Limits

File size limits should be enforced before upload and verified by the
backend.

Example conceptual limits:

``` text
Resume/document: reasonable size limit
Image: reasonable size limit
```

The exact maximum should be a product/infrastructure configuration
decision.

There should be:

-   frontend validation for user experience
-   backend validation for security
-   storage-level restrictions where supported

Never rely only on frontend validation.

------------------------------------------------------------------------

# 13. MIME Type Validation

The client-provided MIME type must not be blindly trusted.

The backend should validate:

-   declared MIME type
-   file extension
-   actual file characteristics where practical

For sensitive document handling, content inspection should be
considered.

Example:

``` text
filename: resume.pdf
MIME: application/pdf
actual content: valid PDF
```

All three should be consistent enough for the application's security
requirements.

------------------------------------------------------------------------

# 14. Upload Flow

Recommended flow:

``` text
1. User selects file
        ↓
2. Frontend requests upload authorization
        ↓
3. API authenticates user
        ↓
4. API validates application ownership
        ↓
5. API creates file metadata / upload record
        ↓
6. API returns short-lived signed upload URL
        ↓
7. Frontend uploads directly to object storage
        ↓
8. Upload completes
        ↓
9. File status becomes READY
```

This prevents the API server from becoming a bottleneck for large
uploads.

------------------------------------------------------------------------

# 15. Why Direct-to-Storage Upload?

Without direct upload:

``` text
Browser
   ↓
API
   ↓
Object Storage
```

The API has to receive and forward the entire file.

With direct upload:

``` text
Browser
   ├──────────────→ API
   │                ↓
   │          Signed URL
   │
   └──────────────→ Object Storage
```

Benefits:

-   less API bandwidth
-   lower server memory usage
-   better scalability
-   simpler handling of large files

------------------------------------------------------------------------

# 16. File Status

A file should have a lifecycle.

Example:

``` text
PENDING
   ↓
UPLOADING
   ↓
READY
```

Failure:

``` text
PENDING / UPLOADING
        ↓
FAILED
```

Deletion:

``` text
READY
  ↓
DELETED
```

The exact state machine can remain simple.

------------------------------------------------------------------------

# 17. Upload Confirmation

The system should avoid assuming that a signed URL being generated means
the upload succeeded.

The application should verify completion.

Possible approach:

``` text
Create file record
status = PENDING

        ↓

Upload to object storage

        ↓

Confirm upload

        ↓

status = READY
```

A future background verification process can be added if necessary.

------------------------------------------------------------------------

# 18. Download Flow

Users should not receive permanent public storage URLs.

Recommended flow:

``` text
User requests file
        ↓
API authenticates user
        ↓
API checks ownership
        ↓
API creates short-lived signed URL
        ↓
Frontend accesses file
```

The URL should expire after a limited period.

------------------------------------------------------------------------

# 19. Public vs Private Storage

User files should be stored in a **private bucket/container**.

Avoid:

``` text
Public bucket
     ↓
Permanent public URL
```

Prefer:

``` text
Private object
      ↓
Authorization check
      ↓
Short-lived signed URL
```

This is especially important for:

-   resumes
-   salary information
-   offer documents
-   interview material
-   personal documents

------------------------------------------------------------------------

# 20. Delete Flow

When a user deletes a file:

``` text
Frontend
   ↓
DELETE /files/:id
   ↓
API authorization
   ↓
Database record
   ↓
Object storage deletion
```

The system should define what happens if one side succeeds and the other
fails.

A safe approach is to make deletion retryable.

------------------------------------------------------------------------

# 21. Orphaned Files

An orphaned file is an object that exists in storage but has no valid
database record.

Possible causes:

-   interrupted upload
-   application crash
-   failed confirmation
-   partial deletion

The system should eventually support cleanup.

A future scheduled cleanup job can find:

``` text
Storage object
      ↓
No valid DB record
      ↓
Candidate for cleanup
```

This does not need to be a complex MVP subsystem.

------------------------------------------------------------------------

# 22. Database Record Without Storage Object

The opposite situation can also occur:

``` text
DB says:
READY

Storage object:
missing
```

The application should handle this gracefully.

The user should receive a clear error instead of a broken download.

A future integrity-check job can detect these cases.

------------------------------------------------------------------------

# 23. Security Requirements

The storage system must enforce:

-   authenticated access
-   ownership checks
-   private objects
-   short-lived signed URLs
-   file type restrictions
-   file size limits
-   secure storage credentials
-   HTTPS
-   safe filenames
-   no secret information in object keys
-   appropriate malware/security scanning where required

------------------------------------------------------------------------

# 24. Path Traversal Protection

Never construct filesystem paths directly from untrusted filenames.

Unsafe concept:

``` text
storage/{originalFilename}
```

Prefer generated IDs:

``` text
files/{fileId}
```

The original filename should remain metadata.

------------------------------------------------------------------------

# 25. Virus / Malware Scanning

For a personal MVP, full malware scanning may not be necessary if file
types are tightly restricted.

However, if the product later accepts arbitrary documents or becomes a
larger platform, uploaded files should pass through a malware-scanning
process.

Possible future flow:

``` text
Upload
  ↓
Quarantine
  ↓
Scanner
  ↓
SAFE ─────→ READY
  │
  └────────→ REJECTED
```

------------------------------------------------------------------------

# 26. Resume Versioning

A useful future capability is keeping multiple resume versions.

Example:

``` text
Application A
 ├── Resume v1
 ├── Resume v2
 └── Resume v3
```

This could eventually help answer:

> Which resume did I use for this application?

This should be implemented only if it proves useful to the job-search
workflow.

------------------------------------------------------------------------

# 27. Application Attachments

Files should be associated with applications rather than treated as an
unrelated file manager.

Example:

``` text
Application
   │
   ├── Resume
   ├── Cover Letter
   ├── Job Description
   └── Interview Document
```

This reinforces the application's role as the central domain object.

------------------------------------------------------------------------

# 28. Storage Provider Abstraction

Business logic should depend on an interface rather than a specific
provider.

Conceptually:

``` text
Application
    ↓
File Service
    ↓
Storage Interface
    ↓
S3-Compatible Provider
```

This makes it possible to change providers later.

The MVP does not need multiple providers running simultaneously.

------------------------------------------------------------------------

# 29. Credentials

Storage credentials must be kept in secure environment configuration.

Never:

-   commit credentials to Git
-   expose credentials to the browser
-   place secret keys in frontend code
-   log access keys

The browser should receive only short-lived signed URLs.

------------------------------------------------------------------------

# 30. Observability

Important file-storage events should be logged:

``` text
FILE_UPLOAD_STARTED
FILE_UPLOAD_COMPLETED
FILE_UPLOAD_FAILED
FILE_DOWNLOAD_REQUESTED
FILE_DELETED
FILE_CLEANUP_FAILED
```

Logs should contain useful IDs without unnecessarily logging personal
file contents.

Useful metrics:

-   upload failures
-   download failures
-   average upload size
-   storage usage
-   orphaned files
-   cleanup failures

------------------------------------------------------------------------

# 31. Testing

## Unit Tests

Test:

-   file validation
-   ownership checks
-   storage key generation
-   allowed MIME types
-   size limits
-   status transitions

## Integration Tests

Test:

-   upload authorization
-   metadata creation
-   signed URL generation
-   deletion
-   ownership violations

## End-to-End Test

``` text
Create application
      ↓
Upload file
      ↓
File appears on application
      ↓
Download file
      ↓
Delete file
      ↓
File no longer accessible
```

------------------------------------------------------------------------

# 32. Failure Scenarios

The system should handle:

### Storage unavailable

Return a temporary error and allow retry.

### Upload interrupted

Keep the record recoverable or mark it failed.

### User loses connection

Do not incorrectly mark the upload as complete.

### User deletes application

Associated files should follow the product's deletion policy.

### Signed URL expires

Generate a new signed URL after authorization.

### File missing from storage

Show a clear unavailable-file state and log the inconsistency.

------------------------------------------------------------------------

# 33. Application Deletion Policy

If an application is permanently deleted, the product should define what
happens to its files.

Recommended:

``` text
Application deleted
        ↓
Associated files become deletion candidates
        ↓
Object storage cleanup
```

A short delayed cleanup can be safer than immediate irreversible
deletion if recovery is important.

The exact retention period is an implementation/product decision.

------------------------------------------------------------------------

# 34. Privacy

Files may contain highly personal information.

The system should therefore minimize exposure.

Principles:

-   private storage
-   authorization before access
-   short-lived URLs
-   no unnecessary file logging
-   no public indexing
-   no accidental exposure through APIs
-   delete data when no longer needed

------------------------------------------------------------------------

# 35. MVP Boundary

## Build if required

-   Private object storage
-   File metadata table
-   Upload authorization
-   Signed upload URL
-   Signed download URL
-   Ownership checks
-   Size/type validation
-   Delete functionality

## Defer

-   Resume version comparison
-   OCR
-   AI document analysis
-   Malware scanning infrastructure
-   File previews for every format
-   Advanced file search
-   Cross-application file library
-   Complex retention policies
-   Multi-provider storage
-   Large-scale media processing

------------------------------------------------------------------------

# 36. Recommended Implementation Sequence

If file uploads become part of the MVP:

### Step 1

Create `File` database model.

### Step 2

Create storage abstraction.

### Step 3

Configure private object storage.

### Step 4

Implement upload authorization.

### Step 5

Implement signed upload URLs.

### Step 6

Implement upload confirmation.

### Step 7

Implement signed download URLs.

### Step 8

Implement deletion.

### Step 9

Add validation and tests.

### Step 10

Add cleanup later.

------------------------------------------------------------------------

# 37. Final Architecture

``` text
                         ┌──────────────┐
                         │   Frontend   │
                         └──────┬───────┘
                                │
                         Request upload
                                │
                                ▼
                         ┌──────────────┐
                         │     API      │
                         └───┬──────┬───┘
                             │      │
                             │      └──────────────┐
                             ▼                     ▼
                       ┌───────────┐        Signed URL
                       │PostgreSQL │              │
                       │  Metadata │              ▼
                       └───────────┘       ┌──────────────┐
                                           │    Private   │
                                           │    Object    │
                                           │    Storage   │
                                           └──────────────┘
```

------------------------------------------------------------------------

# 38. Final Design Decisions

1.  PostgreSQL stores **file metadata**, not file contents.
2.  Actual files live in **private object storage**.
3.  Files have a clear user/application ownership path.
4.  Storage keys are generated by the application.
5.  Original filenames are metadata only.
6.  The frontend never receives permanent public file URLs.
7.  Signed URLs are short-lived.
8.  File type and size are validated by the backend.
9.  Uploads should be direct-to-storage when practical.
10. File storage should not block the core MVP unless a real requirement
    exists.
11. Cleanup and advanced file processing can be added later.
12. A storage abstraction prevents unnecessary provider lock-in.

------------------------------------------------------------------------

# 39. Relationship With Other Documents

This document depends on:

-   **PRD** --- determines whether attachments provide enough user value
    to enter the MVP.
-   **UX & User Flows** --- determines where files appear in the
    application experience.
-   **System Architecture** --- defines the overall backend and
    infrastructure boundaries.
-   **Database Design** --- defines ownership and the `File` metadata
    model.
-   **API Design** --- defines upload, download, and deletion endpoints.
-   **Authentication & Security** --- defines authorization and
    protection of private files.
-   **Notification & Background Jobs** --- may eventually handle cleanup
    or asynchronous file processing.

------------------------------------------------------------------------

# 40. Implementation Checklist

Before implementing file uploads:

-   [ ] Confirm files are actually required for MVP.
-   [ ] Choose object-storage provider.
-   [ ] Create `File` metadata model.
-   [ ] Define allowed file types.
-   [ ] Define file-size limits.
-   [ ] Implement ownership checks.
-   [ ] Implement storage abstraction.
-   [ ] Configure private storage.
-   [ ] Implement signed upload URLs.
-   [ ] Implement upload confirmation.
-   [ ] Implement signed download URLs.
-   [ ] Implement deletion.
-   [ ] Add upload/download tests.
-   [ ] Define application-deletion behavior.
-   [ ] Plan orphan-file cleanup.

------------------------------------------------------------------------

# 41. Final Recommendation

File storage should remain a **supporting capability**, not a reason to
delay the Job Application Tracker.

The core product does not become valuable because it stores PDFs.

It becomes valuable because it helps the user:

``` text
Track applications
      ↓
Understand status
      ↓
Remember history
      ↓
Take the next action
```

Files should strengthen that workflow when needed.

> **Do not build a file-management product inside the Job Application
> Tracker.**

Keep file storage simple, private, secure, and closely connected to the
application.

------------------------------------------------------------------------

# 42. Next Document

The next logical technical document is:

**Observability & Logging Design**

It will define:

-   application logging
-   structured logs
-   error handling
-   request tracing
-   metrics
-   health checks
-   worker monitoring
-   alerting
-   production debugging
-   privacy-aware logging
-   development vs production observability
