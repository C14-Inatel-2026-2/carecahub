export type Dashboard = {
  metrics: {
    students: number
    groups: number
    projects: number
    repositories: number
  }
  commitsByDay: Array<{ date: string; count: number }>
  commitsByClassroom: Array<{ classroom: string; count: number }>
  projectRanking: Array<{
    projectId: string
    projectName: string
    commitCount: number
  }>
  githubDataComplete: boolean
}
