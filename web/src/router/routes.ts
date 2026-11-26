export const appRoutes = {
  home: "/",
  login: "/login",
  register: "/register",
  users: "/users",
  mentors: "/mentors",
  projects: "/projects",
  myProject: "/my-project",
  notifications: "/notifications",
  createMyProject: "/my-project/create",
  groups: "/groups",
  profile: "/profile",
  settings: "/settings",
  activities: "/activities",
  createActivity: "/activities/new",
} as const satisfies Record<string, `/${string}`>;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];

export const profileRoute = (githubUsername: string) =>
  `${appRoutes.profile}/${encodeURIComponent(githubUsername)}`;

export const projectDetailsRoute = (projectName: string) =>
  `${appRoutes.projects}/${encodeURIComponent(projectName)}`;

export const projectCustomizeRoute = (projectName: string) =>
  `${projectDetailsRoute(projectName)}/customize`;

export const activityDetailsRoute = (activityId: string) =>
  `${appRoutes.activities}/${encodeURIComponent(activityId)}`;

export const activityGroupDeliveryRoute = (
  activityId: string,
  groupId: string,
) =>
  `${activityDetailsRoute(activityId)}/groups/${encodeURIComponent(groupId)}`;
