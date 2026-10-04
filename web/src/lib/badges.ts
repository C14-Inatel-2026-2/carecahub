import type { GroupTag } from '@/types/group'
import type { ProjectTag } from '@/types/project'
import type { User } from '@/types/user'

export const getBadgeClassNamesByRole = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-500'
    case 'teacher':
      return 'bg-blue-500'
    case 'mentor':
      return 'bg-green-500'
    case 'student':
      return 'bg-yellow-500'
    default:
      return ''
  }
}

export const getBadgeClassNamesByGroupTag = (tag: GroupTag) => {
  switch (tag) {
    case 'full':
      return 'bg-green-500'
    case 'space_available':
      return 'bg-orange-300'
    case 'no_project':
      return 'bg-amber-500'
    default:
      return ''
  }
}

export const getBadgeClassNamesByProjectTag = (tag: ProjectTag) => {
  switch (tag) {
    case 'monorepo':
      return 'bg-cyan-500'
    case 'multirepo':
      return 'bg-indigo-500 text-white'
    default:
      return ''
  }
}
