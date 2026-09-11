# User GitHub Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich `GET /users` and `GET /users/:id` with selected public GitHub profile fields while preserving successful user responses when GitHub is unavailable.

**Architecture:** Add one mapping method to the existing `GitHubService`, inject that provider into `UsersService`, and enrich only read DTOs. Keep mutation outputs unchanged and return `gitHubDetails: null` for ineligible users or external failures.

**Tech Stack:** NestJS 11, TypeScript, Axios, Drizzle ORM, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-user-github-details-design.md`

## Global Constraints

- Enrich `student`, `mentor`, and `teacher`; do not call GitHub for `admin`.
- Always include `gitHubDetails` in read results, using `null` for missing usernames and all GitHub failures.
- Expose only `login`, `avatarUrl`, `profileUrl`, and `bio`.
- Keep `register` and `update` response contracts unchanged.
- Do not add caching, retries, persistence, dependencies, or frontend changes.

---

### Task 1: Fetch and map GitHub user details

**Files:**
- Modify: `api/src/providers/github/github.types.ts`
- Modify: `api/src/providers/github/github.service.ts`
- Modify: `api/src/providers/github/github.service.test.ts`

**Interfaces:**
- Produces: `GitHubUserDetails = { login: string; avatarUrl: string; profileUrl: string; bio: string | null }`.
- Produces: `GitHubService.getUserDetails(username: string): Promise<GitHubUserDetails | null>`.

- [ ] **Step 1: Write failing provider tests**

Add tests to `github.service.test.ts` using its existing fake Axios setup:

```ts
describe('GitHubService.getUserDetails', () => {
  it('maps selected public fields and encodes the username', async () => {
    const { service, requestedPaths } = createService({
      '/users/ada%2Flovelace': {
        data: {
          login: 'ada',
          avatar_url: 'https://avatars.githubusercontent.com/u/1',
          html_url: 'https://github.com/ada',
          bio: 'Programmer',
        },
      },
    })

    assert.deepEqual(await service.getUserDetails('ada/lovelace'), {
      login: 'ada',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1',
      profileUrl: 'https://github.com/ada',
      bio: 'Programmer',
    })
    assert.deepEqual(requestedPaths, ['/users/ada%2Flovelace'])
  })

  it('returns null when GitHub fails', async () => {
    const service = new GitHubService({ info() {}, error() {} } as never)
    Object.assign(service, { axios: { get: async () => Promise.reject(new Error('offline')) } })

    assert.equal(await service.getUserDetails('ada'), null)
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd api && pnpm vitest run src/providers/github/github.service.test.ts`

Expected: FAIL because `getUserDetails` does not exist.

- [ ] **Step 3: Add the type and minimal implementation**

Add to `github.types.ts`:

```ts
export type GitHubUserDetails = {
  login: string
  avatarUrl: string
  profileUrl: string
  bio: string | null
}
```

Add a private raw response type and this public method to `GitHubService`:

```ts
type GitHubUserResponse = {
  login: string
  avatar_url: string
  html_url: string
  bio: string | null
}

async getUserDetails(username: string): Promise<GitHubUserDetails | null> {
  try {
    this.logger.info(`GET GitHub user details: ${username}`)
    const response = await this.axios.get<GitHubUserResponse>(
      `/users/${encodeURIComponent(username)}`,
    )
    return {
      login: response.data.login,
      avatarUrl: response.data.avatar_url,
      profileUrl: response.data.html_url,
      bio: response.data.bio,
    }
  } catch (error) {
    this.logger.error(
      `Failed to get GitHub user details: ${error instanceof Error ? error.message : String(error)}`,
    )
    return null
  }
}
```

- [ ] **Step 4: Run provider tests and verify GREEN**

Run: `cd api && pnpm vitest run src/providers/github/github.service.test.ts`

Expected: all GitHub provider tests PASS.

- [ ] **Step 5: Commit provider behavior**

```bash
git add api/src/providers/github/github.types.ts api/src/providers/github/github.service.ts api/src/providers/github/github.service.test.ts
git commit -m "feat: fetch GitHub user details"
```

---

### Task 2: Enrich user read outputs

**Files:**
- Modify: `api/src/resources/users/user.interface.ts`
- Modify: `api/src/resources/users/user.service.ts`
- Modify: `api/src/resources/users/user.service.test.ts`

**Interfaces:**
- Consumes: `GitHubService.getUserDetails(username)` from Task 1.
- Produces: `GetUserWithGitHubDetails = GetUserDto & { gitHubDetails: GitHubUserDetails | null }`.
- Changes: `GetUserOutput` and `ListUserOutput` use the enriched type; `UpsertUserOutput` remains `ServiceOutput<GetUserDto>`.

- [ ] **Step 1: Extend the service test factory with a GitHub fake**

Change `createService` to accept an optional function and pass a third constructor dependency:

```ts
function createService(
  results: unknown[],
  getUserDetails = async () => null as GitHubUserDetails | null,
) {
  const next = () => new QueryResult(results.shift())
  return new UsersService(
    { db: { select: next, insert: next, update: next } } as never,
    { create: () => ({ log() {}, info() {}, error() {} }) } as never,
    { getUserDetails } as never,
  )
}
```

- [ ] **Step 2: Write failing detail enrichment tests**

Update the existing `maps a selected user` expectation to include `gitHubDetails`, supplying a GitHub fake that returns:

```ts
const details = {
  login: 'ada',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  profileUrl: 'https://github.com/ada',
  bio: 'Programmer',
}
```

Assert `findOne` returns `gitHubDetails: details`. Add separate cases asserting `null` and zero GitHub calls for an admin and for a user whose `githubName` is `null`.

- [ ] **Step 3: Write a failing list enrichment test**

Provide database results with student, mentor, teacher, and admin rows plus a count result. Record usernames passed to the GitHub fake, return a distinct details object per username, and assert:

```ts
assert.deepEqual(requestedUsernames.sort(), ['student-gh', 'mentor-gh', 'teacher-gh'].sort())
assert.equal(result.ok, true)
if (result.ok) {
  assert.equal(result.data[0].gitHubDetails?.login, 'student-gh')
  assert.equal(result.data[1].gitHubDetails?.login, 'mentor-gh')
  assert.equal(result.data[2].gitHubDetails?.login, 'teacher-gh')
  assert.equal(result.data[3].gitHubDetails, null)
}
```

- [ ] **Step 4: Run user service tests and verify RED**

Run: `cd api && pnpm vitest run src/resources/users/user.service.test.ts`

Expected: FAIL because the constructor and read outputs are not enriched.

- [ ] **Step 5: Define enriched read types**

In `user.interface.ts` add:

```ts
import type { GitHubUserDetails } from '@/providers/github/github.types'

export type GetUserWithGitHubDetails = GetUserDto & {
  gitHubDetails: GitHubUserDetails | null
}

export type GetUserOutput = ServiceOutput<GetUserWithGitHubDetails>
export type ListUserOutput = ServiceOutput<List<GetUserWithGitHubDetails>>
```

Keep `UpsertUserOutput = ServiceOutput<GetUserDto>` unchanged.

- [ ] **Step 6: Inject GitHubService and add one enrichment helper**

Add `private readonly gitHubService: GitHubService` after `loggerFactory` in the `UsersService` constructor. Add:

```ts
private async withGitHubDetails(user: GetUserDto): Promise<GetUserWithGitHubDetails> {
  const eligible = user.role === 'student' || user.role === 'mentor' || user.role === 'teacher'
  if (!eligible || !user.githubName) return { ...user, gitHubDetails: null }

  return {
    ...user,
    gitHubDetails: await this.gitHubService.getUserDetails(user.githubName),
  }
}
```

- [ ] **Step 7: Enrich `findOne` and `findAll`**

After existence and authorization checks in `findOne`:

```ts
const dto = GetUserDto.toDto(user)
return { ok: true, ...(await this.withGitHubDetails(dto)) }
```

In `findAll`, map local DTOs first and await their enrichment in parallel:

```ts
const data = await Promise.all(
  userRows.map((user) => this.withGitHubDetails(GetUserDto.toDto(user))),
)
return { ok: true, totalCount: Number(totalCount[0]?.count ?? 0), data }
```

- [ ] **Step 8: Run user service tests and verify GREEN**

Run: `cd api && pnpm vitest run src/resources/users/user.service.test.ts`

Expected: all user service tests PASS.

- [ ] **Step 9: Commit user enrichment**

```bash
git add api/src/resources/users/user.interface.ts api/src/resources/users/user.service.ts api/src/resources/users/user.service.test.ts
git commit -m "feat: enrich users with GitHub details"
```

---

### Task 3: Wire modules and verify the API

**Files:**
- Modify: `api/src/resources/users/user.module.ts`
- Test: `api/src/resources/users/user.service.test.ts`
- Test: `api/src/providers/github/github.service.test.ts`

**Interfaces:**
- Consumes: exported `GitHubService` from `GitHubModule`.
- Produces: a resolvable `UsersService` dependency graph in NestJS.

- [ ] **Step 1: Import GitHubModule into UsersModule**

```ts
import { GitHubModule } from '@/providers/github/github.module'

@Module({
  imports: [GitHubModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
```

- [ ] **Step 2: Run focused and full verification**

Run: `cd api && pnpm vitest run src/providers/github/github.service.test.ts src/resources/users/user.service.test.ts`

Expected: focused tests PASS.

Run: `cd api && pnpm test`

Expected: all API tests PASS.

Run: `cd api && pnpm build`

Expected: PASS.

Run: `cd api && pnpm lint`

Expected: PASS, or report exact pre-existing diagnostics without formatting unrelated files.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 3: Review the final contract**

Confirm `findAll` and `findOne` always include `gitHubDetails`, only the three eligible roles trigger GitHub requests, individual failures become `null`, and mutation methods have no new calls or fields.

- [ ] **Step 4: Commit module wiring if not included earlier**

```bash
git add api/src/resources/users/user.module.ts
git commit -m "feat: wire GitHub profiles into users"
```
