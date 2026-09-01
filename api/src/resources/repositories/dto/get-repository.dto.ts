import type { Project, User } from '@db'
import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export type GetRepositoryDtoRecord = {
  id: string
  url: string
  owner: User
  project: Project
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export class GetRepositoryDto extends BaseDto<GetRepositoryDto> {
  @ApiProperty()
  url: string

  @ApiProperty()
  owner: User

  @ApiProperty()
  project: Project

  static toDto(repository: GetRepositoryDtoRecord): GetRepositoryDto {
    return {
      id: repository.id,
      url: repository.url,
      owner: repository.owner,
      project: repository.project,
      createdAt: repository.created_at,
      updatedAt: repository.updated_at,
      deletedAt: repository.deleted_at ?? undefined,
    }
  }
}
