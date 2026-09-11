import { Injectable } from '@nestjs/common'
import axios, { type AxiosInstance } from 'axios'
import type { EitherResponse } from '@/infra/http.types'
import { env } from '@/providers/config/env'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import type { RepositoryBranchDetails, RepositoryDetails } from './github.types'

type GitHubBranch = {
  name: string
  protected: boolean
}

type GitHubCommit = {
  sha: string
}

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
      const repositoryPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`
      const repositoryBranches = await this.getBranches(repositoryPath)
      const branches: RepositoryBranchDetails[] = []
      for (let index = 0; index < repositoryBranches.length; index += 5) {
        const batch = repositoryBranches.slice(index, index + 5)
        const batchDetails = await Promise.all(
          batch.map(
            async (branch): Promise<RepositoryBranchDetails> => ({
              name: branch.name,
              protected: branch.protected,
              default: branch.name === response.data.default_branch,
              commitCount: await this.getCommitCount(repositoryPath, branch.name),
            }),
          ),
        )
        branches.push(...batchDetails)
      }
      const defaultBranch = branches.find((branch) => branch.default)

      return {
        success: true,
        ...response.data,
        commitCount: defaultBranch?.commitCount ?? 0,
        branches,
      }
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

  private async getBranches(repositoryPath: string): Promise<GitHubBranch[]> {
    const branches: GitHubBranch[] = []
    let pageUrl: string | undefined = `${repositoryPath}/branches?per_page=100`

    while (pageUrl) {
      const response = await this.axios.get<GitHubBranch[]>(pageUrl)
      branches.push(...response.data)
      pageUrl = this.getLinkUrl(response.headers.link, 'next')
    }

    return branches
  }

  private async getCommitCount(repositoryPath: string, branch: string): Promise<number> {
    const response = await this.axios.get<GitHubCommit[]>(
      `${repositoryPath}/commits?sha=${encodeURIComponent(branch)}&per_page=1`,
    )
    const lastPage = this.getLinkPage(response.headers.link, 'last')
    return lastPage ?? response.data.length
  }

  private getLinkPage(linkHeader: string | undefined, relation: string): number | undefined {
    const linkUrl = this.getLinkUrl(linkHeader, relation)
    if (!linkUrl) return undefined

    const page = Number(new URL(linkUrl).searchParams.get('page'))
    return Number.isInteger(page) && page >= 1 ? page : undefined
  }

  private getLinkUrl(linkHeader: string | undefined, relation: string): string | undefined {
    if (!linkHeader) return undefined

    for (const link of linkHeader.split(',')) {
      const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/)
      if (match?.[2] === relation) return match[1]
    }

    return undefined
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
