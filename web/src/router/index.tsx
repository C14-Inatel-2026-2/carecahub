import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/auth-layout";
import { LoginPage } from "../modules/auth/login-page";
import { UsersPage } from "../modules/users/users-page";
import { ProjectsPage } from "../modules/projects/projects-page";
import { appRoutes } from "./routes";
import { GroupsPage } from "@/modules/groups/groups-page";
import { MentorsPage } from "@/modules/mentors/mentors-page";
import { HomePage } from "@/modules/home/home-page";
import { ProfilePage } from "@/modules/profile/profile-page";

export const router = createBrowserRouter([
  { path: appRoutes.login, Component: LoginPage },
  {
    Component: AuthLayout,
    children: [
      {
        path: appRoutes.home,
        children: [{ index: true, Component: HomePage }],
      },
      {
        path: appRoutes.users,
        children: [{ index: true, Component: UsersPage }],
      },
      {
        path: appRoutes.mentors,
        children: [{ index: true, Component: MentorsPage }],
      },
      {
        path: appRoutes.projects,
        children: [{ index: true, Component: ProjectsPage }],
      },
      {
        path: appRoutes.groups,
        children: [{ index: true, Component: GroupsPage }],
      },
      {
        path: appRoutes.profile,
        children: [{ index: true, Component: ProfilePage }],
      },
    ],
  },
  { path: "*", element: <Navigate to={appRoutes.login} replace /> },
]);
