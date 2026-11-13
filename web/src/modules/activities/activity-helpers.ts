import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Activity, Submission } from '@/types/activity'
import type { LoggedUser } from '@/types/auth'

/** Teachers and admins publish, edit, remove and grade activities. */
export function canManageActivities(user?: Pick<LoggedUser, 'role'>) {
  return user?.role === 'teacher' || user?.role === 'admin'
}

export type ActivityStatus = 'open' | 'late' | 'closed'

/**
 * - open: before the due date
 * - late: after the due date, but the teacher still accepts late submissions
 * - closed: after the due date and late submissions are not accepted
 */
export function getActivityStatus(
  activity: Pick<Activity, 'dueDate' | 'allowLateSubmissions'>,
  now = new Date()
): ActivityStatus {
  if (new Date(activity.dueDate).getTime() >= now.getTime()) return 'open'
  return activity.allowLateSubmissions ? 'late' : 'closed'
}

export const activityStatusLabels: Record<ActivityStatus, string> = {
  open: 'Aberta',
  late: 'Aceitando atrasos',
  closed: 'Encerrada',
}

/** A group can (re)submit while the activity accepts submissions and it was not graded yet. */
export function canSubmit(
  activity: Pick<Activity, 'dueDate' | 'allowLateSubmissions'>,
  submission?: Pick<Submission, 'gradedAt'> | null,
  now = new Date()
) {
  return getActivityStatus(activity, now) !== 'closed' && !submission?.gradedAt
}

export function formatDueDate(date: string) {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/** Converts an ISO date to the `YYYY-MM-DDTHH:mm` value used by `<input type="datetime-local">`. */
export function toDateTimeLocal(date: string) {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm")
}
