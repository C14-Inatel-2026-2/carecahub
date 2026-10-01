import { groups, projects, repositories, users } from '@db'
import { Injectable } from '@nestjs/common'
import { and, count, eq, isNull } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { GitHubService } from '@/providers/github/github.service'
import type { GetDashboardOutput } from './dashboard.interface'

const TIME_ZONE = 'America/Sao_Paulo'
const UNKNOWN_CLASSROOM = 'Não identificada'
const RECENT_DAY_COUNT = 30
const REPOSITORY_CONCURRENCY = 5

type RepositoryRow = {
  id: string
  url: string
  projectId: string
  projectName: string
}

const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function parts(date: Date) {
  return Object.fromEntries(
    datePartsFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>
}

function dayKey(date: Date) {
  const value = parts(date)
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
}

function startOfZonedDay(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  const guess = Date.UTC(year, month - 1, day)
  const guessParts = parts(new Date(guess))
  const represented = Date.UTC(
    guessParts.year,
    guessParts.month - 1,
    guessParts.day,
    guessParts.hour,
    guessParts.minute,
    guessParts.second,
  )
  return new Date(guess - (represented - guess))
}

function recentDayKeys(now: Date) {
  const today = parts(now)
  return Array.from({ length: RECENT_DAY_COUNT }, (_, index) =>
    new Date(Date.UTC(today.year, today.month - 1, today.day - (RECENT_DAY_COUNT - 1 - index)))
      .toISOString()
      .slice(0, 10),
  )
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly database: DrizzleService,
    private readonly gitHubService: GitHubService,
  ) {}

  async getDashboard(): GetDashboardOutput {
    const [studentRows, groupRows, projectRows, repositoryCountRows, repositoryRows, userRows] =
      await Promise.all([
        this.database.db
          .select({ count: count() })
          .from(users)
          .where(
            and(eq(users.role, 'student'), eq(users.status, 'active'), isNull(users.deletedAt)),
          ),
        this.database.db.select({ count: count() }).from(groups).where(isNull(groups.deletedAt)),
        this.database.db
          .select({ count: count() })
          .from(projects)
          .where(isNull(projects.deletedAt)),
        this.database.db
          .select({ count: count() })
          .from(repositories)
          .where(isNull(repositories.deletedAt)),
        this.database.db
          .select({
            id: repositories.id,
            url: repositories.url,
            projectId: projects.id,
            projectName: projects.projectName,
          })
          .from(repositories)
          .innerJoin(projects, eq(repositories.projectId, projects.id))
          .where(and(isNull(repositories.deletedAt), isNull(projects.deletedAt))),
        this.database.db
          .select({ githubName: users.githubName, classroom: users.classroom })
          .from(users)
          .where(
            and(eq(users.role, 'student'), eq(users.status, 'active'), isNull(users.deletedAt)),
          ),
      ])

    const now = new Date()
    const days = recentDayKeys(now)
    const since = startOfZonedDay(days[0])
    const statistics = await this.getRepositoryStatistics(repositoryRows, since, now)
    const commitsByDay = new Map(days.map((date) => [date, 0]))
    const classroomByLogin = new Map(
      userRows
        .filter(
          (user): user is { githubName: string; classroom: string | null } => !!user.githubName,
        )
        .map((user) => [user.githubName.toLocaleLowerCase(), user.classroom]),
    )
    const classroomCounts = new Map<string, number>()
    const projectTotals = new Map<string, { projectName: string; commitCount: number }>()
    let githubDataComplete = true

    for (const { repository, result } of statistics) {
      const project = projectTotals.get(repository.projectId) ?? {
        projectName: repository.projectName,
        commitCount: 0,
      }
      projectTotals.set(repository.projectId, project)
      if (!result.success) {
        githubDataComplete = false
        continue
      }

      project.commitCount += result.historicalCommitCount
      for (const commit of result.recentCommits) {
        const commitDay = dayKey(new Date(commit.authoredAt))
        if (commitsByDay.has(commitDay)) {
          commitsByDay.set(commitDay, (commitsByDay.get(commitDay) ?? 0) + 1)
        }
        const classroom = commit.authorLogin
          ? (classroomByLogin.get(commit.authorLogin.toLocaleLowerCase()) ?? UNKNOWN_CLASSROOM)
          : UNKNOWN_CLASSROOM
        classroomCounts.set(classroom, (classroomCounts.get(classroom) ?? 0) + 1)
      }
    }

    return {
      ok: true,
      metrics: {
        students: Number(studentRows[0]?.count ?? 0),
        groups: Number(groupRows[0]?.count ?? 0),
        projects: Number(projectRows[0]?.count ?? 0),
        repositories: Number(repositoryCountRows[0]?.count ?? 0),
      },
      commitsByDay: [...commitsByDay].map(([date, value]) => ({ date, count: value })),
      commitsByClassroom: [...classroomCounts]
        .map(([classroom, value]) => ({ classroom, count: value }))
        .sort((a, b) => b.count - a.count || a.classroom.localeCompare(b.classroom)),
      projectRanking: [...projectTotals]
        .map(([projectId, project]) => ({ projectId, ...project }))
        .sort((a, b) => b.commitCount - a.commitCount || a.projectName.localeCompare(b.projectName))
        .slice(0, 5),
      githubDataComplete,
    }
  }

  private async getRepositoryStatistics(
    repositoriesToLoad: RepositoryRow[],
    since: Date,
    now: Date,
  ) {
    const statistics: Array<{
      repository: RepositoryRow
      result: Awaited<ReturnType<GitHubService['getRepositoryDashboardStatsFromUrl']>>
    }> = []

    for (let index = 0; index < repositoriesToLoad.length; index += REPOSITORY_CONCURRENCY) {
      const batch = repositoriesToLoad.slice(index, index + REPOSITORY_CONCURRENCY)
      statistics.push(
        ...(await Promise.all(
          batch.map(async (repository) => ({
            repository,
            result: await this.gitHubService.getRepositoryDashboardStatsFromUrl(
              repository.url,
              since,
              now,
            ),
          })),
        )),
      )
    }

    return statistics
  }
}
