# Activities and Submissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the complete CarecaHub activity workflow: publication, audience snapshots, views, versioned group submissions, grading, reminders, notifications, kanban tracking, and project delivery history.

**Architecture:** A single NestJS `activities` resource owns the workflow and its related tables, with a small reminder service in the same module. It calls the existing notification and bucket services, exposes role-aware REST endpoints, and is consumed by one React activities module plus a focused project-details integration.

**Tech Stack:** NestJS 11, Drizzle ORM/PostgreSQL, class-validator, Vitest, React 19, React Router, SWR, Zod, React Hook Form, shadcn/Tailwind, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-06-activities-and-submissions-design.md`

## Global Constraints

- Keep `api`, `web`, and `docs` independent; do not introduce workspace tooling.
- Keep code, identifiers, routes, database values, and internal messages in English; only user-visible frontend copy is Portuguese.
- Follow the existing API resource layout and return `ServiceOutput<T>` from services; list endpoints consume `QueryDto` or a direct extension.
- Frontend schemas and form requests live in `web/src/types/activity.ts`, reads use SWR, and writes use the typed `writer` result.
- Do not add an application-level mock API, queue, event bus, generic repository, or speculative abstraction.
- Preserve the user's existing uncommitted project-page changes. Merge activity integrations into those files without replacing unrelated edits.
- Store attachments and submissions privately; never log file contents, object keys, signed URLs, cookies, credentials, connection strings, or authorization headers.
- Use `America/Sao_Paulo` for all 08:00 deadline reminders.
- Use test-first red-green-refactor for every behavior change and commit only the files belonging to the completed task.

## Review Focus

- A student who changes groups after publication sees only the new group's audience and cannot access the previous group's files; Task 2 pins this in service tests.
- Two group members submitting concurrently receive distinct monotonic versions and cannot both create a first late delivery; Task 4 pins this with transaction/unique-conflict tests.
- Extending a deadline after an earlier reminder sends the new revision's reminder once without replaying the old revision; Task 6 pins this with a controlled clock.
- Repository URLs changed or deleted after submission do not alter historical delivery evidence; Task 4 asserts the URL snapshot.
- A private upload ID guessed from another user cannot be attached or downloaded; Tasks 1, 3, and 4 cover ownership and read authorization.

---

### Task 1: Persistence Model and Owned Private Uploads

**Files:**
- Create: `api/src/drizzle/schema/enums/activityEnums.ts`
- Create: `api/src/drizzle/schema/entities/activity.ts`
- Create: generated `api/src/drizzle/migrations/0012_*.sql` and matching metadata files
- Modify: `api/src/drizzle/schema/enums/index.ts`
- Modify: `api/src/drizzle/schema/entities/index.ts`
- Modify: `api/src/drizzle/schema.ts`
- Modify: `api/src/drizzle/index.ts`
- Modify: `api/src/drizzle/schema/entities/bucketFile.ts`
- Modify: `api/src/drizzle/schema/entities/notification.ts`
- Modify: `api/src/providers/bucket/bucket.controller.ts`
- Modify: `api/src/providers/bucket/bucket.interface.ts`
- Modify: `api/src/providers/bucket/bucket.service.ts`
- Modify: `api/src/providers/bucket/dtos/uploadResponse.dto.ts`
- Test: `api/src/providers/bucket/bucket.controller.test.ts`
- Test: `api/src/providers/bucket/bucket.service.test.ts`

**Interfaces:**
- Produces tables `activities`, `activityGroups`, `activityAttachments`, `activityViews`, `activitySubmissions`, `activitySubmissionFiles`, `activitySubmissionLinks`, and `activityEvaluations`.
- Produces enum `ActivitySubmissionType = 'links' | 'files' | 'both'`.
- Extends `BucketFile` with nullable migration-safe `uploadedById` and `mimeType`, while requiring both for new uploads.
- Produces `UploadResponseDto { id, key, url?, filename, size, mimeType, isPublic }`.
- Extends notifications with nullable `activityId`, `submissionId`, `actorId`, `groupId`, and `deadlineRevision`; adds `activity_published`, `activity_updated`, `activity_deadline_week`, `activity_deadline_three_days`, `activity_deadline_today`, and `activity_submission_created`.

- [ ] **Step 1: Write failing upload ownership tests**

Add controller and service tests asserting that authenticated user metadata reaches `BucketService.upload`, the inserted bucket row stores `uploadedById` and `mimeType`, and the response includes the stable file ID and metadata. Add a test proving a private upload without an authenticated uploader is rejected.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `cd api && pnpm test -- src/providers/bucket/bucket.controller.test.ts src/providers/bucket/bucket.service.test.ts`

Expected: FAIL because upload input and response do not yet carry owner and MIME metadata.

- [ ] **Step 3: Implement the schema and upload contract**

Define the exact foreign keys, composite unique indexes, timestamps, and soft-delete/archive columns described by the spec. Update bucket controller/service signatures to consume `UserMetadata` and persist upload ownership. Keep public uploads compatible while making private upload ownership mandatory.

- [ ] **Step 4: Generate and inspect the migration**

Run: `cd api && pnpm db:g`

Expected: one new migration that creates all activity tables/enums/indexes, extends `BucketFile`, and extends `Notification` without dropping unrelated objects. Inspect it for partial unique indexes on audience, views, submission versions, one evaluation per submission, and reminder idempotency.

- [ ] **Step 5: Run focused tests, type build, and lint**

Run: `cd api && pnpm test -- src/providers/bucket/bucket.controller.test.ts src/providers/bucket/bucket.service.test.ts && pnpm build && pnpm lint`

Expected: PASS with no schema export or TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add api/src/drizzle api/src/providers/bucket
git commit -m "feat(api): add activity schema and owned uploads"
```

### Task 2: Activity Publication, Listing, Details, and Views

**Files:**
- Create: `api/src/resources/activities/activity.module.ts`
- Create: `api/src/resources/activities/activity.controller.ts`
- Create: `api/src/resources/activities/activity.interface.ts`
- Create: `api/src/resources/activities/activity.service.ts`
- Create: `api/src/resources/activities/dto/create-activity.dto.ts`
- Create: `api/src/resources/activities/dto/activity-query.dto.ts`
- Create: `api/src/resources/activities/dto/get-activity.dto.ts`
- Create: `api/src/resources/activities/dto/create-activity.dto.test.ts`
- Create: `api/src/resources/activities/activity.service.test.ts`
- Create: `api/src/resources/activities/activity.module.test.ts`
- Modify: `api/src/resources/notification/notification.interface.ts`
- Modify: `api/src/resources/notification/notification.service.ts`
- Modify: `api/src/resources/notification/notification.module.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Produces `CreateActivityDto { title, description, dueAt, allowLateSubmissions, submissionType, attachmentIds }` and `ActivityQueryDto extends QueryDto { includeArchived? }`.
- Produces `ActivityService.create`, `findAll`, and `findOne`, all returning typed `ServiceOutput` values.
- Produces `CreateActivityNotificationsInput` and `NotificationService.createActivityNotifications(input: CreateActivityNotificationsInput, tx?: DrizzleTransactionClient): Promise<number>`, where input names the notification type, activity, actor, recipient IDs, optional group/submission, and optional deadline revision.
- `findOne(id, student)` records the student's first view only after audience authorization succeeds.

- [ ] **Step 1: Write failing DTO, module, and service tests**

Cover exact title/description/date/file limits, allowed roles, rejection when no active groups exist, one-transaction audience snapshot, publication recipients/actor, student group scoping, staff reads, group changes after publication, and idempotent per-student views. Assert a student cannot see or record a view for an old group after moving.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `cd api && pnpm test -- src/resources/activities`

Expected: FAIL because the activities resource does not exist.

- [ ] **Step 3: Implement publication and read flows**

Keep controller methods thin. In `create`, validate owned private attachments, insert the activity, snapshot every non-deleted group, attach files, and create one publication notification per active student in the same transaction. In reads, resolve the current project and repositories, scope students by their current active group, and insert `ActivityView` with conflict-ignore semantics.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd api && pnpm test -- src/resources/activities src/resources/notification/notification.service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/app.module.ts api/src/resources/activities api/src/resources/notification
git commit -m "feat(api): publish and view activities"
```

### Task 3: Activity Editing, Archiving, and Reference Downloads

**Files:**
- Create: `api/src/resources/activities/dto/update-activity.dto.ts`
- Modify: `api/src/resources/activities/activity.controller.ts`
- Modify: `api/src/resources/activities/activity.interface.ts`
- Modify: `api/src/resources/activities/activity.service.ts`
- Modify: `api/src/resources/activities/activity.service.test.ts`
- Modify: `api/src/types.ts`

**Interfaces:**
- Produces `ActivityService.update(id, input, requester)`, `archive(id, requester)`, and `getAttachmentDownload(id, fileId, requester)`.
- Adds `ErrKeys.submissionClosed`, `ErrKeys.submissionImmutable`, and `ErrKeys.submissionRequirementsNotMet`; user-facing Portuguese translations remain in `web/src/api/errors.ts`.
- Download output is `{ url: string }`; raw private keys never leave an authorized download path.

- [ ] **Step 1: Write failing edit/archive/download tests**

Cover admin read-only behavior, teacher/mentor edits, full edits before a submission, only title/description/attachments/deadline extension after a submission, deadline revision increments, edit notifications, archived-resource immutability, attachment replacement ownership, and cross-group/private-file download denial.

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd api && pnpm test -- src/resources/activities/activity.service.test.ts`

Expected: FAIL on missing methods and rules.

- [ ] **Step 3: Implement the minimal edit, archive, and download behavior**

Use transactions for attachment replacement and edit notifications. Treat an unchanged patch as a successful no-op without emitting a notification. Increment `deadlineRevision` only when `dueAt` changes. Archive by setting `archivedAt` and `updatedAt`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd api && pnpm test -- src/resources/activities`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/resources/activities api/src/types.ts
git commit -m "feat(api): manage activity lifecycle"
```

### Task 4: Versioned Group Submissions

**Files:**
- Create: `api/src/resources/activities/dto/create-submission.dto.ts`
- Create: `api/src/resources/activities/dto/get-submission.dto.ts`
- Create: `api/src/resources/activities/dto/create-submission.dto.test.ts`
- Create: `api/src/resources/activities/activity-submission.service.test.ts`
- Modify: `api/src/resources/activities/activity.controller.ts`
- Modify: `api/src/resources/activities/activity.interface.ts`
- Modify: `api/src/resources/activities/activity.service.ts`

**Interfaces:**
- Produces `CreateSubmissionDto { fileIds, repositoryIds, additionalLinks }`.
- Produces `ActivityService.createSubmission(activityId, input, requester)`, `findSubmissions(activityId, requester)`, and `getSubmissionFileDownload(activityId, submissionId, fileId, requester)`.
- Submission DTOs expose version, submitter, timestamps, `isLate`, URL snapshots, files, and optional evaluation.

- [ ] **Step 1: Write failing DTO and submission tests**

Cover all three requirement modes, 10-file/20-link limits, HTTP(S)-only distinct links, active membership/audience checks, PDF MIME enforcement, upload ownership, repository-project ownership, URL snapshots, versions before the deadline, first allowed late submission, blocked late submission, immutable post-deadline submission, and file-history authorization. Simulate a uniqueness conflict and assert the transaction retries or returns a deterministic conflict rather than duplicating a version.

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd api && pnpm test -- src/resources/activities/dto/create-submission.dto.test.ts src/resources/activities/activity-submission.service.test.ts`

Expected: FAIL because submission methods do not exist.

- [ ] **Step 3: Implement transactional append-only submissions**

Lock the `ActivityGroup` row for the activity/group before reading the latest version. Revalidate time and membership inside the transaction. Copy selected repository URLs into link rows, associate only owned private PDFs, append the version, and notify every active group member including the submitter.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd api && pnpm test -- src/resources/activities src/resources/notification`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/resources/activities api/src/resources/notification
git commit -m "feat(api): add versioned activity submissions"
```

### Task 5: Evaluation, Pipeline, and Project Delivery History

**Files:**
- Create: `api/src/resources/activities/dto/upsert-evaluation.dto.ts`
- Create: `api/src/resources/activities/dto/get-pipeline.dto.ts`
- Create: `api/src/resources/activities/dto/upsert-evaluation.dto.test.ts`
- Create: `api/src/resources/activities/activity-pipeline.service.test.ts`
- Modify: `api/src/resources/activities/activity.controller.ts`
- Modify: `api/src/resources/activities/activity.interface.ts`
- Modify: `api/src/resources/activities/activity.service.ts`
- Modify: `api/src/resources/projects/project.controller.ts`
- Modify: `api/src/resources/projects/project.interface.ts`
- Modify: `api/src/resources/projects/project.service.ts`
- Modify: `api/src/resources/projects/project.service.test.ts`
- Modify: `api/src/resources/projects/project.module.ts`

**Interfaces:**
- Produces `UpsertEvaluationDto { score: integer 0..100 }` and `ActivityService.upsertEvaluation(activityId, submissionId, input, requester)`.
- Produces `ActivityService.getPipeline(activityId, requester)` with `{ metrics, columns }` and statuses `not_viewed | viewed | not_submitted | submitted | evaluated`.
- Produces `ActivityService.findProjectActivities(projectId, requester)` and `GET /projects/:id/activities`.

- [ ] **Step 1: Write failing evaluation and pipeline tests**

Cover score boundaries, teacher/mentor writes, admin/student denial, current-version-only evaluation, grade updates, preservation of old-version grades, all five derived statuses, submission precedence over views, late badges, groups without projects, viewer lists, and nearest-integer metric rounding. Add project-service tests proving staff-only delivery history and delegation to the activity service.

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd api && pnpm test -- src/resources/activities/activity-pipeline.service.test.ts src/resources/activities/dto/upsert-evaluation.dto.test.ts src/resources/projects/project.service.test.ts`

Expected: FAIL on missing evaluation/pipeline interfaces.

- [ ] **Step 3: Implement evaluation and aggregate queries**

Query the latest submission per audience group, then derive status in the priority order fixed by the spec. Keep percentage calculation in one named pure helper exported only for its focused test. Integrate project history through `ActivityService` and use `forwardRef` only if Nest module resolution proves it necessary; do not add it preemptively.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd api && pnpm test -- src/resources/activities src/resources/projects`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/resources/activities api/src/resources/projects
git commit -m "feat(api): track and evaluate activity progress"
```

### Task 6: Idempotent Deadline Reminders and Notification Inbox Data

**Files:**
- Create: `api/src/resources/activities/activity-reminder.service.ts`
- Create: `api/src/resources/activities/activity-reminder.service.test.ts`
- Modify: `api/package.json`
- Modify: `api/pnpm-lock.yaml`
- Modify: `api/src/app.module.ts`
- Modify: `api/src/resources/activities/activity.module.ts`
- Modify: `api/src/resources/notification/dto/get-notification.dto.ts`
- Modify: `api/src/resources/notification/notification.service.ts`
- Modify: `api/src/resources/notification/notification.service.test.ts`

**Interfaces:**
- Produces `ActivityReminderService.processDueReminders(now = new Date()): Promise<number>`; the scheduled wrapper calls this method periodically.
- Notification DTO gains nullable `activity { id, title, dueAt }`, `submission { id, version, group }`, and `actor { id, name }` payloads while preserving `groupInvite`.

- [ ] **Step 1: Write failing reminder and notification DTO tests**

Use fake time to cover seven-day, three-day, and due-day 08:00 boundaries in `America/Sao_Paulo`; a deadline before 08:00; groups already submitted; archived/expired activities; recovery after 08:00; duplicate job runs; multiple API-instance uniqueness; and a deadline extension with a new revision. Assert inbox DTOs identify the actor and target activity/submission without breaking group invitations.

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd api && pnpm test -- src/resources/activities/activity-reminder.service.test.ts src/resources/notification/notification.service.test.ts`

Expected: FAIL because reminder processing and activity notification aggregation are absent.

- [ ] **Step 3: Add scheduling support and implement reminder processing**

Run: `cd api && pnpm add @nestjs/schedule`

Register `ScheduleModule.forRoot()` once. Keep the cron wrapper thin and test `processDueReminders` directly. Insert reminders with conflict-ignore against the database idempotency index, and return the number actually inserted.

- [ ] **Step 4: Run focused tests, build, and lint**

Run: `cd api && pnpm test -- src/resources/activities src/resources/notification && pnpm build && pnpm lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/package.json api/pnpm-lock.yaml api/src/app.module.ts api/src/resources/activities api/src/resources/notification
git commit -m "feat(api): send activity notifications and reminders"
```

### Task 7: Frontend Contracts, Navigation, Activity List, and Management Form

**Files:**
- Create: `web/src/types/activity.ts`
- Create: `web/src/types/activity.test.ts`
- Create: `web/src/modules/activities/list-page.tsx`
- Create: `web/src/modules/activities/list-page.test.tsx`
- Create: `web/src/modules/activities/dialogs/activity-form-dialog.tsx`
- Create: `web/src/modules/activities/dialogs/activity-form-dialog.test.tsx`
- Create: `web/src/modules/activities/upload-private-files.ts`
- Modify: `web/src/api/use-list.tsx`
- Modify: `web/src/api/writer.types.ts`
- Modify: `web/src/api/errors.ts`
- Modify: `web/src/router/routes.ts`
- Modify: `web/src/router/route-config.tsx`
- Modify: `web/src/router/route-config.test.tsx`
- Modify: `web/src/components/layout/auth-layout.tsx`
- Modify: `web/src/components/layout/app-sidebar.tsx`

**Interfaces:**
- Produces Zod schemas `activityFormSchema`, `activitySubmissionSchema`, and `activityEvaluationSchema` plus inferred request types and API response types.
- Produces routes `appRoutes.activities`, `activityDetailsRoute(id)`, typed reads for `/activities` and `/activities/:id`, and writer entries for upload/create/edit/archive.
- `uploadPrivateFiles(files)` returns the owned upload metadata required by create and submission calls.

- [ ] **Step 1: Write failing type, routing, permission, and form tests**

Assert all roles can navigate to “Atividades”; admin/teacher/mentor see create, only teacher/mentor see edit/archive, students see their status, Portuguese validation copy is used, due dates must be future dates, and reference files obey the 10-file/type/size rules. Extend route tests to resolve both activity routes.

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd web && pnpm test -- src/types/activity.test.ts src/modules/activities/list-page.test.tsx src/modules/activities/dialogs/activity-form-dialog.test.tsx src/router/route-config.test.tsx`

Expected: FAIL because types, pages, and routes do not exist.

- [ ] **Step 3: Implement the list and management UI**

Use existing card, dialog, form-field, badge, button, and skeleton primitives. Upload selected references privately before the JSON mutation. Keep controls restrained and role-derived from `useUser`; rely on the API for final authorization.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd web && pnpm test -- src/types/activity.test.ts src/modules/activities src/router/route-config.test.tsx src/components/layout`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/types/activity.ts web/src/types/activity.test.ts web/src/modules/activities web/src/api web/src/router web/src/components/layout
git commit -m "feat(web): add activity management"
```

### Task 8: Student Activity Details and Submission Flow

**Files:**
- Create: `web/src/modules/activities/details-page.tsx`
- Create: `web/src/modules/activities/details-page.test.tsx`
- Create: `web/src/modules/activities/components/submission-form.tsx`
- Create: `web/src/modules/activities/components/submission-form.test.tsx`
- Create: `web/src/modules/activities/components/submission-history.tsx`
- Modify: `web/src/api/use-list.tsx`
- Modify: `web/src/api/writer.types.ts`
- Modify: `web/src/router/route-config.tsx`

**Interfaces:**
- Details read includes activity metadata, reference downloads, current project repositories, and the authorized group's history.
- Submission writer sends `{ fileIds, repositoryIds, additionalLinks }` after private PDF uploads.

- [ ] **Step 1: Write failing student-details tests**

Cover view-triggering detail load, Portuguese requirement labels, selected existing repositories, repeated “Adicionar link” fields, duplicate/invalid URL errors, PDF-only enforcement, `links`/`files`/`both` behavior, pre-deadline resubmission, allowed first late submission, disabled controls after immutable states, and chronological version history with download actions.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd web && pnpm test -- src/modules/activities/details-page.test.tsx src/modules/activities/components/submission-form.test.tsx`

Expected: FAIL because student detail components are absent.

- [ ] **Step 3: Implement the student flow**

Keep repository checkboxes and additional URL fields in one form. Show explicit requirement and deadline messages before submission. After a successful write, revalidate the detail and submission-history SWR keys and show the API-derived version.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd web && pnpm test -- src/modules/activities`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/modules/activities web/src/api web/src/router/route-config.tsx
git commit -m "feat(web): add group activity submissions"
```

### Task 9: Staff Metrics, Kanban, Evaluation, and Project Integration

**Files:**
- Create: `web/src/modules/activities/components/activity-summary-cards.tsx`
- Create: `web/src/modules/activities/components/activity-kanban.tsx`
- Create: `web/src/modules/activities/components/activity-kanban.test.tsx`
- Create: `web/src/modules/activities/dialogs/evaluation-dialog.tsx`
- Create: `web/src/modules/activities/dialogs/evaluation-dialog.test.tsx`
- Create: `web/src/modules/projects/components/project-activity-deliveries.tsx`
- Create: `web/src/modules/projects/components/project-activity-deliveries.test.tsx`
- Modify: `web/src/modules/activities/details-page.tsx`
- Modify: `web/src/modules/activities/details-page.test.tsx`
- Modify: `web/src/modules/projects/project-details-page.tsx`
- Modify: `web/src/modules/projects/project-details-page.test.tsx`
- Modify: `web/src/modules/projects/project-details-page.integration.test.tsx`
- Modify: `web/src/api/use-list.tsx`
- Modify: `web/src/api/writer.types.ts`

**Interfaces:**
- Kanban consumes the API's `{ metrics, columns }` without re-deriving status on the client.
- Evaluation writer uses `PUT /activities/:id/submissions/:submissionId/evaluation` with `{ score }`.
- Project delivery component reads `GET /projects/:id/activities` and is mounted only for admin, teacher, and mentor.

- [ ] **Step 1: Write failing staff UI tests**

Render all five Portuguese columns, groups without projects, viewer names, versions, submitter/time, late marker, and grade. Assert summary percentages and responsive empty states. Verify teacher/mentor evaluation controls, admin read-only output, score validation, and the staff-only “Entregas” project section. Preserve every existing project-details assertion.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd web && pnpm test -- src/modules/activities src/modules/projects/project-details-page.test.tsx src/modules/projects/project-details-page.integration.test.tsx src/modules/projects/components/project-activity-deliveries.test.tsx`

Expected: FAIL on missing dashboard and project integration.

- [ ] **Step 3: Implement the staff dashboard and project section**

Use a horizontally scrollable five-column layout on narrow screens and a compact grid on wide screens. Cards are read-only status displays; do not add drag-and-drop. Merge the project section around the current local project-page work instead of replacing that file.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd web && pnpm test -- src/modules/activities src/modules/projects`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/modules/activities web/src/modules/projects web/src/api
git commit -m "feat(web): add activity progress dashboard"
```

### Task 10: Activity Notification Presentation

**Files:**
- Create: `web/src/modules/notifications/components/activity-notification-card.tsx`
- Modify: `web/src/types/notification.ts`
- Modify: `web/src/modules/notifications/notifications-page.tsx`
- Modify: `web/src/modules/notifications/notifications-page.test.tsx`

**Interfaces:**
- Extends the `Notification` union with activity, submission, actor, group, and deadline-revision data while preserving group-invite behavior.
- Activity notification cards link to `activityDetailsRoute(activity.id)` and support the existing mark-as-read action.

- [ ] **Step 1: Write failing notification presentation tests**

Cover Portuguese copy for publication, update, each reminder, and group submission; actor names; deadline/activity links; read/unread actions; and coexistence with invitation cards.

- [ ] **Step 2: Run tests and verify RED**

Run: `cd web && pnpm test -- src/modules/notifications/notifications-page.test.tsx`

Expected: FAIL because activity types are not rendered.

- [ ] **Step 3: Implement activity notification cards and dispatch**

Select the card component by notification type in `NotificationsList`. Keep the invitation response flow unchanged and reuse the existing mark-read behavior.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd web && pnpm test -- src/modules/notifications`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/types/notification.ts web/src/modules/notifications
git commit -m "feat(web): show activity notifications"
```

### Task 11: Full Verification and Documentation Alignment

**Files:**
- Modify only files required to fix failures attributable to Tasks 1–10.
- Verify: `docs/superpowers/specs/2026-10-06-activities-and-submissions-design.md`

**Interfaces:**
- Consumes every API and frontend interface produced above.
- Produces a branch where both independent applications build, lint, and pass their complete test suites.

- [ ] **Step 1: Run the complete API verification**

Run: `cd api && pnpm test && pnpm build && pnpm lint`

Expected: all tests pass, Nest builds, and Biome reports no errors.

- [ ] **Step 2: Run the complete web verification**

Run: `cd web && pnpm test && pnpm typecheck && pnpm build && pnpm lint`

Expected: all tests pass, TypeScript and Vite build, and Biome reports no errors.

- [ ] **Step 3: Inspect migration and working tree scope**

Run: `git diff --check && git status --short && git log --oneline --decorate -12`

Expected: no whitespace errors; the migration matches the schema; no credential, generated build output, unrelated user change, or application-level mock API is staged.

- [ ] **Step 4: Perform the spec coverage check**

Read the spec once more and map every scoped requirement to an API test and a frontend test. Add only missing observable-behavior coverage, rerun the affected suite, and record any unrelated pre-existing failures by exact test name.

- [ ] **Step 5: Commit verification fixes if needed**

```bash
git add <only-files-changed-by-verification>
git commit -m "test: verify activities workflow"
```
