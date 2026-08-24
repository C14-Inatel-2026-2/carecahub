export const appRoutes = {
  home: '/',
  login: '/login',
  posts: '/posts',
  postDetails: '/posts/:id',
  users: '/users',
  profile: '/profile',
  settings: '/settings',
} as const satisfies Record<string, `/${string}`>

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes]

export function postPath(id: string) {
  return appRoutes.postDetails.replace(':id', id)
}
