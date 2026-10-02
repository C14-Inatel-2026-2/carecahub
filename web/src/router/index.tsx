import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GroupsPage } from '@/modules/groups/groups-page'
import { HomePage } from '@/modules/home/home-page'
import { MentorsPage } from '@/modules/mentors/mentors-page'
import { MyProfilePage } from '@/modules/my-profile/my-profile-page'
import { CreateProjectPage } from '@/modules/my-project/create-project-page'
import { MyProjectPage } from '@/modules/my-project/my-project-page'
import { NotificationsPage } from '@/modules/notifications/notifications-page'
import { ProfilePage } from '@/modules/profile/profile-page'
import { AuthLayout } from '../components/layout/auth-layout'
import { LoginPage } from '../modules/auth/login-page'
import { ProjectsPage } from '../modules/projects/projects-page'
import { UsersPage } from '../modules/users/users-page'
import { appRoutes } from './routes'

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
        children: [{ index: true, Component: MyProfilePage }],
      },
      {
        path: appRoutes.notifications,
        children: [{ index: true, Component: NotificationsPage }],
      },
      {
        path: appRoutes.myProject,
        children: [{ index: true, Component: MyProjectPage }],
      },
      {
        path: appRoutes.createMyProject,
        children: [{ index: true, Component: CreateProjectPage }],
      },
      {
        path: `${appRoutes.profile}/:githubUsername`,
        Component: ProfilePage,
      },
    ],
  },
  { path: '*', element: <Navigate to={appRoutes.login} replace /> },
])
