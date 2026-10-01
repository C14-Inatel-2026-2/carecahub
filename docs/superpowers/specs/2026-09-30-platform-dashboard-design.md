# Platform Dashboard Design

## Goal

Show administrators, teachers, and mentors a home-page dashboard with platform totals and GitHub commit activity. Students keep the existing welcome-only home.

## Data

`GET /dashboard` is restricted to `admin`, `teacher`, and `mentor`. It returns active, non-deleted student count plus non-deleted group, project, and repository counts; a zero-filled daily commit series covering today and the previous 29 calendar days in `America/Sao_Paulo`; commits grouped by the matched student's classroom; and the top five projects by historical commits.

Repository statistics are fetched live from the GitHub REST API on the default branch. A dashboard-specific GitHub method obtains the historical total with a one-item paginated request and obtains recent commits with `since`, `until`, and 100-item pagination. At most five repositories are processed concurrently.

Recent commits are matched case-insensitively from GitHub `author.login` to `User.githubName`. Missing authors, unknown users, and users without a classroom are grouped as `Não identificada`. Historical repository totals are summed per project. A failed GitHub repository contributes no commit data, does not hide database metrics, and sets `githubDataComplete` to false.

## API Structure

Create `api/src/resources/dashboard/` with module, controller, service, interface, DTO and focused tests, then register `DashboardModule` in `AppModule`. The service directly coordinates Drizzle aggregate queries and `GitHubService`; no new table, cache, queue, scheduler, dependency, or generic analytics layer is introduced.

## Web Structure

Add typed dashboard contracts and support `useGet('/dashboard')`. `HomePage` branches by role. Authorized staff see four metric cards, a Recharts line chart for daily commits, a bar chart for classroom commits, and a five-row ranking. Loading uses skeletons, total failure uses an error state, and partial GitHub data uses a restrained warning. Existing shadcn card/chart primitives are reused and no API mocks are added.

## Testing

Tests cover GitHub pagination and author/date mapping, database totals, case-insensitive classroom attribution, unknown authors, zero-filled 30-day output, project ranking, partial GitHub failures, role restriction, staff/student rendering, and the typed frontend contract. Full API/web suites, builds, scoped Biome, and `git diff --check` are required. No commits are created.
