# User Role Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the mentor role and enforce role-scoped user CRUD consistently in PostgreSQL, NestJS, and React.

**Architecture:** Keep the existing `/users` resource and derive allowed target roles from authenticated requester metadata inside `UsersService`. The web app renders labels and role choices from the logged-in role, while the API remains the authorization source of truth.

**Tech Stack:** PostgreSQL, Drizzle ORM/Kit, NestJS, class-validator, React, React Hook Form, Zod, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-02-user-role-authorization-design.md`

## Global Constraints

- Roles are `admin`, `teacher`, `mentor`, and `student`.
- Admin manages all roles; teacher manages mentor/student; mentor manages student; student manages none.
- `POST /users` is authenticated; frontend restrictions never replace API authorization.
- Existing uniqueness handling and soft deletion remain unchanged.
- Keep the direct resource/service structure; add no generic policy layer.

---

### Task 1: Database role enum and migration

**Files:**
- Modify: `api/src/drizzle/schema/enums/userEnums.ts`
- Modify: `api/src/drizzle/seed.ts`
- Create: `api/src/drizzle/migrations/0004_add_mentor_role.sql`
- Create: `api/src/drizzle/migrations/meta/0004_snapshot.json`
- Modify: `api/src/drizzle/migrations/meta/_journal.json`

**Interfaces:**
- Produces: `UserRole = 'admin' | 'teacher' | 'mentor' | 'student'` and PostgreSQL enum value `mentor`.

- [ ] **Step 1: Add a failing enum assertion**

Add to the existing user enum test or create `api/src/drizzle/schema/enums/userEnums.test.ts`:

```ts
assert.deepEqual(USER_ROLES, ['admin', 'teacher', 'mentor', 'student'])
assert.equal(USER_ROLE.mentor, 'mentor')
```

- [ ] **Step 2: Run the enum test and verify it fails**

Run: `pnpm exec tsx --test src/drizzle/schema/enums/userEnums.test.ts`
Expected: FAIL because `mentor` is absent.

- [ ] **Step 3: Add mentor to the schema constants**

```ts
export const USER_ROLES = ['admin', 'teacher', 'mentor', 'student'] as const
export const USER_ROLE = { admin: 'admin', teacher: 'teacher', mentor: 'mentor', student: 'student' } as const
```

- [ ] **Step 4: Generate and inspect the migration**

Run: `pnpm db:g`
Expected SQL includes `ALTER TYPE "public"."user_role" ADD VALUE 'mentor'`.
Rename the generated SQL file to `0004_add_mentor_role.sql` and update its journal tag to match.

- [ ] **Step 5: Update any seed role fixtures and verify migration transactionally**

Keep existing admin/student seed users valid. Execute the full SQL chain inside `BEGIN`/`ROLLBACK`, then run `pnpm db:m` and verify `mentor` exists in `pg_enum`.

### Task 2: API authorization and complete user DTO

**Files:**
- Modify: `api/src/resources/users/dto/upsert-user.dto.ts`
- Modify: `api/src/resources/users/dto/get-user.dto.ts`
- Modify: `api/src/resources/users/user.interface.ts`
- Modify: `api/src/resources/users/user.controller.ts`
- Modify: `api/src/resources/users/user.service.ts`
- Modify: `api/src/resources/users/user.service.test.ts`
- Modify: relevant controller/guard tests

**Interfaces:**
- Consumes: four-value `UserRole`.
- Produces: `CreateUserDto.role: UserRole`, optional `UpdateUserDto.role`, requester-scoped CRUD, and complete user response fields.

- [ ] **Step 1: Write failing service authorization tests**

Cover these literal matrices:

```ts
const allowed = {
  admin: ['admin', 'teacher', 'mentor', 'student'],
  teacher: ['mentor', 'student'],
  mentor: ['student'],
  student: [],
} as const
```

Assert list filtering, allowed/forbidden create, existing-target checks for read/update/delete, and forbidden promotion during update.

- [ ] **Step 2: Run focused API tests and verify authorization failures**

Run: `pnpm exec tsx --test src/resources/users/user.service.test.ts`
Expected: FAIL because requester role is currently ignored and creation is hardcoded to student.

- [ ] **Step 3: Add role validation and complete response fields**

Use `@IsIn(USER_ROLES)` and `@ApiProperty({ enum: USER_ROLES })`. Add `registration`, `githubName`, and `classroom` to `publicColumns`, `GetUserDtoRecord`, `GetUserDto`, and `toDto`.

- [ ] **Step 4: Implement direct role scoping in UsersService**

Add one direct helper:

```ts
private allowedTargetRoles(role: UserRole): UserRole[] {
  if (role === 'admin') return [...USER_ROLES]
  if (role === 'teacher') return ['mentor', 'student']
  if (role === 'mentor') return ['student']
  return []
}
```

Use `inArray(users.role, allowedRoles)` in list/read/update/delete queries and validate requested roles before writes. Return `ErrKeys.forbidden` for out-of-scope targets.

- [ ] **Step 5: Protect controller endpoints**

Remove `@Public()` and login-cookie behavior from `POST /users`. Apply `@Roles(['admin', 'teacher', 'mentor'])` to all CRUD endpoints and pass requester metadata into `register`.

- [ ] **Step 6: Run focused tests until green**

Run the user service and controller/guard tests. Expected: all new matrix tests pass.

### Task 3: Role-aware users frontend

**Files:**
- Modify: `web/src/types/user.ts`
- Modify: `web/tests/user.test.ts`
- Modify: `web/src/components/layout/auth-layout.tsx`
- Modify: `web/src/components/layout/app-sidebar.tsx`
- Modify: `web/src/modules/users/list-page.tsx`
- Modify: `web/src/modules/users/dialogs/user-form-dialog.tsx`
- Modify: `web/src/modules/users/dialogs/create-user-dialog.tsx`
- Modify: `web/src/modules/users/dialogs/edit-user-dialog.tsx`

**Interfaces:**
- Consumes: authenticated `UserRole` and complete user API response.
- Produces: role-aware route access, labels, role choices, and create/update payloads.

- [ ] **Step 1: Extend failing frontend schema tests**

Assert that `mentor` parses and that allowed role choices are:

```ts
admin -> ['admin', 'teacher', 'mentor', 'student']
teacher -> ['mentor', 'student']
mentor -> ['student']
student -> []
```

- [ ] **Step 2: Run `pnpm test` and verify failure**

Expected: FAIL because mentor and role-aware helpers are absent.

- [ ] **Step 3: Update frontend types and validation**

Add `mentor`, `role`, `registration`, `githubName`, and `classroom` to the appropriate schemas/types. Export a direct `manageableRolesByRole` constant for navigation and forms.

- [ ] **Step 4: Update navigation and list access**

Allow `/users` for admin/teacher/mentor. Render `Usuários`, `Alunos e monitores`, or `Alunos` based on role. Enable `useList` for those three roles and rely on server filtering.

- [ ] **Step 5: Update create and edit dialogs**

Pass requester role into dialogs. Render a role select for admin/teacher using only allowed values; keep student fixed and hidden for mentor. Include role and complete editable fields in payloads.

- [ ] **Step 6: Run frontend tests and focused type checking**

Run: `pnpm test`, `pnpm exec tsc -p tsconfig.app.json --noEmit`, and focused Biome checks. Expected: no errors caused by user-role files; separately report unrelated unfinished modules.

### Task 4: End-to-end verification

**Files:**
- Verify all changed files from Tasks 1–3.

**Interfaces:**
- Consumes: completed database, API, and frontend work.
- Produces: verified role-scoped user management.

- [ ] **Step 1: Run API tests and build**

Run: `pnpm test` and `pnpm build` in `api`.

- [ ] **Step 2: Run frontend tests and build**

Run: `pnpm test` and `pnpm build` in `web`. If unrelated existing `posts` errors remain, record them with exact file names.

- [ ] **Step 3: Verify migrations and formatting**

Confirm the migration ledger and `mentor` enum value through read-only SQL. Run focused Biome and `git diff --check`.

- [ ] **Step 4: Review authorization requirements**

Confirm every requester/target pair matches the approved matrix and no public registration path remains.
