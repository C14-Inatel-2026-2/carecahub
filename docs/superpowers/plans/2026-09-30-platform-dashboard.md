# Platform Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a role-restricted home dashboard with platform totals, 30-day GitHub activity, classroom aggregation, and a historical project ranking.

**Architecture:** A dashboard-specific GitHub query supplies default-branch history and recent commit identities. A new Nest dashboard resource combines those live results with Drizzle aggregates, while the React home renders typed cards, charts, and ranking states.

**Tech Stack:** PostgreSQL, Drizzle ORM, NestJS, Axios, Vitest, React 19, SWR, Recharts, shadcn/Tailwind.

**Spec:** `docs/superpowers/specs/2026-09-30-platform-dashboard-design.md`

## Global Constraints

- Only `admin`, `teacher`, and `mentor` may access `GET /dashboard`; students keep the welcome-only home.
- Use the latest 30 calendar days in `America/Sao_Paulo`, including zero-commit days.
- Match commit authors to classrooms by case-insensitive GitHub login; use `Não identificada` when unmatched.
- Rank the top five projects by total historical commits on active repositories.
- Process no more than five repositories concurrently and tolerate isolated GitHub failures.
- Add no database table, cache, queue, scheduler, dependency, frontend API mock, or commit.

## Review Focus

- Empty repositories must yield zeroed charts and an empty ranking without failing.
- GitHub pagination must not omit activity beyond 100 commits.
- Mixed-case logins and missing authors must map deterministically without double counting.
- A single unavailable repository must preserve all other metrics and mark data partial.
- Students must neither request nor access the staff dashboard endpoint.

---

### Task 1: Dashboard-specific GitHub statistics

**Files:**
- Modify: `api/src/providers/github/github.types.ts`
- Modify: `api/src/providers/github/github.interface.ts`
- Modify: `api/src/providers/github/github.service.ts`
- Modify: `api/src/providers/github/github.service.test.ts`

**Interfaces:**
- Produces: `getRepositoryDashboardStatsFromUrl(url, since, until): Promise<EitherResponse<RepositoryDashboardStats>>` with `historicalCommitCount` and recent `{ sha, authoredAt, authorLogin }[]`.

- [x] Write failing tests for historical count, 100-item pagination, nullable author, and encoded date bounds.
- [x] Run `cd api && pnpm test src/providers/github/github.service.test.ts` and verify RED.
- [x] Implement the minimal dashboard query using the repository default branch and paginated commit requests.
- [x] Rerun the focused test and verify GREEN.

### Task 2: Dashboard API aggregation and authorization

**Files:**
- Create: `api/src/resources/dashboard/dto/get-dashboard.dto.ts`
- Create: `api/src/resources/dashboard/dashboard.interface.ts`
- Create: `api/src/resources/dashboard/dashboard.service.ts`
- Create: `api/src/resources/dashboard/dashboard.service.test.ts`
- Create: `api/src/resources/dashboard/dashboard.controller.ts`
- Create: `api/src/resources/dashboard/dashboard.module.ts`
- Create: `api/src/resources/dashboard/dashboard.module.test.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Consumes: Task 1 repository dashboard statistics.
- Produces: `GET /dashboard` and `DashboardService.getDashboard(): Promise<GetDashboardOutput>`.

- [x] Write failing service tests for database totals, 30 zero-filled São Paulo days, classroom mapping, unknown authors, top-five ranking, five-wide concurrency, empty data, and partial failures.
- [x] Write a failing module/controller test for registration and the three permitted roles.
- [x] Run `cd api && pnpm test src/resources/dashboard` and verify RED.
- [x] Implement DTO, direct aggregation service, controller, module, and app registration.
- [x] Rerun dashboard, GitHub, and related project tests and verify GREEN.

### Task 3: Typed staff home dashboard

**Files:**
- Create: `web/src/types/dashboard.ts`
- Create: `web/src/modules/home/components/dashboard-metric-card.tsx`
- Create: `web/src/modules/home/components/commit-charts.tsx`
- Create: `web/src/modules/home/components/project-commit-ranking.tsx`
- Create: `web/src/modules/home/platform-dashboard.tsx`
- Create: `web/src/modules/home/platform-dashboard.test.tsx`
- Modify: `web/src/api/use-list.tsx`
- Modify: `web/src/modules/home/home-page.tsx`

**Interfaces:**
- Consumes: `GET /dashboard` from Task 2.
- Produces: staff-only dashboard cards, charts, ranking, loading/error/partial states.

- [x] Write failing presentation/type tests for all four cards, both chart datasets, top-five ranking, partial warning, and student exclusion.
- [x] Run `cd web && pnpm test src/modules/home/platform-dashboard.test.tsx` and verify RED.
- [x] Implement types, typed read, role branch, and focused dashboard components using existing Card/Chart primitives.
- [x] Rerun focused tests and `pnpm typecheck`, then verify GREEN.
- [x] Run full API/web tests, builds, scoped Biome, and `git diff --check`.
