import { activityGroups, activitySubmissions, classrooms, groups, projects, repositories, users } from '@db'
import { Injectable } from '@nestjs/common'
import { and, asc, count, eq, isNotNull, isNull } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { GitHubService } from '@/providers/github/github.service'
import { ErrKeys, type UserMetadata } from '@/types'
import type { CreateClassroomDto } from './dto/create-classroom.dto'
import type { GetClassroomQueryDto } from './dto/get-classroom-query.dto'
import type {
  ClassroomOption,
  ClassroomSummary,
  GetClassroomOutput,
  ListClassroomOutput,
} from './classroom.interface'

@Injectable()
export class ClassroomService {
  constructor(
    private readonly database: DrizzleService,
    private readonly gitHubService: GitHubService,
  ) {}

  async findRegistrationOptions(): Promise<ClassroomOption[]> {
    return this.database.db
      .select({ id: classrooms.id, name: classrooms.name, semester: classrooms.semester })
      .from(classrooms)
      .where(isNull(classrooms.archivedAt))
      .orderBy(asc(classrooms.semester), asc(classrooms.name))
  }

  async findAll(query: GetClassroomQueryDto, requester: UserMetadata): Promise<ListClassroomOutput> {
    if (!this.canManage(requester)) return { ok: false, errKey: ErrKeys.forbidden }
    const where = and(
      query.semester ? eq(classrooms.semester, query.semester) : undefined,
      query.status === 'active' ? isNull(classrooms.archivedAt) : undefined,
      query.status === 'archived' ? isNotNull(classrooms.archivedAt) : undefined,
    )
    const [rows, totals] = await Promise.all([
      this.database.db
        .select()
        .from(classrooms)
        .where(where)
        .orderBy(asc(classrooms.semester), asc(classrooms.name))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(classrooms).where(where),
    ])
    return {
      ok: true,
      totalCount: Number(totals[0]?.count ?? 0),
      data: await Promise.all(rows.map((row) => this.toSummary(row))),
    }
  }

  async findOne(id: string, requester: UserMetadata): Promise<GetClassroomOutput> {
    if (!this.canManage(requester)) return { ok: false, errKey: ErrKeys.forbidden }
    const [row] = await this.database.db.select().from(classrooms).where(eq(classrooms.id, id))
    if (!row) return { ok: false, errKey: ErrKeys.notFound }
    return { ok: true, ...(await this.toSummary(row)) }
  }

  async create(input: CreateClassroomDto, requester: UserMetadata): Promise<GetClassroomOutput> {
    if (!this.canManage(requester)) return { ok: false, errKey: ErrKeys.forbidden }
    const [existing] = await this.database.db
      .select({ id: classrooms.id })
      .from(classrooms)
      .where(and(eq(classrooms.name, input.name.trim()), eq(classrooms.semester, input.semester)))
    if (existing) return { ok: false, errKey: ErrKeys.alreadyExists }
    const [created] = await this.database.db
      .insert(classrooms)
      .values({ name: input.name.trim(), semester: input.semester })
      .returning()
    return { ok: true, ...(await this.toSummary(created)) }
  }

  async archive(id: string, requester: UserMetadata): Promise<GetClassroomOutput> {
    if (!this.canManage(requester)) return { ok: false, errKey: ErrKeys.forbidden }
    const [updated] = await this.database.db
      .update(classrooms)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(classrooms.id, id), isNull(classrooms.archivedAt)))
      .returning()
    if (updated) return { ok: true, ...(await this.toSummary(updated)) }
    const [existing] = await this.database.db.select({ id: classrooms.id }).from(classrooms).where(eq(classrooms.id, id))
    return { ok: false, errKey: existing ? ErrKeys.resourceInUse : ErrKeys.notFound }
  }

  private canManage(requester: UserMetadata) {
    return ['admin', 'teacher', 'mentor'].includes(requester.role)
  }

  private async toSummary(row: typeof classrooms.$inferSelect): Promise<ClassroomSummary> {
    const classroomFilter = and(eq(groups.classroomId, row.id), isNull(groups.deletedAt))
    const [studentRows, groupRows, projectRows, audienceRows, submissionRows, repositoryRows] =
      await Promise.all([
        this.database.db.select({ count: count() }).from(users).where(and(eq(users.classroomId, row.id), isNull(users.deletedAt))),
        this.database.db.select({ count: count() }).from(groups).where(classroomFilter),
        this.database.db.select({ count: count() }).from(projects).innerJoin(groups, eq(projects.groupId, groups.id)).where(and(classroomFilter, isNull(projects.deletedAt))),
        this.database.db.select({ count: count() }).from(activityGroups).innerJoin(groups, eq(activityGroups.groupId, groups.id)).where(classroomFilter),
        this.database.db.select({ count: count() }).from(activitySubmissions).innerJoin(groups, eq(activitySubmissions.groupId, groups.id)).where(and(classroomFilter, isNull(activitySubmissions.invalidatedAt))),
        this.database.db.select({ url: repositories.url }).from(repositories).innerJoin(projects, eq(repositories.projectId, projects.id)).innerJoin(groups, eq(projects.groupId, groups.id)).where(and(classroomFilter, isNull(projects.deletedAt), isNull(repositories.deletedAt))),
      ])
    const commitResults = await Promise.all(repositoryRows.map((repository) => this.gitHubService.getRepositoryFromUrl(repository.url)))
    const audience = Number(audienceRows[0]?.count ?? 0)
    const submissions = Number(submissionRows[0]?.count ?? 0)
    return {
      id: row.id,
      name: row.name,
      semester: row.semester,
      archivedAt: row.archivedAt,
      studentsCount: Number(studentRows[0]?.count ?? 0),
      groupsCount: Number(groupRows[0]?.count ?? 0),
      projectsCount: Number(projectRows[0]?.count ?? 0),
      deliveryRate: audience === 0 ? 0 : Math.round((submissions / audience) * 100),
      commitsCount: commitResults.reduce((total, result) => total + (result.success ? result.commitCount : 0), 0),
    }
  }
}
