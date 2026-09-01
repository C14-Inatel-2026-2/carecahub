import { Injectable } from '@nestjs/common'
import axios, { type AxiosInstance } from 'axios'
import type { EitherResponse } from '@/infra/http.types'
import { env } from '@/providers/config/env'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import type { RepositoryDetails } from './github.types'

@Injectable()
export class GitHubService {
  private readonly axios: AxiosInstance

  constructor(private readonly logger: CustomLogger) {
    this.axios = axios.create({
      baseURL: env.GITHUB_BASE_URL,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2026-03-10',
      },
      timeout: env.GITHUB_TIMEOUT,
    })
  }

  async getRepositoryFromUrl(repositoryUrl: string): Promise<EitherResponse<RepositoryDetails>> {
    try {
      const { owner, repository } = this.parseRepositoryUrl(repositoryUrl)
      this.logger.info(`GET GitHub repository details: ${owner}/${repository}`)
      const response = await this.axios.get<RepositoryDetails>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
      )

      return { success: true, ...response.data }
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      const isNotFound = status === 404

      this.logger.error(
        `Failed to get GitHub repository details: ${error instanceof Error ? error.message : String(error)}`,
      )

      return {
        success: false,
        errKey: isNotFound ? 'repositoryNotFound' : 'error',
        message: isNotFound ? 'GitHub repository not found' : 'Failed to get GitHub repository',
        friendlyMessage: isNotFound
          ? 'Repositório do GitHub não encontrado. Verifique a URL vinculada.'
          : 'Falha ao buscar o repositório no GitHub.',
      }
    }
  }

  private parseRepositoryUrl(repositoryUrl: string) {
    const url = new URL(repositoryUrl)
    if (
      url.protocol !== 'https:' ||
      (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    ) {
      throw new Error('Invalid GitHub repository URL')
    }

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length !== 2) throw new Error('Invalid GitHub repository URL')

    const [owner, rawRepository] = parts
    const repository = rawRepository.replace(/\.git$/, '')
    if (!owner || !repository) throw new Error('Invalid GitHub repository URL')

    return { owner, repository }
  }
}
