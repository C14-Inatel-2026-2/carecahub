# Activity Group Delivery Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff open a group-specific activity-delivery page from the pipeline to review views and submissions and evaluate the latest delivery.

**Architecture:** A dedicated activity endpoint returns the selected audience group, its complete project, named viewers, and only that group’s submissions. A nested frontend route consumes the endpoint; pipeline rows link to it and the existing submission-history component renders and evaluates the filtered submissions.

**Tech Stack:** NestJS, Drizzle, React, React Router, SWR, Vitest, TypeScript, shadcn/Tailwind.

**Spec:** `docs/superpowers/specs/2026-10-12-activity-group-delivery-details-design.md`

## Global Constraints

- Use `ServiceOutput<T>`, activity controller role decorators, SWR `useGet`, and `writer`.
- Return complete `GetGroupDto` and `GetProjectDto | null` without a frontend follow-up request.
- Teachers and mentors can evaluate; administrators are read-only.
- Keep source identifiers in English and UI copy in Portuguese.
- Do not create commits.

## Review Focus

- A group outside an activity audience must receive `forbidden`; cover this in the activity-service test.
- A group with no submissions must render the empty delivery history; cover this in the delivery-page test.
- An administrator must not receive an evaluation input/button; cover this in the delivery-page test.
- A non-latest submission must remain ungradable through the existing evaluation endpoint; retain the evaluation-service test.
- An empty pipeline column must render its empty state and never create an invalid link; cover this in the activity-detail test.

---

### Task 1: Group-specific delivery API

**Files:**
- Modify: `api/src/resources/activities/activity.interface.ts`
- Modify: `api/src/resources/activities/activity.service.ts`
- Modify: `api/src/resources/activities/activity.controller.ts`
- Modify: `api/src/resources/activities/activity.service.test.ts`

**Interfaces:**
- Produces `getGroupDelivery(activityId: string, groupId: string, requester: UserMetadata): Promise<GetGroupDeliveryOutput>`.
- Produces `GET /activities/:id/group-delivery?groupId=<uuid>` for `admin`, `teacher`, and `mentor`.
- Produces `GetGroupDeliveryOutput` containing `group: GetGroupDto`, `project: GetProjectDto | null`, `viewers: Array<{ id: string; name: string }>`, and `submissions: ListSubmissionOutput['data']`.

- [ ] **Step 1: Write failing API tests**

Add tests proving an authorized teacher receives only the selected audience group’s views and submissions, and a non-audience group is rejected with `forbidden`.

- [ ] **Step 2: Run the activity-service tests to verify failure**

Run: `pnpm test src/resources/activities/activity.service.test.ts` from `api`.

Expected: FAIL because `getGroupDelivery` does not exist.

- [ ] **Step 3: Implement `getGroupDelivery` and controller route**

Use `isAudienceMember`, `GroupService.findOne`, a filtered submissions helper, and the activity views table. Preserve the existing submission file/link detail shape and return the group’s linked project separately.

- [ ] **Step 4: Run API tests to verify success**

Run: `pnpm test src/resources/activities/activity.service.test.ts` from `api`.

Expected: PASS.

### Task 2: Typed route and API hook contract

**Files:**
- Modify: `web/src/types/activity.ts`
- Modify: `web/src/api/use-list.tsx`
- Modify: `web/src/router/routes.ts`
- Modify: `web/src/router/route-config.tsx`
- Test: `web/src/router/route-config.test.tsx`

**Interfaces:**
- Consumes `GetGroupDeliveryOutput` from Task 1.
- Produces `ActivityGroupDelivery` and `activityGroupDeliveryRoute(activityId, groupId)`.
- Produces the route `/activities/:activityId/groups/:groupId`.

- [ ] **Step 1: Write failing route/configuration test**

Assert the nested activity route resolves the group-delivery path and its route helper encodes both UUID values.

- [ ] **Step 2: Run the route test to verify failure**

Run: `pnpm test src/router/route-config.test.tsx` from `web`.

Expected: FAIL because the route and helper do not exist.

- [ ] **Step 3: Implement types, response-map entry, helper, and nested route**

Keep the endpoint key compatible with `useGet` by using `'/activities/:id/group-delivery'` and passing `groupId` as its query.

- [ ] **Step 4: Run route and type verification**

Run: `pnpm test src/router/route-config.test.tsx && pnpm typecheck` from `web`.

Expected: PASS.

### Task 3: Delivery detail page and pipeline navigation

**Files:**
- Create: `web/src/modules/activities/activity-group-delivery-page.tsx`
- Modify: `web/src/modules/activities/components/group-pipeline-row.tsx`
- Modify: `web/src/modules/activities/activity-details-page.tsx`
- Modify: `web/src/modules/activities/components/submission-history.tsx`
- Test: `web/src/modules/activities/components/group-pipeline-row.test.tsx`
- Test: `web/src/modules/activities/activity-group-delivery-page.test.tsx`

**Interfaces:**
- Consumes `ActivityGroupDelivery`, `activityGroupDeliveryRoute`, and the route from Task 2.
- Produces a staff-only presentation of selected group/project, named activity viewers, and filtered `SubmissionHistory`.

- [ ] **Step 1: Write failing web tests**

Assert a pipeline row links to the selected activity/group route, and assert the new page displays group/project, viewers, submissions, and hides evaluation controls for an administrator.

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `pnpm test src/modules/activities/components/group-pipeline-row.test.tsx src/modules/activities/activity-group-delivery-page.test.tsx` from `web`.

Expected: FAIL because the row is not linked and the page does not exist.

- [ ] **Step 3: Implement the detail page and compact pipeline rows**

Make the row link to the selected detail route and remove viewer/submission metadata from it. The page fetches activity context and group delivery data, displays the group/project visual identity and viewer names, and passes `canEvaluate` only for teacher/mentor users. Keep student submission history on the activity page; omit staff-wide history there.

- [ ] **Step 4: Run focused web tests and build**

Run: `pnpm test src/modules/activities/components/group-pipeline-row.test.tsx src/modules/activities/activity-group-delivery-page.test.tsx && pnpm build` from `web`.

Expected: PASS.

### Task 4: Full verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run all API tests and build**

Run: `pnpm test && pnpm build` from `api`.

Expected: PASS.

- [ ] **Step 2: Run all web tests and build**

Run: `pnpm test && pnpm build` from `web`.

Expected: PASS.
