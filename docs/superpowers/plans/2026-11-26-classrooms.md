# Gestão de Turmas por Semestre Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Administrar turmas semestrais, vincular alunos e audiência de atividades a elas e entregar dashboards de turma com acesso restrito à equipe.

**Architecture:** Uma `Classroom` é a fonte de verdade da turma e relaciona alunos, grupos e atividades. O novo recurso Nest calcula os resumos no servidor; o frontend consome rotas tipadas com SWR e mantém os controles de acesso já usados pelo layout autenticado. A tabela `ActivityClassroom` torna a visibilidade da atividade independente de o aluno já ter grupo, enquanto `ActivityGroup` continua sendo a elegibilidade concreta de entrega.

**Tech Stack:** PostgreSQL + Drizzle ORM, NestJS, class-validator, React 19, React Router, SWR, React Hook Form, Zod, shadcn/Tailwind, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-classrooms-design.md`

## Global Constraints

- Usar Drizzle/PostgreSQL, Nest e React/SWR existentes; não adicionar bibliotecas.
- Recursos da API ficam em `api/src/resources/<resource>/` com module, controller, service, interface e DTOs; registrar o módulo em `AppModule`.
- Listas usam `QueryDto`; serviços retornam `ServiceOutput<T>` e exclusões permanecem soft delete quando aplicável.
- Aplicar autorização no backend e em `pagesByRole`/rotas do frontend.
- Usar `writer("METHOD /path", options)` nas mutações e SWR nos reads; não criar mocks da API para o frontend.
- Turmas arquivadas preservam todos os vínculos e histórico, mas não aceitam cadastro, nova audiência de atividade ou mudança de grupo.
- O semestre legado é `2026.2`; grupos legados inconsistentes usam a turma do líder.

## Review Focus

- `classroomId` inexistente ou arquivado deve ser rejeitado antes de iniciar o registro público — coberto na Task 3.
- Publicar para turma sem grupo deve permitir visualização, mas impedir envio até que o aluno integre um grupo elegível — coberto na Task 4.
- Filtro de turma deve alterar tanto as linhas quanto os cartões de analytics de usuários — coberto na Task 5.
- Aluno de outra turma não pode entrar em grupo, ver ou enviar entrega de turma alheia — coberto na Tasks 3 e 4.
- Falha/rate limit do GitHub não pode derrubar dashboard; commits daquele repositório contam zero — coberto na Task 2.

---

### Task 1: Persistência e migração de turmas

**Files:**
- Create: `api/src/drizzle/schema/entities/classroom.ts`
- Create: `api/src/drizzle/schema/entities/classroom.test.ts`
- Modify: `api/src/drizzle/schema/entities/index.ts`
- Modify: `api/src/drizzle/schema/entities/user.ts`
- Modify: `api/src/drizzle/schema/entities/group.ts`
- Modify: `api/src/drizzle/schema/entities/activity.ts`
- Modify: `api/src/drizzle/schema.ts`
- Modify: `api/src/drizzle/index.ts`
- Create: `api/src/drizzle/migrations/0015_classrooms.sql`
- Create: `api/src/drizzle/migrations/meta/0015_snapshot.json`
- Modify: `api/src/drizzle/migrations/meta/_journal.json`

**Interfaces:**
- Produces `classrooms`, `activityClassrooms`, `users.classroomId` and `groups.classroomId` for all later tasks.
- `Classroom` has `{ id, name, semester, archivedAt, createdAt, updatedAt }`; `(name, semester)` is unique.

- [ ] **Step 1: Write schema contract assertions before changing the schema**

Create `classroom.test.ts` using Drizzle table metadata. Assert that the exported schema has `classrooms`, `activityClassrooms`, `users.classroomId` and `groups.classroomId`, and that the activity/classroom junction has both ID columns. The test must import the future public exports so it demonstrates their intended contract.

- [ ] **Step 2: Run the focused schema/migration check to verify it fails**

Run: `cd api && pnpm test -- classroom.test`

Expected: FAIL because `Classroom`, `ActivityClassroom`, columns and migration do not exist.

- [ ] **Step 3: Implement Drizzle schema and migration `0015_classrooms.sql`**

Create `Classroom`; add nullable `classroom_id` references to `User` and `Group`; add `ActivityClassroom(activity_id, classroom_id)` with unique pair. In SQL, create distinct `2026.2` classrooms from non-null legacy `User.classroom`, backfill users, set each legacy group to its leader's classroom, backfill distinct activity/classroom pairs through existing `ActivityGroup` rows, then drop the textual user column. Export every table/type through the existing schema barrels and generate the Drizzle snapshot with the repository command.

- [ ] **Step 4: Run schema generation and focused checks**

Run: `cd api && pnpm db:g && pnpm test -- classroom.test`

Expected: PASS; generated SQL/snapshot matches schema and no legacy non-null classroom is discarded.

- [ ] **Step 5: Commit**

```bash
git add api/src/drizzle
git commit -m "feat: add semester classrooms schema"
```

### Task 2: Classroom API, lifecycle and metrics

**Files:**
- Create: `api/src/resources/classrooms/classroom.module.ts`
- Create: `api/src/resources/classrooms/classroom.controller.ts`
- Create: `api/src/resources/classrooms/classroom.service.ts`
- Create: `api/src/resources/classrooms/classroom.interface.ts`
- Create: `api/src/resources/classrooms/dto/create-classroom.dto.ts`
- Create: `api/src/resources/classrooms/dto/get-classroom.dto.ts`
- Create: `api/src/resources/classrooms/dto/get-classroom-query.dto.ts`
- Create: `api/src/resources/classrooms/classroom.service.test.ts`
- Create: `api/src/resources/classrooms/classroom.controller.test.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Consumes Task 1 tables and `GitHubService`.
- Produces `GET /classrooms`, `GET /classrooms/:id`, `POST /classrooms`, `PATCH /classrooms/:id/archive` for `admin|teacher|mentor`, plus public `GET /classrooms/registration-options` returning `ClassroomOption[]`.
- `ClassroomSummary` exposes `{ id, name, semester, archivedAt, studentsCount, groupsCount, projectsCount, deliveryRate, commitsCount }`.

- [ ] **Step 1: Write failing service/controller tests**

Test role denial, `semester` regex and duplicate name rejection, active/archived filtering, archive idempotency failure, registration options excluding archived rooms, aggregate counts, valid-submission delivery percentage, and GitHub failure contributing zero commits. Test public options route is declared before `:id` and marked `@Public()`.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `cd api && pnpm test -- classroom.service classroom.controller`

Expected: FAIL because the resource and endpoints do not exist.

- [ ] **Step 3: Implement the classroom resource**

Use `GetClassroomQueryDto extends QueryDto` with optional `semester` and `status: 'active' | 'archived'`. In `ClassroomService`, expose `findAll`, `findOne`, `create`, `archive`, and `findRegistrationOptions`. Compute student/group/project/submission aggregates from the new links; fetch default-branch counts through the existing GitHub service, treating unsuccessful responses as zero. Preserve historical data during archive and reject all mutations/registration targeting archived rooms.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `cd api && pnpm test -- classroom.service classroom.controller`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/resources/classrooms api/src/app.module.ts
git commit -m "feat: add classroom management API"
```

### Task 3: Registration, administrative users and group integrity

**Files:**
- Modify: `api/src/resources/auth/dtos/register.dto.ts`
- Modify: `api/src/resources/auth/auth.service.ts`
- Modify: `api/src/providers/cache/cache.types.ts`
- Modify: `api/src/resources/auth/auth.service.test.ts`
- Modify: `api/src/resources/users/dto/upsert-user.dto.ts`
- Modify: `api/src/resources/users/dto/get-user.dto.ts`
- Modify: `api/src/resources/users/user.service.ts`
- Modify: `api/src/resources/users/user.controller.ts`
- Modify: `api/src/resources/users/user.interface.ts`
- Modify: `api/src/resources/users/user.service.test.ts`
- Modify: `api/src/resources/users/user.controller.test.ts`
- Modify: `api/src/resources/groups/group.service.ts`
- Modify: `api/src/resources/groups/group.service.test.ts`

**Interfaces:**
- Consumes `ClassroomService`/Task 1 tables.
- Changes public/admin student payloads from `classroom: string` to `classroomId: string`, with user responses containing a `{ id, name, semester, archivedAt } | null` classroom projection.
- Extends `GET /users` and `GET /users/analytics` with optional UUID `classroomId` query filtering.

- [ ] **Step 1: Write failing tests for classroom-bound registrations and users**

Test public registration rejects unknown/archived rooms, persists the active `classroomId` through cache confirmation, and creates the student with that relationship. Test admin student creation/update validates classroom ID; non-student has no classroom. Test the same `classroomId` narrows both `findAll` and analytics. Test group creation, invitation, removal, departure and leader change reject mutations after the classroom is archived; test creation/invitation also rejects missing or different-classroom students.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `cd api && pnpm test -- auth.service user.service user.controller group.service`

Expected: FAIL because the payload, cache data and classroom guards are absent.

- [ ] **Step 3: Implement registration and group changes**

Validate active rooms directly through Drizzle or an injected classroom service without creating a circular module dependency. Add `classroomId` to `RegisterDto` and registration cache payload, then include it in the confirmed insert. Replace user DTO/storage handling of textual classroom with the classroom projection and add UUID query validation to the list/analytics endpoints. When creating a group, copy the leader's active `classroomId`; when adding a member, require the same class; reject group changes for archived rooms.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `cd api && pnpm test -- auth.service user.service user.controller group.service`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/resources/auth api/src/providers/cache api/src/resources/users api/src/resources/groups
git commit -m "feat: link registrations and groups to classrooms"
```

### Task 4: Atividades por turma e entregas elegíveis

**Files:**
- Modify: `api/src/resources/activities/dto/create-activity.dto.ts`
- Modify: `api/src/resources/activities/dto/update-activity.dto.ts`
- Modify: `api/src/resources/activities/activity.service.ts`
- Modify: `api/src/resources/activities/activity.service.test.ts`
- Modify: `api/src/resources/groups/group.service.ts`
- Modify: `api/src/resources/groups/group.service.test.ts`

**Interfaces:**
- Consumes `ActivityClassroom`, `groups.classroomId`, and `users.classroomId`.
- `CreateActivityDto.classroomIds: string[]` is required and immutable after creation; `UpdateActivityDto` does not expose it.

- [ ] **Step 1: Write failing activity/group tests**

Test publishing validates unique active classroom IDs; writes `ActivityClassroom`; sends notifications only to selected students; accepts a class with zero groups; and makes it visible to an ungrouped student in that class but inaccessible to another class. Test a new group receives `ActivityGroup` rows for open activities of its class and can submit; a different-class group cannot. Test update does not change audience.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `cd api && pnpm test -- activity.service group.service`

Expected: FAIL because activities are currently sent to every group and students without groups see none.

- [ ] **Step 3: Implement class-scoped audience behavior**

Change `ActivityService.create`, student `findAll`/`findOne`, audience checks, submission authorization and notification recipient lookup to use `ActivityClassroom` plus the student's/group's classroom. Create the `ActivityGroup` projection only for extant groups and, inside successful `GroupService.create`, add the new group to non-archived class-targeted activities. Keep deadline and invalidation rules unchanged.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `cd api && pnpm test -- activity.service group.service`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/resources/activities api/src/resources/groups
git commit -m "feat: target activities by classroom"
```

### Task 5: Frontend contracts and user filtering

**Files:**
- Create: `web/src/types/classroom.ts`
- Modify: `web/src/types/auth.ts`
- Modify: `web/src/types/user.ts`
- Modify: `web/src/types/activity.ts`
- Modify: `web/src/api/use-list.tsx`
- Modify: `web/src/api/writer.types.ts`
- Modify: `web/src/components/profile-details.tsx`
- Modify: `web/src/mocks/users.ts`
- Modify: `web/src/modules/users/use-user-analytics.ts`
- Modify: `web/src/modules/users/users-page.tsx`
- Modify: `web/src/modules/users/user-analytics.ts`
- Modify: `web/src/modules/users/users-and-mentors-page.test.tsx`
- Create: `web/src/modules/users/users-page.test.tsx`

**Interfaces:**
- Consumes API responses from Tasks 2–4.
- Defines `Classroom`, `ClassroomOption`, `ClassroomSummary`, `ClassroomDetails`, and uses `classroomId` in registration/user/activity request schemas.
- Extends typed `useList`/`useGet` endpoint maps and `WriterMap` for classroom routes.

- [ ] **Step 1: Write failing web tests**

Render `UsersPage` with two classroom options and assert selecting a room sends `classroomId` in both the `/users` list key and `/users/analytics` key, then renders only the matching rows and analytics fixture. Assert users without a classroom remain representable.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `cd web && pnpm test -- users-page`

Expected: FAIL because class types, endpoint params and filter do not exist.

- [ ] **Step 3: Implement typed contracts and admin filter**

Replace frontend textual classroom validation/display with the classroom object/ID, including profile rendering and existing mock fixture types. Add typed `'/classrooms'`, `'/classrooms/registration-options'`, `'/classrooms/:id'` reads and classroom writes. Extend `Activity` with its target classroom projections for read-only edit display. Load active options in `UsersPage`, show a class select alongside search, include the chosen ID in `useList` and `useUserAnalytics`, and clear both SWR caches after mutation.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `cd web && pnpm test -- users-page users-and-mentors-page`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/types web/src/api web/src/modules/users
git commit -m "feat: filter users by classroom"
```

### Task 6: Turmas — rotas, listagem, criação, detalhe e arquivamento

**Files:**
- Create: `web/src/modules/classrooms/list-page.tsx`
- Create: `web/src/modules/classrooms/details-page.tsx`
- Create: `web/src/modules/classrooms/dialogs/classroom-form-dialog.tsx`
- Create: `web/src/modules/classrooms/dialogs/archive-classroom-dialog.tsx`
- Create: `web/src/modules/classrooms/classrooms-page.test.tsx`
- Create: `web/src/modules/classrooms/classroom-details-page.test.tsx`
- Modify: `web/src/router/routes.ts`
- Modify: `web/src/router/route-config.tsx`
- Modify: `web/src/router/route-config.test.tsx`
- Modify: `web/src/components/layout/auth-layout.tsx`
- Modify: `web/src/components/layout/auth-layout.test.tsx`
- Modify: `web/src/components/layout/app-sidebar.tsx`

**Interfaces:**
- Consumes `ClassroomSummary`/`ClassroomDetails` and classroom writer endpoints from Tasks 2 and 5.
- Produces routes `/classrooms` and `/classrooms/:classroomId`, allowed only to `admin|teacher|mentor`.

- [ ] **Step 1: Write failing route/page tests**

Test every staff role includes `/classrooms` in `pagesByRole`, student is redirected/denied, the list loads and links each room to its detail route, create button opens the form, and detail renders metrics plus archive action only for active rooms. Test archive mutation removes the room from the active list after successful response.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `cd web && pnpm test -- classrooms auth-layout route-config`

Expected: FAIL because the routes and modules do not exist.

- [ ] **Step 3: Implement the classroom UI**

Add routes/helpers and sidebar item. Build the list with semester/status filters, restrained metric cards/table, and top-right **Cadastrar turma** dialog requiring name and `YYYY.1`/`YYYY.2`. Build details with room metrics, activity delivery summary and an **Arquivar turma** confirmation that states historical bindings are retained. Use `writer` and SWR `mutate` to refresh list/detail without local API mocks.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `cd web && pnpm test -- classrooms auth-layout route-config`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/modules/classrooms web/src/router web/src/components/layout
git commit -m "feat: add classroom dashboards"
```

### Task 7: Seleção de turma no cadastro e publicação de atividade

**Files:**
- Modify: `web/src/modules/auth/register-page.tsx`
- Modify: `web/src/modules/auth/register-page.test.tsx`
- Modify: `web/src/modules/users/dialogs/user-form-dialog.tsx`
- Modify: `web/src/modules/users/dialogs/create-user-dialog.tsx`
- Modify: `web/src/modules/users/dialogs/edit-user-dialog.tsx`
- Modify: `web/src/modules/activities/activity-composer-page.tsx`
- Modify: `web/src/modules/activities/activity-composer-page.test.tsx`
- Modify: `web/src/modules/activities/dialogs/activity-form-dialog.tsx`

**Interfaces:**
- Consumes active classroom options and `ActivityFormRequest.classroomIds` from Task 5.
- Public registration sends one `classroomId`; activity creation sends a non-empty `classroomIds` list. Edit activity displays targets read-only and does not send audience updates.

- [ ] **Step 1: Write failing component tests**

Test registration replaces the text field with active option selection, blocks submit when no options exist, and sends the selected UUID. Test admin student form uses the same selection. Test both activity creation views require at least one selected class and post exactly those IDs; edit mode has no mutable class selector.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `cd web && pnpm test -- register-page user-form-dialog activity-composer-page activity-form-dialog`

Expected: FAIL because the old textual field and all-groups activity payload remain.

- [ ] **Step 3: Implement the selectors and validation**

Fetch `GET /classrooms/registration-options` in the public registration page and render a controlled shadcn select. Reuse active class options for admin student forms. Add `classroomIds: z.array(z.uuid()).min(1)` to activity create schema, use a checkbox/multi-select pattern already available in the project, and include IDs in both composer and dialog POST requests. Preserve all existing validation and attachment behavior.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `cd web && pnpm test -- register-page user-form-dialog activity-composer-page activity-form-dialog`

Expected: PASS.

- [ ] **Step 5: Run complete verification and commit**

Run: `cd api && pnpm test && pnpm typecheck && pnpm build && cd ../web && pnpm test && pnpm typecheck && pnpm build`

Expected: all suites, type checks and builds PASS. Record any pre-existing failure by exact test/command before handoff.

```bash
git add web/src/modules/auth web/src/modules/users web/src/modules/activities web/src/types
git commit -m "feat: select classrooms in registration and activities"
```
