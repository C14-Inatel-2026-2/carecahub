export const appRoutes = {
  home: '/',
  login: '/login',
  users: '/users',
  mentors: '/mentors',
  projects: '/projects',
  myProject: '/my-project',
  createMyProject: '/my-project/create',
  groups: '/groups',
  profile: '/profile',
  settings: '/settings',
} as const satisfies Record<string, `/${string}`>

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes]

export const profileRoute = (githubUsername: string) =>
  `${appRoutes.profile}/${encodeURIComponent(githubUsername)}`
