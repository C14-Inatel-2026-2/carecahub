import { Body, Get, Patch, Post, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Public } from '@/infra/public.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import type { UserMetadata } from '@/types'
import { ClassroomService } from './classroom.service'
import { CreateClassroomDto } from './dto/create-classroom.dto'
import { GetClassroomQueryDto } from './dto/get-classroom-query.dto'

@ApiController('classrooms', 'Classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get('registration-options')
  @Public()
  registrationOptions() { return this.classroomService.findRegistrationOptions() }

  @Get()
  @Roles(['admin', 'teacher', 'mentor'])
  findAll(@User() requester: UserMetadata, @Query() query: GetClassroomQueryDto) { return this.classroomService.findAll(query, requester) }

  @Get(':id')
  @Roles(['admin', 'teacher', 'mentor'])
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) { return this.classroomService.findOne(id, requester) }

  @Post()
  @Roles(['admin', 'teacher', 'mentor'])
  create(@User() requester: UserMetadata, @Body() body: CreateClassroomDto) { return this.classroomService.create(body, requester) }

  @Patch(':id/archive')
  @Roles(['admin', 'teacher', 'mentor'])
  archive(@User() requester: UserMetadata, @UUIDParam() id: string) { return this.classroomService.archive(id, requester) }
}
