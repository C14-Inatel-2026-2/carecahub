# API Drizzle Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Prisma with Drizzle in `api/` while preserving the current HTTP behavior.

**Architecture:** Rebuild the database schema from the API's current domain usage, add a Nest `DrizzleService` that exposes table-specific query helpers, and refactor each dependent service to query Drizzle directly without repositories.

**Tech Stack:** NestJS, TypeScript, Drizzle ORM, drizzle-kit, pg, node:test

**Spec:** `docs/superpowers/specs/2026-08-24-api-drizzle-migration-design.md`

## Global Constraints

- Keep the implementation simple and readable.
- Do not add repositories, factories, or speculative abstractions.
- Preserve the existing HTTP contract and business behavior unless a Prisma-specific artifact forces an explicit local type replacement.
- Remove Prisma imports and tooling from `api/`.

---

### Task 1: Add Drizzle Infrastructure

**Files:**
- Create: `api/drizzle/enums.ts`
- Create: `api/drizzle/schema.ts`
- Create: `api/drizzle/index.ts`
- Create: `api/drizzle.config.ts`
- Modify: `api/src/providers/database/database.module.ts`
- Modify: `api/src/providers/database/prisma.service.ts` or replace with `api/src/providers/database/drizzle.service.ts`

**Interfaces:**
- Consumes: `process.env.DATABASE_URL`
- Produces: `DrizzleService`, schema exports, enum exports, table helpers for `users`, `posts`, `bucketFiles`, and `sysParams`

- [ ] Write or update a failing test that imports the new database service entrypoint
- [ ] Run the focused test or typecheck to confirm the Drizzle files do not exist yet
- [ ] Create the Drizzle schema, enum exports, index exports, and Nest `DrizzleService`
- [ ] Replace `DatabaseModule` exports to provide `DrizzleService`
- [ ] Run API typecheck and fix infrastructure-level typing issues

### Task 2: Replace Shared Prisma Types

**Files:**
- Modify: `api/src/utils/dtos/query.dto.ts`
- Modify: `api/src/infra/roles.guard.ts`
- Modify: `api/src/resources/auth/dtos/login.dto.ts`
- Modify: `api/src/resources/users/dto/get-user.dto.ts`
- Modify: `api/src/resources/posts/dto/get-post.dto.ts`

**Interfaces:**
- Consumes: shared enum exports and table row/selection types from Drizzle layer
- Produces: DTOs and guards that no longer import generated Prisma types

- [ ] Add or update a failing test or typecheck expectation that still references Prisma types
- [ ] Run typecheck to confirm the Prisma-generated imports are now the failure point
- [ ] Replace Prisma enum/model imports with local Drizzle-backed app types
- [ ] Run typecheck again to confirm DTO/guard typing is restored

### Task 3: Refactor Database-Dependent Services

**Files:**
- Modify: `api/src/resources/auth/auth.service.ts`
- Modify: `api/src/resources/users/user.service.ts`
- Modify: `api/src/resources/posts/post.service.ts`
- Modify: `api/src/providers/bucket/bucket.service.ts`
- Modify: `api/src/providers/mail/mail.service.ts`

**Interfaces:**
- Consumes: `DrizzleService`
- Produces: service methods that preserve current behavior without Prisma query APIs

- [ ] Start with one service at a time, beginning with the smallest query surface
- [ ] For each service, write or update the relevant failing test before refactoring behavior
- [ ] Replace Prisma operations with Drizzle queries, preserving soft-delete and pagination behavior
- [ ] Refactor post author loading with an explicit join
- [ ] Run focused tests after each service migration
- [ ] Run API typecheck after all service migrations

### Task 4: Replace Test Mocks

**Files:**
- Modify: `api/src/utils/mocks/services.mock.ts`
- Modify: `api/src/resources/auth/auth.service.test.ts`
- Modify: `api/src/providers/bucket/bucket.service.test.ts`

**Interfaces:**
- Consumes: `DrizzleService`
- Produces: reusable test doubles aligned with the new database API

- [ ] Update the shared service mock file to stop depending on `Prisma.ModelName`
- [ ] Replace Prisma-specific test casts with Drizzle service mocks
- [ ] Run the affected tests and fix any remaining mismatch between service code and mock shape

### Task 5: Remove Prisma Tooling And Update Docs

**Files:**
- Modify: `api/package.json`
- Modify: `api/Dockerfile`
- Modify: `api/README.md`
- Modify: `api/AGENTS.md`
- Delete: `api/prisma.config.ts`
- Delete: Prisma-generated or Prisma-only files/directories if present

**Interfaces:**
- Consumes: Drizzle scripts and config
- Produces: build/runtime/docs that describe Drizzle instead of Prisma

- [ ] Replace Prisma scripts with Drizzle generate/migrate scripts
- [ ] Remove Prisma dependencies and add Drizzle dependencies
- [ ] Update Docker build steps to use Drizzle workflow
- [ ] Update README and AGENTS wording from Prisma to Drizzle
- [ ] Remove leftover Prisma-only files from `api/`

### Task 6: Verify Migration End-To-End

**Files:**
- Verify only

**Interfaces:**
- Consumes: completed migration
- Produces: evidence that the API is consistent after the ORM swap

- [ ] Run the focused tests touched by the migration
- [ ] Run the full API test command
- [ ] Run API typecheck
- [ ] Search the `api/` directory for remaining `Prisma` or `prisma` references and remove intentional leftovers only if still active
