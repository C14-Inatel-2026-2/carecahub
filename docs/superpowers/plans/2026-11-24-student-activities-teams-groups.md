# Student Activities Teams Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group a student's activity list into pending, overdue/unsubmitted, and submitted sections, ordered and labelled by deadline date.

**Architecture:** `GET /activities` enriches only student responses with the requesting group's submission summary. The web type models that optional summary; pure page helpers derive sections and date groups, while `ActivitiesPage` renders the Teams-inspired sequence using the existing cards.

**Tech Stack:** NestJS, Drizzle ORM, React 19, TypeScript, SWR, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-student-activities-teams-groups-design.md`

## Global Constraints

- Applies only to students; staff list responses and UI remain unchanged.
- Keep a single activities-list request; do not request submissions once per activity.
- Preserve activity visibility, deadlines and submission authorization.
- Use the existing `ActivityCard` and project Tailwind/shadcn primitives.

## Review Focus

- Student with no group receives an empty list and no submission-summary query.
- A submission before or after the deadline is always `Entregues`.
- An activity due exactly now is not overdue until the clock passes its deadline.
- Same-calendar-day activities retain ascending deadline-time order.
- Staff responses omit the optional submission summary and keep their current activity list.

---

### Task 1: Student submission summary in the activities API

**Files:**
- Modify: `api/src/resources/activities/dto/get-activity.dto.ts`
- Modify: `api/src/resources/activities/activity.service.ts:151-176`
- Modify: `api/src/resources/activities/activity.service.test.ts`

**Interfaces:**
- Produces: `GetActivityDto.submission?: { id: string; submittedAt: Date; isLate: boolean }` for student list responses only.
- Consumes: `groupId` already resolved by `ActivityService.findAll` and `activitySubmissions`.

- [ ] Write a failing student-list service test with two activities and one submission. Assert the matching item contains the three-field summary, the unmatched item has `submission: null`, and the existing staff fixture does not gain that property.
- [ ] Run `cd api && pnpm test src/resources/activities/activity.service.test.ts`; expect failure because the list DTO has no submission summary.
- [ ] Extend `GetActivityDto` and `ActivityService.findAll`: query submissions once for visible activity IDs and the student's group ID, then merge results by activity ID. Leave non-student calls on the current detail DTO mapping.
- [ ] Re-run the focused API test; expect pass.
- [ ] Commit: `git add api/src/resources/activities/dto/get-activity.dto.ts api/src/resources/activities/activity.service.ts api/src/resources/activities/activity.service.test.ts && git commit -m "feat(api): include student submission status in activities"`.

### Task 2: Frontend types and deterministic grouping

**Files:**
- Modify: `web/src/types/activity.ts`
- Create: `web/src/modules/activities/activity-list-groups.ts`
- Create: `web/src/modules/activities/activity-list-groups.test.ts`

**Interfaces:**
- Consumes: `Activity.submission?: { id: string; submittedAt: string; isLate: boolean } | null`.
- Produces: `getStudentActivitySections(activities: Activity[], now: Date)`, returning `todo`, `overdue`, and `submitted` date-labelled groups in increasing `dueAt` order.

- [ ] Write failing helper tests for submitted late work, a past-due activity without submission, future work, equal-date deadline-time ordering, `pt-BR` date labels, and absent summaries treated as pending only by the student helper.
- [ ] Run `cd web && pnpm test src/modules/activities/activity-list-groups.test.ts`; expect failure because the helper does not exist.
- [ ] Add the optional frontend type and implement the helper: sort a copied list by deadline, classify using the spec rules, and group by the local calendar date of `dueAt`.
- [ ] Re-run the helper test; expect pass.
- [ ] Commit: `git add web/src/types/activity.ts web/src/modules/activities/activity-list-groups.ts web/src/modules/activities/activity-list-groups.test.ts && git commit -m "feat(web): group student activities by delivery status"`.

### Task 3: Teams-inspired student activity rendering

**Files:**
- Modify: `web/src/modules/activities/activities-page.tsx`
- Create: `web/src/modules/activities/activities-page.test.tsx`

**Interfaces:**
- Consumes: `getStudentActivitySections` from Task 2 and optional `Activity.submission` data from Task 1.
- Produces: student-only headings `A fazer`, `Atrasadas/Não entregues`, and `Entregues`, with due-date labels and existing `ActivityCard` items.

- [ ] Write a failing render test: mock a student and activities in all statuses, assert non-empty headings, deadline-date labels, and titles. Add a staff case asserting the current ungrouped list remains.
- [ ] Run `cd web && pnpm test src/modules/activities/activities-page.test.tsx`; expect failure because the page renders one list.
- [ ] Render only non-empty sections and their date groups for students; preserve management controls, loading and empty states, and staff rendering.
- [ ] Run the page and grouping tests; expect pass.
- [ ] Commit: `git add web/src/modules/activities/activities-page.tsx web/src/modules/activities/activities-page.test.tsx && git commit -m "feat(web): show student activities in delivery sections"`.

### Task 4: Cross-layer verification

**Files:**
- Verify: `api/src/resources/activities/activity.service.test.ts`
- Verify: `web/src/modules/activities/activity-list-groups.test.ts`
- Verify: `web/src/modules/activities/activities-page.test.tsx`

- [ ] Run focused API and web tests: `cd api && pnpm test src/resources/activities/activity.service.test.ts && cd ../web && pnpm test src/modules/activities/activity-list-groups.test.ts src/modules/activities/activities-page.test.tsx`.
- [ ] Run `cd api && pnpm test && pnpm build && cd ../web && pnpm test && pnpm typecheck`; report any pre-existing failure by file and assertion.
