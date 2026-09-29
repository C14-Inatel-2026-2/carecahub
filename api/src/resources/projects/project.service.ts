import { projects, repositories } from '@db'
import { Injectable } from '@nestjs/common'
import { and, count, desc, eq, ilike, isNull, ne } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { GitHubService } from '@/providers/github/github.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import type { GetProjectDtoRecord } from './dto/get-project.dto'
import { GetProjectDto } from './dto/get-project.dto'
import { UpsertProjectDto } from './dto/upsert-project.dto'
import {
  GetProjectOutput,
  IProjectService,
  ListProjectOutput,
  RemoveProjectOutput,
  UpsertProjectOutput,
} from './project.interface'

@Injectable()
export class ProjectService implements IProjectService {
  private readonly logger: CustomLogger

  constructor(
    private readonly database: DrizzleService,
    private readonly gitHubService: GitHubService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(ProjectService.name)
  }

  async upsert(input: UpsertProjectDto): Promise<UpsertProjectOutput> {
    try {
      return await this.persist(input)
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists }
      }
      throw error
    }
  }

  private async persist(input: UpsertProjectDto): Promise<UpsertProjectOutput> {
    if (input.id) {
      const [project] = await this.database.db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, input.id), isNull(projects.deletedAt)))

      if (!project) return { ok: false, errKey: ErrKeys.notFound }

      const [nameInUse] = await this.database.db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.projectName, input.projectName),
            ne(projects.id, input.id),
            isNull(projects.deletedAt),
          ),
        )

      if (nameInUse) return { ok: false, errKey: ErrKeys.alreadyExists }

      await this.database.db
        .update(projects)
        .set({ projectName: input.projectName, updatedAt: new Date() })
        .where(eq(projects.id, input.id))

      const updatedProject = await this.getRecord(input.id)
      if (!updatedProject) return { ok: false, errKey: ErrKeys.notFound }

      return { ok: true, ...GetProjectDto.toDto(updatedProject) }
    }

    const [nameInUse] = await this.database.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.projectName, input.projectName), isNull(projects.deletedAt)))

    if (nameInUse) return { ok: false, errKey: ErrKeys.alreadyExists }

    const [project] = await this.database.db
      .insert(projects)
      .values({ projectName: input.projectName })
      .returning({ id: projects.id })

    const createdProject = await this.getRecord(project.id)
    if (!createdProject) return { ok: false, errKey: ErrKeys.notFound }

    return { ok: true, ...GetProjectDto.toDto(createdProject) }
  }

  private isUniqueViolation(error: unknown): error is { code: '23505' } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
  }

  async findAll(query: QueryDto, _requester?: UserMetadata): Promise<ListProjectOutput> {
    const where = query.search
      ? and(isNull(projects.deletedAt), ilike(projects.projectName, `%${query.search}%`))
      : isNull(projects.deletedAt)

    const [projectRows, totalCount] = await Promise.all([
      this.database.db
        .select(this.selection)
        .from(projects)
        .where(where)
        .orderBy(desc(projects.createdAt))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(projects).where(where),
    ])

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: await Promise.all(projectRows.map((project) => this.withRepositoryStats(project))),
    }
  }

  async findOne(id: string, _requester?: UserMetadata): Promise<GetProjectOutput> {
    const project = await this.getRecord(id)
    if (!project) return { ok: false, errKey: ErrKeys.notFound }

    return { ok: true, ...(await this.withRepositoryStats(project)) }
  }

  async remove(id: string, _requester: UserMetadata): Promise<RemoveProjectOutput> {
    const [project] = await this.database.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))

    if (!project) return { ok: false, errKey: ErrKeys.notFound }

    await this.database.db
      .update(projects)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(projects.id, id))

    this.logger.log(`Project ${id} removed`)
    return { ok: true }
  }

  private readonly selection = {
    id: projects.id,
    projectName: projects.projectName,
    repositoryType: projects.repositoryType,
    createdAt: projects.createdAt,
    updatedAt: projects.updatedAt,
    deletedAt: projects.deletedAt,
  }

  private async getRecord(id: string): Promise<GetProjectDtoRecord | undefined> {
    const [project] = await this.database.db
      .select(this.selection)
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))

    return project
  }

  private async withRepositoryStats(project: GetProjectDtoRecord): Promise<GetProjectDto> {
    const repositoryRows = await this.database.db
      .select({ id: repositories.id, url: repositories.url })
      .from(repositories)
      .where(and(eq(repositories.projectId, project.id), isNull(repositories.deletedAt)))

    const projectRepositories = await Promise.all(
      repositoryRows.map(async (repository) => {
        const githubRepository = await this.gitHubService.getRepositoryFromUrl(repository.url)
        const commitCount = githubRepository.success ? githubRepository.commitCount : 0
        const branchCount = githubRepository.success ? githubRepository.branches.length : 0

        return { ...repository, commitCount, branchCount }
      }),
    )

    return {
      ...GetProjectDto.toDto(project),
      repositories: projectRepositories,
      commitCount: projectRepositories.reduce(
        (total, repository) => total + repository.commitCount,
        0,
      ),
      branchCount: projectRepositories.reduce(
        (total, repository) => total + repository.branchCount,
        0,
      ),
    }
  }
}
