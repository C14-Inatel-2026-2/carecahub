# Group Invitations and Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let group leaders invite eligible students and let recipients accept or reject those invitations from a persistent notifications inbox.

**Architecture:** Drizzle stores invitation state separately from the recipient-facing notification, while one Nest resource owns listing, candidate search, creation, and transactional responses. The React client adds typed SWR reads, typed mutations, an invitation dialog, and a notifications route; accepting refreshes the existing authenticated-user store.

**Tech Stack:** PostgreSQL, Drizzle ORM, NestJS, class-validator, Vitest, React 19, React Router, SWR, Zustand, shadcn/Base UI, Tailwind CSS, Zod.

**Spec:** `docs/superpowers/specs/2026-09-30-group-invitations-notifications-design.md`

## Global Constraints

- Keep the implementation direct and consistent with existing resource and UI patterns; do not add generic repositories, event buses, queues, speculative caching, or new dependencies.
- Use `api/src/resources/notification/` for the Nest resource and register `NotificationModule` in `AppModule`.
- Use `QueryDto` for list endpoints, `ServiceOutput<T>` for service contracts, soft deletion fields, and service-level ownership checks.
- Keep the maximum active group size at six.
- Do not create frontend API mocks.
- Do not commit any implementation or plan changes; the user explicitly requested an uncommitted working tree.
- Apply TDD to behavioral production code: add a focused failing test, observe the expected failure, implement the minimum behavior, then rerun focused and related tests.

## Review Focus

- Two pending invitations for the same group and recipient must be rejected even under concurrent requests; cover the database partial unique index and the service's unique-violation mapping in Task 2.
- Concurrent acceptances must not place one student in two groups or let a group exceed six active members; cover lock ordering and stale-state revalidation in Task 4.
- A user must never list, read, or respond to another user's notification; cover every ownership boundary in Tasks 2 and 4.
- A student who becomes ineligible between candidate search and send/accept must not be added or leave partial records; cover repeated transaction-time validation in Tasks 3 and 4.
- Sidebar unread state and the authenticated user's `groupId` must update without a reload after responding; cover shared SWR keys and `loadUser()` in Tasks 5 and 7.

---

### Task 1: Drizzle enums, entities, relations, and migration

**Files:**
- Create: `api/src/drizzle/schema/enums/notificationEnums.ts`
- Create: `api/src/drizzle/schema/enums/notificationEnums.test.ts`
- Create: `api/src/drizzle/schema/entities/notification.ts`
- Create: `api/src/drizzle/schema/entities/notification.test.ts`
- Modify: `api/src/drizzle/schema/enums/index.ts`
- Modify: `api/src/drizzle/schema/entities/index.ts`
- Modify: `api/src/drizzle/schema.ts`
- Modify: `api/src/drizzle/index.ts`
- Generate: `api/src/drizzle/migrations/0010_*.sql`
- Generate: `api/src/drizzle/migrations/meta/0010_snapshot.json`
- Modify: `api/src/drizzle/migrations/meta/_journal.json`

**Interfaces:**
- Produces: `GROUP_INVITE_STATUSES`, `GroupInviteStatus`, `groupInviteStatusEnum`, `NOTIFICATION_TYPES`, `NotificationType`, `notificationTypeEnum`.
- Produces: `groupInvites`, `notifications`, their public column maps, and Drizzle relations to `groups` and `users`.

- [x] **Step 1: Write failing schema tests**

Assert the exact enum values and inspect Drizzle table configuration for the required columns, foreign keys, unique `groupInviteId`, and partial unique index on pending/non-deleted `(groupId, inviteeId)` records.

- [x] **Step 2: Run the schema tests and verify RED**

Run: `cd api && pnpm test src/drizzle/schema/enums/notificationEnums.test.ts src/drizzle/schema/entities/notification.test.ts`

Expected: FAIL because the notification enums and entities do not exist.

- [x] **Step 3: Implement and export the schema**

Define `GroupInvite` and `Notification` with the exact fields and defaults from the spec. Use restrictive/default foreign-key behavior, soft-delete timestamps, `relations(...)`, and a partial `uniqueIndex` limited to `status = 'pending'` and `deletedAt IS NULL`.

- [x] **Step 4: Rerun schema tests and verify GREEN**

Run: `cd api && pnpm test src/drizzle/schema/enums/notificationEnums.test.ts src/drizzle/schema/entities/notification.test.ts`

Expected: PASS.

- [x] **Step 5: Generate and review the migration**

Run: `cd api && pnpm db:g`

Confirm the generated `0010` SQL and snapshot create both enums, both tables, all foreign keys, the one-to-one notification/invite constraint, and the partial duplicate-prevention index without dropping unrelated objects.

### Task 2: Notification inbox, DTOs, ownership, and module registration

**Files:**
- Create: `api/src/resources/notification/dto/get-notification.dto.ts`
- Create: `api/src/resources/notification/notification.interface.ts`
- Create: `api/src/resources/notification/notification.service.ts`
- Create: `api/src/resources/notification/notification.service.test.ts`
- Create: `api/src/resources/notification/notification.controller.ts`
- Create: `api/src/resources/notification/notification.module.ts`
- Create: `api/src/resources/notification/notification.module.test.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Produces: `NotificationService.findAll(query: QueryDto, requester: UserMetadata): Promise<ListNotificationOutput>`.
- Produces: `NotificationService.markAsRead(notificationId: string, requester: UserMetadata): Promise<GetNotificationOutput>`.
- Produces: `GetNotificationDto` containing base timestamps, `type`, `readAt`, and an aggregated `groupInvite` with status, group summary, and inviter summary.
- Produces: `GET /notifications` and `PATCH /notifications/:id/read`.

- [x] **Step 1: Write failing inbox service tests**

Test newest-first pagination, `totalCount`, `unreadCount`, DTO aggregation, idempotent reads by the owner, `notFound` for missing records, and `forbidden` when a different user tries to mark a notification.

- [x] **Step 2: Run the focused service tests and verify RED**

Run: `cd api && pnpm test src/resources/notification/notification.service.test.ts`

Expected: FAIL because the resource does not exist.

- [x] **Step 3: Implement the read-side service and DTO**

Select only non-deleted notifications for `requester.userId`, join the non-sensitive invitation/group/inviter fields needed by the DTO, and update `readAt` only after checking ownership.

- [x] **Step 4: Rerun the service tests and verify GREEN**

Run: `cd api && pnpm test src/resources/notification/notification.service.test.ts`

Expected: PASS.

- [x] **Step 5: Write a failing module registration test**

Assert that `NotificationModule` resolves its controller/service dependencies and is present in `AppModule` imports.

- [x] **Step 6: Run the module test and verify RED**

Run: `cd api && pnpm test src/resources/notification/notification.module.test.ts`

Expected: FAIL until the module, controller, and app registration exist.

- [x] **Step 7: Add the controller and module**

Use `@ApiController('notifications')`, `@User()`, `@UUIDParam()`, `@Roles(...)`, and thin methods that delegate directly to the service.

- [x] **Step 8: Rerun notification module and service tests**

Run: `cd api && pnpm test src/resources/notification/notification.module.test.ts src/resources/notification/notification.service.test.ts`

Expected: PASS.

### Task 3: Candidate search and invitation creation

**Files:**
- Create: `api/src/resources/notification/dto/group-invite.dto.ts`
- Create: `api/src/resources/notification/dto/group-invite.dto.test.ts`
- Modify: `api/src/resources/notification/notification.interface.ts`
- Modify: `api/src/resources/notification/notification.service.ts`
- Modify: `api/src/resources/notification/notification.service.test.ts`
- Modify: `api/src/resources/notification/notification.controller.ts`

**Interfaces:**
- Produces: `CreateGroupInviteDto { inviteeId: string }` validated as UUID.
- Produces: `NotificationService.findGroupInviteCandidates(query: QueryDto, requester: UserMetadata): Promise<ListGroupInviteCandidatesOutput>`.
- Produces: `NotificationService.createGroupInvite(input: CreateGroupInviteDto, requester: UserMetadata): Promise<GetNotificationOutput>`.
- Produces: `GET /notifications/group-invites/candidates` and `POST /notifications/group-invites`.

- [x] **Step 1: Write failing DTO tests**

Assert that a UUID invitee is accepted and malformed/missing identifiers are rejected.

- [x] **Step 2: Run DTO tests and verify RED**

Run: `cd api && pnpm test src/resources/notification/dto/group-invite.dto.test.ts`

Expected: FAIL because the DTO does not exist.

- [x] **Step 3: Implement the create DTO and verify GREEN**

Run: `cd api && pnpm test src/resources/notification/dto/group-invite.dto.test.ts`

Expected: PASS.

- [x] **Step 4: Add failing candidate and creation service tests**

Cover leader-only access; name/e-mail/GitHub search; active, non-deleted, ungrouped students; exclusion of self and same-group pending invitees; groups at capacity; ineligible recipients; atomic invitation/notification insertion; and unique-violation mapping to `alreadyExists`.

- [x] **Step 5: Run service tests and verify RED**

Run: `cd api && pnpm test src/resources/notification/notification.service.test.ts`

Expected: FAIL because candidate and creation methods are absent.

- [x] **Step 6: Implement candidate search, creation transaction, and controller routes**

Infer the active group from the authenticated leader, repeat eligibility checks during creation, lock/recheck the group before counting members, and insert both records in one transaction.

- [x] **Step 7: Rerun notification tests and verify GREEN**

Run: `cd api && pnpm test src/resources/notification`

Expected: PASS.

### Task 4: Transactional invitation response

**Files:**
- Modify: `api/src/resources/notification/dto/group-invite.dto.ts`
- Modify: `api/src/resources/notification/dto/group-invite.dto.test.ts`
- Modify: `api/src/resources/notification/notification.interface.ts`
- Modify: `api/src/resources/notification/notification.service.ts`
- Modify: `api/src/resources/notification/notification.service.test.ts`
- Modify: `api/src/resources/notification/notification.controller.ts`

**Interfaces:**
- Produces: `RespondGroupInviteDto { status: 'accepted' | 'rejected' }`.
- Produces: `NotificationService.respondToGroupInvite(inviteId: string, input: RespondGroupInviteDto, requester: UserMetadata): Promise<RespondGroupInviteOutput>` returning the final status and accepted `groupId` when applicable.
- Produces: `PATCH /notifications/group-invites/:id/respond`.

- [x] **Step 1: Extend DTO tests for response validation and verify RED**

Assert that only `accepted` and `rejected` pass; reject `pending`, `cancelled`, arbitrary strings, and missing values.

Run: `cd api && pnpm test src/resources/notification/dto/group-invite.dto.test.ts`

Expected: FAIL until `RespondGroupInviteDto` exists.

- [x] **Step 2: Implement the response DTO and verify GREEN**

Run: `cd api && pnpm test src/resources/notification/dto/group-invite.dto.test.ts`

Expected: PASS.

- [x] **Step 3: Add failing response service tests**

Cover recipient ownership, pending-only responses, rejection timestamps/read state, successful acceptance, student-first/group-second row locking, stale user/group revalidation, six-member limit, cancellation of the recipient's other invites, cancellation of the full group's remaining invites, and rollback-safe failure results.

- [x] **Step 4: Run service tests and verify RED**

Run: `cd api && pnpm test src/resources/notification/notification.service.test.ts`

Expected: FAIL because response behavior is absent.

- [x] **Step 5: Implement transactional accept/reject and the route**

For acceptance, lock and reload the invitee before the group, then perform membership and all invite/notification state changes inside the same Drizzle transaction. For rejection, verify recipient and pending state before changing status, `respondedAt`, and `readAt`.

- [x] **Step 6: Rerun all notification and group service tests**

Run: `cd api && pnpm test src/resources/notification src/resources/groups/group.service.test.ts`

Expected: PASS.

### Task 5: Typed frontend contracts and SWR reads

**Files:**
- Create: `web/src/types/notification.ts`
- Create: `web/tests/notification-types.test.ts`
- Modify: `web/src/types/api.ts`
- Modify: `web/src/api/use-list.tsx`
- Modify: `web/src/api/writer.types.ts`

**Interfaces:**
- Produces: `Notification`, `GroupInvite`, `NotificationType`, `GroupInviteStatus`, `CreateGroupInviteRequest`, and `RespondGroupInviteRequest`.
- Extends: `useList` with `/notifications` and `/notifications/group-invites/candidates`, plus returned `unreadCount`.
- Extends: `WriterMap` with invitation creation, response, and mark-read endpoints.

- [x] **Step 1: Write failing Zod/type contract tests**

Assert allowed response statuses and UUID invitee validation, mirroring the API DTO restrictions.

- [x] **Step 2: Run the focused web test and verify RED**

Run: `cd web && pnpm test tests/notification-types.test.ts`

Expected: FAIL because notification contracts do not exist.

- [x] **Step 3: Implement types, schemas, list mappings, and writer mappings**

Keep notification list consumers on the same `{ skip: 0, take: 100 }` SWR key so the page and sidebar share revalidation and unread state.

- [x] **Step 4: Rerun contract tests and typecheck**

Run: `cd web && pnpm test tests/notification-types.test.ts && pnpm typecheck`

Expected: PASS.

### Task 6: Invitation dialog on Meu Projeto

**Files:**
- Modify: `web/src/modules/my-project/components/invite-user-card.tsx`
- Create: `web/src/modules/my-project/dialogs/invite-user-dialog.tsx`
- Create: `web/src/modules/my-project/dialogs/invite-user-dialog.test.tsx`
- Modify: `web/src/modules/my-project/my-project-page.tsx`

**Interfaces:**
- Produces: `InviteUserDialog`, with the existing invite card as its accessible trigger.
- Consumes: candidate `useList`, `useDebounce`, and `writer('POST /notifications/group-invites', ...)`.

- [x] **Step 1: Write a failing component test**

Render the dialog entry point and assert an accessible invitation button plus the dialog title/description contract used when opened; separately render candidate rows to assert name, e-mail, GitHub, and invite action copy.

- [x] **Step 2: Run the focused component test and verify RED**

Run: `cd web && pnpm test src/modules/my-project/dialogs/invite-user-dialog.test.tsx`

Expected: FAIL because the dialog does not exist and the card is not an accessible button trigger.

- [x] **Step 3: Implement the dialog and wire it into MyProjectPage**

Use the existing `Dialog`, `Input`, `Button`, `useDebounce`, loading/empty patterns, typed writer, and candidate-list revalidation after a successful invite. Preserve the current leader and six-member visibility guard.

- [x] **Step 4: Rerun component tests and typecheck**

Run: `cd web && pnpm test src/modules/my-project/dialogs/invite-user-dialog.test.tsx tests/create-group-button.test.ts && pnpm typecheck`

Expected: PASS.

### Task 7: Notifications page, route, sidebar, and session refresh

**Files:**
- Create: `web/src/modules/notifications/components/group-invite-notification-card.tsx`
- Create: `web/src/modules/notifications/notifications-page.tsx`
- Create: `web/src/modules/notifications/notifications-page.test.tsx`
- Modify: `web/src/router/routes.ts`
- Modify: `web/src/router/index.tsx`
- Modify: `web/src/components/layout/auth-layout.tsx`
- Modify: `web/src/components/layout/app-sidebar.tsx`

**Interfaces:**
- Produces: authenticated `/notifications` route for every role.
- Consumes: `useList({ endpoint: '/notifications', params: { skip: 0, take: 100 } })`, response/read writers, and `useUser().loadUser`.

- [x] **Step 1: Write failing presentation and routing tests**

Assert pending cards expose accept/reject actions, resolved cards expose only translated status, empty state copy is present, `appRoutes.notifications` is common to every role, and the sidebar renders `Notificações` with unread indicator semantics.

- [x] **Step 2: Run focused tests and verify RED**

Run: `cd web && pnpm test src/modules/notifications/notifications-page.test.tsx`

Expected: FAIL because page, card, route, and sidebar item do not exist.

- [x] **Step 3: Implement the page and navigation**

Use the shared notifications SWR key in both page and sidebar. On accept, await the typed mutation, revalidate notifications, and await `loadUser()`; on reject/read, revalidate notifications only. Disable actions while their request is pending and show loading, error, empty, and final-status states.

- [x] **Step 4: Rerun focused frontend tests and typecheck**

Run: `cd web && pnpm test src/modules/notifications/notifications-page.test.tsx && pnpm typecheck`

Expected: PASS.

### Task 8: Full verification and migration review

**Files:**
- Review only: all files changed in Tasks 1–7.

**Interfaces:**
- Verifies: the complete API/database/web contract from the approved spec.

- [x] **Step 1: Run API tests**

Run: `cd api && pnpm test`

Expected: all tests PASS with no unreported failures.

- [x] **Step 2: Run API lint and build**

Run: `cd api && pnpm lint && pnpm build`

Expected: both commands PASS; apply only scoped formatting fixes if needed.

- [x] **Step 3: Run web tests**

Run: `cd web && pnpm test`

Expected: all tests PASS with no unreported failures.

- [x] **Step 4: Run web lint, typecheck, and build**

Run: `cd web && pnpm lint && pnpm typecheck && pnpm build`

Expected: all commands PASS; apply only scoped formatting fixes if needed.

- [x] **Step 5: Review the final uncommitted diff**

Run: `git diff --check && git status --short && git diff --stat`

Confirm there are no credentials, generated build artifacts, unrelated edits, missing migration metadata, or commits beyond the already-approved specification commit.
