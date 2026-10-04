import type { UserRole, UserStatus } from '@db'
import { USER_ROLE, USER_ROLES, USER_STATUSES } from '@db'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsEnum, IsOptional } from 'class-validator'
import { BaseDto } from '@/utils/dtos/base.dto'
import { QueryDto } from '@/utils/dtos/query.dto'

export class GetUserQueryDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'The roles of the users to filter by',
    required: false,
    example: 'student',
    enum: USER_ROLE,
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value
    }

    return value.split(',')
  })
  @IsEnum(USER_ROLE, { each: true })
  roles?: UserRole[]
}

export type GetUserDtoRecord = {
  id: string
  groupId: string | null
  name: string
  registration: number | null
  githubName: string | null
  classroom: string | null
  email: string
  role: UserRole
  status: UserStatus
  two_factor: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class GetUserDto extends BaseDto<GetUserDto> {
  @ApiProperty({ nullable: true })
  groupId: string | null

  @ApiProperty()
  name: string

  @ApiProperty({ nullable: true })
  registration: number | null

  @ApiProperty({ nullable: true })
  githubName: string | null

  @ApiProperty({ nullable: true })
  classroom: string | null

  @ApiProperty()
  email: string

  @ApiProperty({ enum: USER_ROLES })
  role: UserRole

  @ApiProperty({ enum: USER_STATUSES })
  status: UserStatus

  @ApiProperty()
  twoFactor: boolean

  static toDto(user: GetUserDtoRecord): GetUserDto {
    return {
      id: user.id,
      groupId: user.groupId ?? null,
      name: user.name,
      registration: user.registration,
      githubName: user.githubName,
      classroom: user.classroom,
      email: user.email,
      role: user.role,
      status: user.status,
      twoFactor: user.two_factor,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt ?? undefined,
    }
  }
}
