import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class GroupMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string
}

export class PromoteLeaderDto {
  @ApiProperty()
  @IsUUID()
  leaderId: string
}
