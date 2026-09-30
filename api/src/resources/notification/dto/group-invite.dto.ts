import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsUUID } from 'class-validator'

export const GROUP_INVITE_RESPONSE_STATUSES = ['accepted', 'rejected'] as const
export type GroupInviteResponseStatus = (typeof GROUP_INVITE_RESPONSE_STATUSES)[number]

export class CreateGroupInviteDto {
  @ApiProperty()
  @IsUUID()
  inviteeId: string
}

export class RespondGroupInviteDto {
  @ApiProperty({ enum: GROUP_INVITE_RESPONSE_STATUSES })
  @IsEnum(GROUP_INVITE_RESPONSE_STATUSES)
  status: GroupInviteResponseStatus
}
