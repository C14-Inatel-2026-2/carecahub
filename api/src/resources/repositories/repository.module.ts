import { Module } from '@nestjs/common'
import { GitHubModule } from '@/providers/github/github.module'
import { RepositoryController } from './repository.controller'
import { RepositoryService } from './repository.service'

@Module({
  imports: [GitHubModule],
  controllers: [RepositoryController],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class RepositoryModule {}
