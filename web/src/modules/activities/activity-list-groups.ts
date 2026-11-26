import type { Activity } from '@/types/activity'

export type StudentActivitySection = 'todo' | 'overdue' | 'submitted'

export type ActivityDateGroup = {
  date: string
  label: string
  activities: Activity[]
}

export type StudentActivitySections = Record<StudentActivitySection, ActivityDateGroup[]>

function getDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function getDateLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getSection(activity: Activity, now: Date): StudentActivitySection {
  if (activity.submission) return 'submitted'
  return new Date(activity.dueAt) < now ? 'overdue' : 'todo'
}

export function getActivitiesByDueDate(activities: Activity[]): ActivityDateGroup[] {
  const groups: ActivityDateGroup[] = []

  for (const activity of [...activities].sort(
    (first, second) => new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime()
  )) {
    const dueAt = new Date(activity.dueAt)
    const date = getDateKey(dueAt)
    const previousGroup = groups.at(-1)

    if (previousGroup?.date === date) {
      previousGroup.activities.push(activity)
      continue
    }

    groups.push({ date, label: getDateLabel(dueAt), activities: [activity] })
  }

  return groups
}

export function getStudentActivitySections(
  activities: Activity[],
  now = new Date()
): StudentActivitySections {
  return {
    todo: getActivitiesByDueDate(activities.filter((activity) => getSection(activity, now) === 'todo')),
    overdue: getActivitiesByDueDate(
      activities.filter((activity) => getSection(activity, now) === 'overdue')
    ),
    submitted: getActivitiesByDueDate(
      activities.filter((activity) => getSection(activity, now) === 'submitted')
    ),
  }
}

export function getNextStudentActivitySectionUpdate(activities: Activity[], now: Date) {
  const nextDueAt = activities
    .filter((activity) => !activity.submission)
    .map((activity) => new Date(activity.dueAt).getTime())
    .filter((dueAt) => dueAt >= now.getTime())
    .sort((first, second) => first - second)[0]

  return nextDueAt === undefined ? null : new Date(nextDueAt + 1)
}
