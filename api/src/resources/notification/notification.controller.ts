import { Body, Get, Patch, Post, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import type { UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { CreateGroupInviteDto, RespondGroupInviteDto } from './dto/group-invite.dto'
import { NotificationService } from './notification.service'

const authenticatedRoles = ['admin', 'teacher', 'mentor', 'student'] as const

@ApiController('notifications', 'Notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles([...authenticatedRoles])
  findAll(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.notificationService.findAll(query, requester)
  }

  @Patch('read-all')
  @Roles([...authenticatedRoles])
  markAllAsRead(@User() requester: UserMetadata) {
    return this.notificationService.markAllAsRead(requester)
  }

  @Get('group-invites/candidates')
  @Roles(['student'])
  findGroupInviteCandidates(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.notificationService.findGroupInviteCandidates(query, requester)
  }

  @Post('group-invites')
  @Roles(['student'])
  createGroupInvite(@User() requester: UserMetadata, @Body() body: CreateGroupInviteDto) {
    return this.notificationService.createGroupInvite(body, requester)
  }

  @Patch('group-invites/:id/respond')
  @Roles(['student'])
  respondToGroupInvite(
    @User() requester: UserMetadata,
    @UUIDParam() inviteId: string,
    @Body() body: RespondGroupInviteDto,
  ) {
    return this.notificationService.respondToGroupInvite(inviteId, body, requester)
  }

  @Patch(':id/read')
  @Roles([...authenticatedRoles])
  markAsRead(@User() requester: UserMetadata, @UUIDParam() notificationId: string) {
    return this.notificationService.markAsRead(notificationId, requester)
  }
}
