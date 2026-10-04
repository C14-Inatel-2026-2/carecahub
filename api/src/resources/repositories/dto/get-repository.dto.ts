import type { RepositoryType } from '@db'
import { ApiProperty } from '@nestjs/swagger'
import type { RepositoryDetails } from '@/providers/github/github.types'
import type { GetUserDtoRecord } from '@/resources/users/dto/get-user.dto'
import { GetUserDto } from '@/resources/users/dto/get-user.dto'
import { BaseDto } from '@/utils/dtos/base.dto'

export type RepositoryProjectSummary = {
  id: string
  groupId: string
  projectName: string
  repositoryType: RepositoryType
}

export type GetRepositoryDtoRecord = {
  id: string
  url: string
  ownerId: string
  projectId: string
  owner: GetUserDtoRecord
  project: RepositoryProjectSummary
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetRepositoryDto extends BaseDto<GetRepositoryDto> {
  @ApiProperty()
  url: string

  @ApiProperty()
  ownerId: string

  @ApiProperty()
  projectId: string

  @ApiProperty()
  owner: GetUserDto

  @ApiProperty()
  project: RepositoryProjectSummary

  @ApiProperty({ nullable: true })
  details: RepositoryDetails | null

  static toDto(
    repository: GetRepositoryDtoRecord,
    details: RepositoryDetails | null = null,
  ): GetRepositoryDto {
    return {
      id: repository.id,
      url: repository.url,
      ownerId: repository.ownerId,
      projectId: repository.projectId,
      owner: GetUserDto.toDto(repository.owner),
      project: repository.project,
      details,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
      deletedAt: repository.deletedAt ?? undefined,
    }
  }
}
