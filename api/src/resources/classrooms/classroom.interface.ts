import type { ServiceOutput } from '@/types'

export type ClassroomSummary = {
  id: string
  name: string
  semester: string
  archivedAt: Date | null
  studentsCount: number
  groupsCount: number
  projectsCount: number
  deliveryRate: number
  commitsCount: number
}

export type ClassroomOption = Pick<ClassroomSummary, 'id' | 'name' | 'semester'>
export type ListClassroomOutput = ServiceOutput<{ totalCount: number; data: ClassroomSummary[] }>
export type GetClassroomOutput = ServiceOutput<ClassroomSummary>
