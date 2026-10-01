export type DashboardMetricTotals = {
  students: number
  groups: number
  projects: number
  repositories: number
}

export type DashboardCommitByDay = { date: string; count: number }
export type DashboardCommitByClassroom = { classroom: string; count: number }
export type DashboardProjectRankingItem = {
  projectId: string
  projectName: string
  commitCount: number
}

export type GetDashboardDto = {
  metrics: DashboardMetricTotals
  commitsByDay: DashboardCommitByDay[]
  commitsByClassroom: DashboardCommitByClassroom[]
  projectRanking: DashboardProjectRankingItem[]
  githubDataComplete: boolean
}
