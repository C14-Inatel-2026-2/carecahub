import { GitHubService } from '@/providers/github/github.service'
import { GetUserDto } from './dto/get-user.dto'
import type { GetUserWithGitHubDetails } from './user.interface'

export async function withGitHubDetails(
  gitHubService: GitHubService,
  user: GetUserDto,
): Promise<GetUserWithGitHubDetails> {
  if (!user.githubName) {
    return { ...user, gitHubDetails: null }
  }

  return {
    ...user,
    gitHubDetails: await gitHubService.getUserDetails(user.githubName),
  }
}
