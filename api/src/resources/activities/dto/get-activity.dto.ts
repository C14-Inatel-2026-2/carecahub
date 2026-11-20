import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export type GetActivityDtoRecord = {
  id: string
  title: string
  description: string
  dueDate: Date
  allowLateSubmissions: boolean
  createdById: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetActivityDto extends BaseDto<GetActivityDto> {
  @ApiProperty()
  title: string

  @ApiProperty()
  description: string

  @ApiProperty()
  dueDate: Date

  @ApiProperty()
  allowLateSubmissions: boolean

  @ApiProperty()
  createdById: string

  @ApiProperty({ description: 'Whether the due date has already passed' })
  isClosed: boolean

  static toDto(activity: GetActivityDtoRecord, now = new Date()): GetActivityDto {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      dueDate: activity.dueDate,
      allowLateSubmissions: activity.allowLateSubmissions,
      createdById: activity.createdById,
      isClosed: activity.dueDate.getTime() < now.getTime(),
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      deletedAt: activity.deletedAt ?? undefined,
    }
  }
}
