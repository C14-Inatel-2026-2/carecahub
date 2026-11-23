import { Box } from 'lucide-react'
import { Link } from 'react-router-dom'
import { activityGroupDeliveryRoute } from '@/router/routes'
import type { GroupRow } from '@/types/activity'

export function GroupPipelineRow({ activityId, group }: { activityId: string; group: GroupRow }) {
  const { project } = group

  return (
    <Link
      className='block rounded border text-sm transition-colors hover:bg-muted/60'
      style={project?.mainColor ? { borderColor: `${project.mainColor}66` } : undefined}
      to={activityGroupDeliveryRoute(activityId, group.group.id)}
    >
      <article className='p-3'>
        <div className='flex min-w-0 items-center gap-2'>
          {project?.iconUrl ? (
            <img
              alt=''
              className='size-8 shrink-0 rounded-full object-cover'
              src={project.iconUrl}
            />
          ) : (
            <Box className='size-8 shrink-0 text-highlight-soft-foreground' />
          )}
          <div className='min-w-0'>
            <p className='truncate font-medium'>
              {project ? project.projectName : group.group.friendlyId}
            </p>
            {project && (
              <p className='truncate text-xs text-muted-foreground'>{group.group.friendlyId}</p>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
