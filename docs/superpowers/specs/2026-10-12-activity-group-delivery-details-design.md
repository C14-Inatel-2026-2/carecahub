# Activity Group Delivery Details

## Goal

Move the detailed delivery status out of Kanban rows into a dedicated page for a selected group in an activity, where staff can review its viewing history, submission history, and latest-delivery evaluation.

## Scope and access

- The detail route is available only to administrators, teachers, and mentors because it originates from the activity pipeline.
- Teachers and mentors can evaluate a delivery; administrators can inspect all information but cannot evaluate.
- Students retain the existing activity page and their own submission history; they do not receive the staff delivery-detail route.

## API contract

Add `GET /activities/:id/group-delivery?groupId=<uuid>`.

- Authorize `admin`, `teacher`, and `mentor`.
- Return `notFound` when the activity or group does not exist and `forbidden` when the group is not in the activity audience.
- Return the complete group (`GetGroupDto`) and complete linked project (`GetProjectDto | null`), active viewers for that group, and all submissions for that activity/group, including links, files, author, version, late state, and score.
- Reuse the existing evaluation endpoint. It keeps the current rule that only teachers and mentors may grade the latest version from 0 to 100.

## Web flow

- Add `/activities/:activityId/groups/:groupId` and its route helper.
- Pipeline rows become links to the new route and retain only group/project identity and appearance. They no longer show viewer names or delivery metadata.
- The detail page loads the activity for context and the group-delivery endpoint for the selected group. It displays group/project information, named viewers, and `SubmissionHistory` with evaluation controls according to the current user role.
- The activity detail page keeps submission history only for students, so staff use the selected-group detail page for review and evaluation.

## Constraints

- Preserve the existing API response and authorization conventions (`ServiceOutput<T>`, activity controller roles, SWR `useGet`, `writer`).
- Use the existing `GroupService` aggregation and existing `SubmissionHistory` component rather than duplicating group/project or submission rendering.
- Keep source code identifiers in English and user-facing strings in Portuguese.
- Do not create commits.

## Verification

- API tests cover the group-audience authorization and filtered group-specific delivery payload.
- Web tests cover pipeline-row navigation and the group-delivery view’s role-dependent evaluation access.
- Run API and web test suites, API build, and web build.
