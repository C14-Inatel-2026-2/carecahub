export const appRoutes = {
  home: "/",
  login: "/login",
  users: "/users",
  mentors: "/mentors",
  projects: "/projects",
  groups: "/groups",
  profile: "/profile",
  settings: "/settings",
} as const satisfies Record<string, `/${string}`>;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];
