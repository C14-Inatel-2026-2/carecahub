import type { CSSProperties } from "react";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { type AppRoute, appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import type { UserRole } from "@/types/user";

const commonPages = [
  appRoutes.home,
  appRoutes.profile,
  appRoutes.settings,
  appRoutes.notifications,
] satisfies AppRoute[];

export function isAllowedPath(
  pathname: string,
  allowedPages: readonly string[],
) {
  return allowedPages.some(
    (page) =>
      pathname === page || (page !== "/" && pathname.startsWith(`${page}/`)),
  );
}

export const pagesByRole: Record<UserRole, AppRoute[]> = {
  admin: [
    ...commonPages,
    appRoutes.users,
    appRoutes.projects,
    appRoutes.groups,
  ],
  teacher: [
    ...commonPages,
    appRoutes.users,
    appRoutes.mentors,
    appRoutes.projects,
    appRoutes.groups,
  ],
  mentor: [
    ...commonPages,
    appRoutes.users,
    appRoutes.projects,
    appRoutes.groups,
  ],
  student: [...commonPages, appRoutes.myProject, appRoutes.createMyProject],
};

export function isAllowedPathForRole(pathname: string, role: UserRole) {
  const isStudentProjectDetails =
    role === "student" && /^\/projects\/[^/]+$/.test(pathname);

  return isAllowedPath(pathname, pagesByRole[role]) || isStudentProjectDetails;
}

export function AuthLayout() {
  const { user, isLoading, loadUser } = useUser();
  const { pathname } = useLocation();

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const isAllowedPage = isAllowedPathForRole(pathname, user?.role || "student");

  useEffect(() => {
    if (!isLoading && user && !isAllowedPage) {
      toast.error("Você não tem permissão para acessar esta página", {
        id: "page-access-denied",
      });
    }
  }, [isLoading, user, isAllowedPage]);

  if (isLoading) {
    return (
      <main className="grid min-h-svh place-items-center">Carregando…</main>
    );
  }

  if (!user) {
    return <Navigate to={appRoutes.login} replace />;
  }

  if (!isAllowedPage) {
    return <Navigate to={appRoutes.home} replace />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "19rem" } as CSSProperties}>
      <AppSidebar user={user} />
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/30">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
