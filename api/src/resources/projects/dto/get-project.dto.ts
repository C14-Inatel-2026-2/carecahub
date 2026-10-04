import type { RepositoryType } from '@db'
import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export class ProjectRepositoryDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  url: string

  @ApiProperty()
  ownerId: string

  @ApiProperty()
  projectId: string

  @ApiProperty()
  commitCount: number

  @ApiProperty()
  branchCount: number

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}

export type GetProjectDtoRecord = {
  id: string
  groupId: string
  projectName: string
  description: string
  technologies: string[]
  usesOtherTechnology: boolean
  otherTechnology: string | null
  dependencyManager: string
  otherDependencyManager: string | null
  versionControl: string
  otherVersionControl: string | null
  repositoryType: RepositoryType
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetProjectDto extends BaseDto<GetProjectDto> {
  @ApiProperty()
  groupId: string

  @ApiProperty()
  projectName: string

  @ApiProperty()
  description: string

  @ApiProperty({ type: [String] })
  technologies: string[]

  @ApiProperty()
  usesOtherTechnology: boolean

  @ApiProperty({ nullable: true })
  otherTechnology: string | null

  @ApiProperty()
  dependencyManager: string

  @ApiProperty({ nullable: true })
  otherDependencyManager: string | null

  @ApiProperty()
  versionControl: string

  @ApiProperty({ nullable: true })
  otherVersionControl: string | null

  @ApiProperty({ enum: ['monorepo', 'multirepo'] })
  repositoryType: RepositoryType

  @ApiProperty({ type: [String] })
  tags: Array<RepositoryType | 'missing_repo'>

  @ApiProperty({ type: [ProjectRepositoryDto] })
  repositories: ProjectRepositoryDto[]

  @ApiProperty()
  commitCount: number

  @ApiProperty()
  branchCount: number

  static toDto(
    project: GetProjectDtoRecord,
    repositories: ProjectRepositoryDto[] = [],
  ): GetProjectDto {
    return {
      id: project.id,
      groupId: project.groupId,
      projectName: project.projectName,
      description: project.description,
      technologies: project.technologies,
      usesOtherTechnology: project.usesOtherTechnology,
      otherTechnology: project.otherTechnology,
      dependencyManager: project.dependencyManager,
      otherDependencyManager: project.otherDependencyManager,
      versionControl: project.versionControl,
      otherVersionControl: project.otherVersionControl,
      repositoryType: project.repositoryType,
      tags:
        repositories.length === 0
          ? [project.repositoryType, 'missing_repo']
          : [project.repositoryType],
      repositories,
      commitCount: repositories.reduce((total, repository) => total + repository.commitCount, 0),
      branchCount: repositories.reduce((total, repository) => total + repository.branchCount, 0),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt ?? undefined,
    }
  }
}
