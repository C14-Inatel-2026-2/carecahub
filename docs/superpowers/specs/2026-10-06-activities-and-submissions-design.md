# Activities and Submissions Design

## Goal

Bring the academic activity workflow currently handled in Microsoft Teams into
CarecaHub. Teachers, mentors, and administrators publish activities to all active
groups. Students view and submit the work as a group. Staff track progress,
teachers and mentors grade submissions, and the system sends in-app notifications
for publication, relevant edits, submissions, and deadlines.

The implementation must stay direct and consistent with the repository's existing
NestJS, Drizzle, React, SWR, shadcn, and Tailwind patterns. Code, identifiers,
routes, internal messages, and database values are in English. Only user-facing
frontend labels and copy are in Portuguese.

## Scope

This first version includes:

- immediate publication of an activity to a snapshot of every active group;
- reference attachments;
- per-student view tracking within each group;
- versioned group submissions made of PDF files, repository links, or both;
- configurable acceptance or rejection of a first late submission;
- group progress metrics and a derived-status kanban;
- integer grades from 0 through 100;
- activity publication, edit, deadline, and submission notifications;
- activity delivery information on staff-facing project details;
- archiving without physical deletion.

It does not include drafts, manual audience selection, email notifications,
comments or grading feedback, manually draggable kanban cards, queues, or a new
generic event system.

## Roles and Authorization

All authorization that depends on activity, group, submission, or file ownership
is enforced in the service layer. Controller role guards remain the first coarse
boundary.

| Capability | Admin | Teacher | Mentor | Student |
| --- | --- | --- | --- | --- |
| Publish an activity | Yes | Yes | Yes | No |
| List and read activities | All | All | All | Own audience group |
| Edit or archive an activity | No | Yes | Yes | No |
| View the full pipeline | Yes | Yes | Yes | No |
| Submit or view group submission history | No | All groups | All groups | Own audience group |
| Grade or change a grade | No | Yes | Yes | No |
| View grades | Yes | Yes | Yes | Own audience group |
| View project delivery information | Yes | Yes | Yes | No new project-detail access |

Any active teacher or mentor may edit an unarchived activity and evaluate any
current submission; these actions are not restricted to the activity author.
The system records the actor on publications, edits, submissions, and evaluations.

## Domain Model

The new `activities` API resource owns the activity workflow. It uses existing
group, project, repository, bucket, user, and notification resources directly,
without adding repository abstractions, event buses, or queues.

### Activity

`Activity` stores:

- title and description;
- `dueAt` as a timezone-aware timestamp;
- `allowLateSubmissions`;
- `submissionType`: `links`, `files`, or `both`;
- `createdById` and publication timestamp;
- archive timestamp plus the normal creation and update timestamps.

Creation publishes immediately; there is no draft state. A new activity must have
a future deadline and at least one active group. Archiving preserves all history
but prevents edits, submissions, evaluations, and future reminders.

Titles are trimmed and contain 3 through 255 characters. Descriptions are trimmed
and contain 1 through 10,000 characters. `dueAt` is supplied as an ISO 8601
timestamp and persisted with timezone information. `deadlineRevision` starts at
one and increments whenever the deadline changes so reminders for an extended
deadline are distinct from reminders already sent for the old deadline.

Before the first submission, teachers and mentors may edit all activity fields.
After the first submission, they may edit the title, description, reference
attachments, and extend the deadline. They may not shorten the deadline, change
the submission type, or change the late-submission policy. Every successful edit
that changes any of these user-facing fields creates a new in-app notification for
active students in the activity audience.

### Audience

`ActivityGroup` contains one row per non-deleted group that exists when an
activity is published. This is a stable group snapshot: later group creation does
not add an audience row and group deletion does not remove history.

The audience stores the group, not a project snapshot. Queries resolve the group's
current active project so groups without projects remain trackable and a later
project can appear on the activity. All percentage denominators use the complete
activity audience, including groups without projects.

A student who later joins an audience group can see and submit that activity. A
student who leaves no longer has group access, while their historical views and
submissions remain attributed to them.

### Views

`ActivityView` stores `activityId`, `groupId`, `userId`, and `viewedAt`, with one
row per activity and user. Successfully loading `GET /activities/:id` as an
authorized student records the view idempotently. Staff reads never count as a
student view. A group is considered viewed when at least one student has a view;
all viewers and their first-view times remain available to the pipeline.

### Versioned Submissions

`ActivitySubmission` stores `activityId`, `groupId`, `submittedById`, a
group-scoped version number, `submittedAt`, and `isLate`. Submissions are
append-only. The highest version is the current submission.

Before the deadline, any active member of the audience group may append a new
version. Once the deadline passes:

- an existing submission can never be replaced;
- when late submissions are disabled, no submission is accepted;
- when late submissions are enabled, a group with no submission may make exactly
  one first late submission, which is immediately immutable.

The service calculates the next version transactionally so simultaneous member
requests cannot create the same version.

`ActivitySubmissionFile` associates private bucket files with a submission.
Submission files are PDF only. `ActivitySubmissionLink` stores a URL snapshot and
an optional `repositoryId`. The frontend offers current active project
repositories as selectable links and supports any number of additional URL
inputs through an "Adicionar link" control.

Each submission accepts at most 20 distinct links. Links must be absolute HTTP or
HTTPS URLs no longer than 2,048 characters. Duplicate normalized URLs are
rejected. A selected repository must be active and belong to the audience group's
current active project at submission time; its URL is copied into the link row.

Validation by submission type is exact:

- `files` requires at least one PDF and does not require a link;
- `links` requires at least one valid URL and does not require a PDF;
- `both` requires at least one PDF and at least one valid URL.

A submission may contain up to 10 PDF files, each no larger than 100 MB.

### Evaluations

`ActivityEvaluation` belongs to one submission version and stores an integer
`score` from 0 through 100, `evaluatedById`, `evaluatedAt`, and update timestamps.
Teachers and mentors may create or update the evaluation for the current
submission. Administrators are read-only.

If a group submits a new version before the deadline, the previous evaluation is
preserved on its historical version. The new current version has no evaluation,
so the group returns to the delivered state until it is evaluated again.

### Reference Attachments and Private Files

`ActivityAttachment` associates an activity with a private bucket file. Reference
attachments accept the formats already supported by the bucket provider: PDF,
images, CSV, and plain text. An activity may have up to 10 reference files, each
no larger than 100 MB.

Private bucket files gain uploader ownership metadata. Upload responses expose a
stable file identifier. Activity creation, activity editing, and submission
creation accept previously uploaded file identifiers and verify uploader,
privacy, deletion state, type, size, and absence of an existing conflicting
association before using them.

Authorized activity and submission routes return short-lived download URLs.
Students may download activity references and files from their own group's
submission history. Admins, teachers, and mentors may download references and all
submission files. Raw private object keys are not treated as authorization.

## API Surface

The resource follows the repository convention with a module, controller,
service, interface, DTOs, and registration in `AppModule`. List endpoints use
`QueryDto` and service methods return `ServiceOutput<T>`.

Primary routes:

- `POST /activities` publishes an activity for admin, teacher, or mentor.
- `GET /activities` lists visible, non-archived activities with pagination and
  search. An explicit query flag includes archived activities for staff.
- `GET /activities/:id` returns details and records a student view.
- `PATCH /activities/:id` edits an activity for teacher or mentor.
- `PATCH /activities/:id/archive` archives an activity for teacher or mentor.
- `GET /activities/:id/pipeline` returns staff metrics and status columns.
- `GET /activities/:id/submissions` returns all histories to staff or the
  requester's group history to students.
- `POST /activities/:id/submissions` appends a group submission version.
- `PUT /activities/:id/submissions/:submissionId/evaluation` creates or updates
  the current version's evaluation for teacher or mentor.
- `GET /activities/:id/attachments/:fileId/download` authorizes a reference
  download.
- `GET /activities/:id/submissions/:submissionId/files/:fileId/download`
  authorizes a submitted PDF download.
- `GET /projects/:id/activities` returns the destination group's activity status,
  current submission, and grade for admin, teacher, or mentor.

The project route delegates to the activities service rather than duplicating
activity rules in the project resource.

## Notifications and Reminders

The existing notification resource is extended with activity and submission
references plus actor data sufficient to render meaningful cards. New notification
types cover:

- activity published;
- activity updated;
- deadline one week away;
- deadline three days away;
- deadline today;
- group submission created.

Publication and relevant updates notify every active student currently in an
audience group. The card names the admin, teacher, or mentor who performed the
action. Every submission version notifies all active members of that group,
including the submitter, and identifies the student who submitted it.

A small reminder service inside `ActivitiesModule` periodically looks for reminder
times that have passed. Reminder times are 08:00 in `America/Sao_Paulo`, seven
days before, three days before, and on the due date. A due-day reminder is not
created when the activity deadline is earlier than 08:00 that day.

Only groups without a submission receive reminders. Archived activities and
expired activities do not create reminders. Database uniqueness constraints make
each activity, deadline revision, group, reminder kind, and recipient combination
idempotent across restarts or multiple API instances. Extending a deadline can
therefore produce the appropriate reminder cycle for the new date without
duplicating a reminder within either cycle. If the API is unavailable at 08:00,
it sends the overdue reminder after recovery only while the activity deadline is
still in the future.

This version sends in-app notifications only; it does not send email.

## Pipeline and Metrics

Pipeline status is computed from durable activity data and cannot be dragged or
manually changed:

1. `not_viewed`: no student view and no submission;
2. `viewed`: at least one view, no submission, and the deadline has not passed;
3. `not_submitted`: the deadline has passed and there is no submission;
4. `submitted`: the current submission has no evaluation;
5. `evaluated`: the current submission has an evaluation.

Submission status takes precedence over view status, so direct API submission or
unusual navigation still produces the correct pipeline state. Late submissions
carry a visible late indicator while remaining in `submitted` or `evaluated`.

The activity details dashboard shows three percentages, rounded to the nearest
integer:

- viewed groups: groups with one or more student views;
- submitted groups: groups with one or more submissions;
- not-viewed groups: groups with no student views.

Each kanban card includes the group friendly identifier, current project name or
"Sem projeto", all student viewers, current version, submitter and submission
time, late indicator, and current score. Teacher and mentor cards expose the
evaluation action; admin cards remain read-only.

## Frontend

All roles receive an “Atividades” sidebar item and routes at `/activities` and
`/activities/:id`.

The list shows title, due date, requirements, and relevant status. Students see
their group's delivery state. Admins, teachers, and mentors see the complete list
and a create action. Only teachers and mentors see edit and archive actions.

The activity details page shows description, deadline, late policy, required
submission type, and reference attachments. For students it also shows group
submission history and a submission form. The form lists existing project
repositories as checkboxes, adds arbitrary URL inputs on demand, uploads PDFs,
and enforces the configured submission type before calling the API.

For admins, teachers, and mentors, the details page shows the three metric cards
and a responsive read-only kanban with Portuguese column labels. Evaluation is a
small dialog available only to teachers and mentors.

The existing project details page receives a staff-only “Entregas” section that
lists each activity, derived status, current version, latest submission time, late
indicator, and grade for the project's group.

Frontend schemas and request types live in `web/src/types/activity.ts` and use
`z.infer`. Mutations use the typed `writer` result and reads use the existing SWR
fetchers/hooks. Feature pages and dialogs live in `web/src/modules/activities/`.
No frontend API mock layer is introduced.

## Transactions, Errors, and Concurrency

Activity creation inserts the activity, complete audience, attachment links, and
publication notifications in one database transaction. Submission creation
performs membership, deadline, requirement, file ownership, repository, and
version checks in one transaction. Evaluation verifies that the target is the
current submission before writing.

Expected validation and authorization failures return existing `ErrKeys` where
their meaning is accurate, with narrowly named new keys only when the frontend
needs to distinguish deadline, immutable submission, or invalid file-requirement
states. Logs never contain file contents, signed URLs, cookies, credentials,
authorization headers, or connection strings.

## Testing Strategy

API tests focus on observable behavior and authorization boundaries:

- role access for creation, editing, archiving, pipeline, submission, evaluation,
  project history, and file download;
- audience snapshots and groups without projects;
- idempotent per-student view recording;
- membership changes after publication;
- submission requirements for `links`, `files`, and `both`;
- existing repository selection and arbitrary URL validation;
- version creation before the deadline;
- blocked, permitted-first, and immutable late submission behavior;
- post-submission activity edit restrictions;
- evaluation score boundaries and evaluation of only the current version;
- preservation of historical evaluations after resubmission;
- private upload ownership and download authorization;
- publication, update, submission, and recipient notification content;
- reminder timing in `America/Sao_Paulo`, non-recipient filtering, restart
  recovery, and database idempotency;
- pipeline status precedence and metric rounding.

Time-dependent tests use a controlled clock. Tests exercise real service behavior
with the repository's existing database test conventions and avoid assertions
that merely prove mocks were called.

Frontend tests cover role-dependent controls, Portuguese labels, form validation,
repository selection, repeated URL fields, PDF requirements, metrics, all five
derived kanban states, submission history, evaluation, and the project delivery
section. They test user-visible behavior without adding an application-level API
mock implementation.
