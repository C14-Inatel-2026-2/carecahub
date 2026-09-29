import type { RepositoryType } from '@db'
import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export class ProjectRepositoryDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  url: string

  @ApiProperty()
  commitCount: number

  @ApiProperty()
  branchCount: number
}

export type GetProjectDtoRecord = {
  id: string
  projectName: string
  repositoryType: RepositoryType | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetProjectDto extends BaseDto<GetProjectDto> {
  @ApiProperty()
  projectName: string

  @ApiProperty({ enum: ['monorepo', 'multirepo'], nullable: true })
  repositoryType: RepositoryType | null

  @ApiProperty({ type: [ProjectRepositoryDto] })
  repositories: ProjectRepositoryDto[]

  @ApiProperty()
  commitCount: number

  @ApiProperty()
  branchCount: number

  static toDto(project: GetProjectDtoRecord): GetProjectDto {
    return {
      id: project.id,
      projectName: project.projectName,
      repositoryType: project.repositoryType,
      repositories: [],
      commitCount: 0,
      branchCount: 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt ?? undefined,
    }
  }
}
