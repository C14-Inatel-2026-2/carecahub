import { Badge } from '@/components/ui/badge'
import type { Activity } from '@/types/activity'
import { activityStatusLabels, getActivityStatus } from '../activity-helpers'

export function ActivityStatusBadge({
  activity,
}: {
  activity: Pick<Activity, 'dueDate' | 'allowLateSubmissions'>
}) {
  const status = getActivityStatus(activity)
  const variant = status === 'open' ? 'default' : status === 'late' ? 'secondary' : 'outline'
  return <Badge variant={variant}>{activityStatusLabels[status]}</Badge>
}
