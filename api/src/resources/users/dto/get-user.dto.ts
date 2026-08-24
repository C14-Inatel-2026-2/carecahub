import { ApiProperty } from '@nestjs/swagger'
import { users } from '@/providers/database/generated/prisma/client'
import { user_role, user_status } from '@/providers/database/generated/prisma/enums'
import { BaseDto } from '@/utils/dtos/base.dto'

export class GetUserDto extends BaseDto<GetUserDto> {
  @ApiProperty()
  name: string

  @ApiProperty()
  email: string

  @ApiProperty({ enum: user_role })
  role: user_role

  @ApiProperty({ enum: user_status })
  status: user_status

  @ApiProperty()
  twoFactor: boolean

  static toDto(user: users): GetUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      twoFactor: user.two_factor,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      deletedAt: user.deleted_at ?? undefined,
    }
  }
}
