import type { EitherResponse } from '@/infra/http.types'
import type { RepositoryDetails } from './github.types'

export abstract class IGitHubService {
  abstract getRepositoryFromUrl(repositoryUrl: string): Promise<EitherResponse<RepositoryDetails>>
}
