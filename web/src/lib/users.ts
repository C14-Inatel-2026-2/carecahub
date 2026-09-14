import type { User } from '@/types/user'

export function findUserByGitHubUsername(users: readonly User[], githubUsername: string) {
  const normalizedUsername = githubUsername.toLocaleLowerCase()

  return users.find((user) => user.githubName?.toLocaleLowerCase() === normalizedUsername)
}
