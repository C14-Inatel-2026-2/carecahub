import type { GroupTag } from '@/types/group'
import type { ProjectTag } from '@/types/project'
import type { User } from '@/types/user'

export const getBadgeClassNamesByRole = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200'
    case 'teacher':
      return 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
    case 'mentor':
      return 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200'
    case 'student':
      return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200'
    default:
      return ''
  }
}

export const getBadgeClassNamesByGroupTag = (tag: GroupTag) => {
  switch (tag) {
    case 'full':
      return 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200'
    case 'space_available':
      return 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200'
    case 'no_project':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
    default:
      return ''
  }
}

export const getBadgeClassNamesByProjectTag = (tag: ProjectTag) => {
  switch (tag) {
    case 'monorepo':
      return 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200'
    case 'multirepo':
      return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
    default:
      return ''
  }
}
