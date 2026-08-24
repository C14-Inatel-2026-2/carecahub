import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/auth-layout'
import { LoginPage } from '../modules/auth/login-page'
import { PostDetailsPage } from '../modules/posts/details-page'
import { PostsListPage } from '../modules/posts/list-page'
import { UsersListPage } from '../modules/users/list-page'
import { appRoutes } from './routes'

export const router = createBrowserRouter([
  { path: appRoutes.login, Component: LoginPage },
  {
    Component: AuthLayout,
    children: [
      {
        path: appRoutes.users,
        children: [
          { index: true, Component: UsersListPage },
          // { path: ":id", Component: UsersPage },
          // { path: ":id/edit", Component: UsersPage },
        ],
      },
      {
        path: appRoutes.posts,
        children: [
          { index: true, Component: PostsListPage },
          { path: ':id', Component: PostDetailsPage },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={appRoutes.login} replace /> },
])
