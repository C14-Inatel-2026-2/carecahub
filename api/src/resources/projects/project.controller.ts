import { Body, Delete, Get, Patch, Post, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { Roles } from '@/infra/roles.guard'
import { User } from '@/infra/user.decorator'
import { UUIDParam } from '@/infra/uuid-param.decorator'
import { UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import { UpsertProjectDto } from './dto/upsert-project.dto'
import { ProjectService } from './project.service'

@ApiController('projects', 'Projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles(['admin', 'student'])
  create(@User() requester: UserMetadata, @Body() body: UpsertProjectDto) {
    return this.projectService.upsert(body, requester)
  }

  @Patch(':id')
  @Roles(['admin', 'student'])
  update(@User() requester: UserMetadata, @UUIDParam() id: string, @Body() body: UpsertProjectDto) {
    return this.projectService.upsert({ ...body, id }, requester)
  }

  @Get()
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findAll(@User() requester: UserMetadata, @Query() query: QueryDto) {
    return this.projectService.findAll(query, requester)
  }

  @Get(':id')
  @Roles(['admin', 'teacher', 'mentor', 'student'])
  findOne(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.projectService.findOne(id, requester)
  }

  @Delete(':id')
  @Roles(['admin', 'student'])
  remove(@User() requester: UserMetadata, @UUIDParam() id: string) {
    return this.projectService.remove(id, requester)
  }
}
