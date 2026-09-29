import { Module } from '@nestjs/common'
import { GitHubModule } from '@/providers/github/github.module'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'

@Module({
  imports: [GitHubModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
