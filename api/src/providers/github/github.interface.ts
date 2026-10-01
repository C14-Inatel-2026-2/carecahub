import type { EitherResponse } from '@/infra/http.types'
import type { GitHubUserDetails, RepositoryDashboardStats, RepositoryDetails } from './github.types'

export abstract class IGitHubService {
  abstract getUserDetails(username: string): Promise<GitHubUserDetails | null>
  abstract getRepositoryFromUrl(repositoryUrl: string): Promise<EitherResponse<RepositoryDetails>>
  abstract getRepositoryDashboardStatsFromUrl(
    repositoryUrl: string,
    since: Date,
    until: Date,
  ): Promise<EitherResponse<RepositoryDashboardStats>>
}
