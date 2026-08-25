import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/auth-layout";
import { LoginPage } from "../modules/auth/login-page";
import { UsersListPage } from "../modules/users/list-page";
import { appRoutes } from "./routes";

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
    ],
  },
  { path: "*", element: <Navigate to={appRoutes.login} replace /> },
]);
