# API Drizzle Migration Design

**Date:** 2026-08-24

## Goal

Replace Prisma with Drizzle across `api/`, rebuilding the database layer from the current API behavior instead of reusing generated Prisma artifacts.

## Scope

This migration covers:

- database schema definition
- Nest database provider/service
- database access inside `auth`, `users`, `posts`, `bucket`, and `mail`
- DTOs and guards that currently import Prisma model/enums
- test mocks tied to Prisma
- package scripts, Docker, and documentation

This migration does not add new API features or change the public HTTP contract on purpose.

## Current Domain Used By The API

The current API code requires these database entities:

- `users`
- `posts`
- `bucket_files`
- `sys_params`

The current API also relies on these enums:

- `user_role`
- `user_status`

## Drizzle Schema

The Drizzle schema will be reconstructed from the API usage with these tables:

### `users`

Required columns inferred from services and DTOs:

- `id`
- `name`
- `email`
- `password`
- `role`
- `status`
- `two_factor`
- `created_at`
- `updated_at`
- `deleted_at`

### `posts`

Required columns:

- `id`
- `title`
- `content`
- `user_id`
- `created_at`
- `updated_at`
- `deleted_at`

Relations:

- post belongs to user through `user_id`

### `bucket_files`

Required columns:

- `id`
- `key`
- `filename`
- `size`
- `url`
- `is_public`
- `created_at`
- `updated_at`
- `deleted_at`

### `sys_params`

Required columns:

- `id`
- `key`
- `value`
- `created_at`
- `updated_at`

## Nest Database Integration

Prisma currently exposes a service that is injected directly into other services. The Drizzle replacement will preserve that usage pattern.

`api/src/providers/database/drizzle.service.ts` will:

- create a `pg.Pool`
- create a Drizzle database instance
- expose typed table-oriented helpers such as `database.users`, `database.posts`, `database.bucketFiles`, and `database.sysParams`
- expose schema and transaction typing for internal use
- close the pool in `onModuleDestroy`

`api/src/providers/database/database.module.ts` will export `DrizzleService` globally, replacing `PrismaService`.

## Query Style

The new database layer should stay simple and readable.

- No repositories
- No generic query builders
- No factory abstractions
- Services query the database directly through `DrizzleService`

Expected style:

```ts
const users = await this.database.users
  .select(this.database.users.publicColumns)
  .where(...)
```

The service can expose small table helpers to hide repetitive `.from(table)` calls, but the SQL shape must remain obvious in each service.

## Types And Enums

Any imports from `generated/prisma` must be removed.

Enums such as `user_role` and `user_status` will be replaced with plain TypeScript unions/constants exported from the Drizzle database layer. DTOs, guards, and auth types will use those shared exports instead of generated Prisma enums.

DTO mapping should become explicit:

- DTOs accept app-level record types derived from Drizzle selections or explicit local interfaces
- DTOs must not depend on ORM-generated model classes

## Service Refactor Strategy

### `AuthService`

- replace `findUnique`, `findFirst`, and `update` operations with Drizzle queries
- preserve login, refresh, password recovery, password reset, and two-factor behavior

### `UsersService`

- rebuild list/filter/count/update/delete logic with Drizzle
- preserve `deleted_at: null` filtering
- preserve duplicate email checks

### `PostsService`

- rebuild CRUD and author join using Drizzle
- preserve soft delete and ownership rules

### `BucketService`

- replace `bucketFile` create/update/updateMany operations with Drizzle
- keep S3 behavior unchanged

### `MailService`

- replace `sys_params.findMany` with Drizzle query by parameter keys

## Tests

Tests that currently mock Prisma need to mock the new Drizzle service shape instead.

The migration will keep tests focused on behavior:

- auth token preparation and cookie behavior
- bucket upload behavior
- utility behavior unaffected by ORM

## Tooling And Runtime

The Prisma toolchain will be removed from `api/`:

- `@prisma/client`
- `@prisma/adapter-pg`
- `prisma`
- `prisma.config.ts`
- Prisma scripts in `package.json`
- Prisma-specific Docker steps

Drizzle tooling will replace it:

- `drizzle-orm`
- `drizzle-kit`
- `pg`

Expected additions:

- `api/drizzle.config.ts`
- `api/drizzle/schema.ts` or equivalent split files
- `api/drizzle/migrations/`

## Risks

- replacing generated Prisma enums with manual shared enums touches several files
- list/count queries must preserve current filtering and pagination behavior
- post listing requires a join that DTOs currently get from Prisma `include`
- test mocks will break if the Drizzle service surface is inconsistent

## Success Criteria

The migration is complete when:

- no source file imports Prisma or generated Prisma artifacts
- `DatabaseModule` exports `DrizzleService`
- the current API resources build against Drizzle
- scripts and docs describe Drizzle instead of Prisma
- the API typechecks and tests pass
