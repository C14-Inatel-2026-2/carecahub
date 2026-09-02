# User Role Authorization Design

## Goal

Add the `mentor` role and enforce role-scoped user management consistently in the database, API, and web application.

## Authorization matrix

| Requester role | Roles visible and manageable | Users navigation label |
| --- | --- | --- |
| `admin` | `admin`, `teacher`, `mentor`, `student` | Usuários |
| `teacher` | `mentor`, `student` | Alunos e monitores |
| `mentor` | `student` | Alunos |
| `student` | none | hidden |

Managing a role includes listing, reading, creating, updating, and soft deleting users with that role. An update may only assign a role the requester is allowed to manage. This prevents a teacher or mentor from promoting a user beyond their authority.

## Database

Add `mentor` to the PostgreSQL `user_role` enum through a generated Drizzle migration. Keep `student` as the database default role. No new tables or authorization data structures are required.

## API

### Authentication and route access

Remove `@Public()` from `POST /users`. All `/users` CRUD endpoints require an authenticated requester with role `admin`, `teacher`, or `mentor`. Students cannot call these endpoints.

### Request DTOs

Add `role` to `CreateUserDto` and `UpdateUserDto`, validated against `USER_ROLES` and documented in Swagger. Creation continues to require `name`, `registration`, `email`, and `password`; `githubName` and `classroom` remain optional.

### Service authorization

`UsersService` derives allowed target roles from the authenticated requester's role:

- admin: admin, teacher, mentor, student;
- teacher: mentor, student;
- mentor: student;
- student or missing requester: none.

The service applies this scope at every database operation:

- `findAll` adds a role filter to the query;
- `findOne` returns `forbidden` when the record exists but its role is outside the requester's scope;
- `register` validates the requested role before insertion;
- `update` validates both the existing target role and the requested resulting role;
- `remove` validates the existing target role before soft deletion.

Authorization is enforced in the service in addition to controller guards so callers cannot bypass target-role constraints. Existing uniqueness handling remains unchanged.

### Responses

Expose `registration`, `githubName`, and `classroom` in `GetUserDto` so the frontend can display and edit the complete current user structure. Continue returning camelCase API properties.

## Web application

Add `mentor` to `UserRole` and role labels. Permit the users route for admin, teacher, and mentor; keep it unavailable to students.

The sidebar and page title depend on the logged-in role:

- admin: Usuários;
- teacher: Alunos e monitores;
- mentor: Alunos.

The API remains the source of truth for list filtering. The frontend does not request or locally retain users outside the requester's scope.

The create and edit forms include a role selector constrained by requester role:

- admin: admin, teacher, mentor, student;
- teacher: mentor, student;
- mentor: student fixed and hidden.

The forms send the selected role in create and update payloads. Registration, GitHub username, and classroom are populated from API responses during editing. Existing validation for registration, optional text fields, email, and strong passwords remains.

## Error handling

Requests targeting a role outside the requester's scope return the existing `forbidden` service error. Missing records continue to return `notFound`. Duplicate email, registration, or GitHub username continues to return `alreadyExists`.

## Testing

API tests cover the authorization matrix at observable service boundaries:

- each requester receives only allowed roles from list operations;
- allowed and forbidden create roles;
- allowed and forbidden read, update, and delete targets;
- update cannot promote a target beyond requester authority;
- unauthenticated and student requests are rejected by route guards.

Frontend schema tests cover all role values and role-aware create payloads. Type checking verifies that navigation, authenticated-user state, forms, and API payloads use the same four-role union.

Migration verification runs the complete migration chain in PostgreSQL and confirms the `mentor` enum value exists. Final verification runs focused tests, full test suites, builds, and lint checks for changed files.
