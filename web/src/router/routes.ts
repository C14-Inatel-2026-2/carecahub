export const appRoutes = {
  home: '/',
  login: '/login',
  users: '/users',
  mentors: '/mentors',
  projects: '/projects',
  myProject: '/my-project',
  notifications: '/notifications',
  createMyProject: '/my-project/create',
  groups: '/groups',
  profile: '/profile',
  settings: '/settings',
} as const satisfies Record<string, `/${string}`>

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes]

export const profileRoute = (githubUsername: string) =>
  `${appRoutes.profile}/${encodeURIComponent(githubUsername)}`

export const projectDetailsRoute = (projectId: string) =>
  `${appRoutes.projects}/${encodeURIComponent(projectId)}`
