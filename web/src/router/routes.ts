export const appRoutes = {
  home: "/",
  login: "/login",
  users: "/users",
  projects: "/projects",
  groups: "/groups",
  profile: "/profile",
  settings: "/settings",
} as const satisfies Record<string, `/${string}`>;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];
