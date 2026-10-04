import { ApiProperty } from '@nestjs/swagger'
import type { GetProjectDto } from '@/resources/projects/dto/get-project.dto'
import type { GetUserWithGitHubDetails } from '@/resources/users/user.interface'
import { BaseDto } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'

export type GroupTag = 'no_project' | 'full' | 'space_available'

export class GetGroupQueryDto extends QueryDto {}

export type GetGroupDtoRecord = {
  id: string
  friendlyId: string
  leaderId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetGroupDto extends BaseDto<GetGroupDto> {
  @ApiProperty()
  friendlyId: string

  @ApiProperty()
  leaderId: string

  @ApiProperty({ type: [String] })
  tags: GroupTag[]

  @ApiProperty({ type: [Object] })
  members: GetUserWithGitHubDetails[]

  @ApiProperty({ type: Object, nullable: true })
  project: GetProjectDto | null

  static toDto(
    group: GetGroupDtoRecord,
    members: GetUserWithGitHubDetails[] = [],
    project: GetProjectDto | null = null,
  ): GetGroupDto {
    const tags: GroupTag[] = [members.length >= 6 ? 'full' : 'space_available']
    if (!project) tags.push('no_project')

    return {
      id: group.id,
      friendlyId: group.friendlyId,
      leaderId: group.leaderId,
      tags,
      members,
      project,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      deletedAt: group.deletedAt ?? undefined,
    }
  }
}
