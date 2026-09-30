import type { EitherResponse } from '@/infra/http.types'
import type { GitHubUserDetails, RepositoryDetails } from './github.types'

export abstract class IGitHubService {
  abstract getUserDetails(username: string): Promise<GitHubUserDetails | null>
  abstract getRepositoryFromUrl(repositoryUrl: string): Promise<EitherResponse<RepositoryDetails>>
}
