import { Badge } from '@/components/ui/badge'
import { getBadgeClassNamesByGroupTag, getBadgeClassNamesByProjectTag } from '@/lib/badges'
import { cn } from '@/lib/utils'
import { type GroupTag, groupTagLabels } from '@/types/group'
import { type ProjectTag, projectTagLabels } from '@/types/project'

export function GroupBadge({ tag }: { tag: GroupTag }) {
  return (
    <Badge
      className={cn('mx-auto rounded-sm', getBadgeClassNamesByGroupTag(tag))}
      variant='default'
    >
      {groupTagLabels[tag]}
    </Badge>
  )
}

export function ProjectBadge({ tag }: { tag: ProjectTag }) {
  return (
    <Badge
      className={cn('mx-auto rounded-sm', getBadgeClassNamesByProjectTag(tag))}
      variant='default'
    >
      {projectTagLabels[tag]}
    </Badge>
  )
}
