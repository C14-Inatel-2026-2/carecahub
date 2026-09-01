export type RepositoryBranchDetails = {
  name: string
  protected: boolean
  default: boolean
  commitCount: number
}

export type RepositoryDetails = {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string | null
  fork: boolean
  url: string
  created_at: string
  updated_at: string
  pushed_at: string | null
  homepage: string | null
  size: number
  stargazers_count: number
  watchers_count: number
  language: string | null
  forks_count: number
  open_issues_count: number
  default_branch: string
  commitCount: number
  branches: RepositoryBranchDetails[]
  topics: string[]
  visibility: string
  archived: boolean
  disabled: boolean
  [key: string]: unknown
}
