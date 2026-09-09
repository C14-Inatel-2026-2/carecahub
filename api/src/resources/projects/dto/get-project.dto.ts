import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export type GetProjectDtoRecord = {
  id: string
  projectName: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetProjectDto extends BaseDto<GetProjectDto> {
  @ApiProperty()
  projectName: string

  static toDto(project: GetProjectDtoRecord): GetProjectDto {
    return {
      id: project.id,
      projectName: project.projectName,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt ?? undefined,
    }
  }
}