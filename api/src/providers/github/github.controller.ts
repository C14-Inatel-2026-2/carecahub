import { Get, Query } from '@nestjs/common'
import { ApiController } from '@/infra/controller.decorator'
import { GitHubService } from './github.service'

@ApiController('github', 'GitHub')
export class GitHubController {
  constructor(private readonly githubService: GitHubService) {}

  @Get('/repository')
  getRepository(@Query('url') repositoryUrl: string) {
    return this.githubService.getRepositoryFromUrl(repositoryUrl)
  }
}
