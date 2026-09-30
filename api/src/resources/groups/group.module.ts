import { Module } from '@nestjs/common'
import { GitHubModule } from '@/providers/github/github.module'
import { ProjectModule } from '../projects/project.module'
import { GroupController } from './group.controller'
import { GroupService } from './group.service'

@Module({
  imports: [GitHubModule, ProjectModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
