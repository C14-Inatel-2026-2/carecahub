import type { CSSProperties } from "react";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
// import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { type AppRoute, appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import type { UserRole } from "@/types/user";

const commonPages = [
  appRoutes.home,
  appRoutes.profile,
  appRoutes.settings,
] satisfies AppRoute[];

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
  student: [...commonPages],
};

export function AuthLayout() {
  const { user, isLoading, loadUser } = useUser();
  const { pathname } = useLocation();

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <main className="grid min-h-svh place-items-center">Carregando…</main>
    );
  }

  if (!user) {
    toast.error("Você precisa estar logado para acessar esta página");
    return <Navigate to={appRoutes.login} />;
  }

  const allowedPages = pagesByRole[user.role];
  const isAllowedPage = allowedPages.includes(pathname as AppRoute);
  if (!isAllowedPage) {
    toast.error("Você não tem permissão para acessar esta página");
    return <Navigate to={appRoutes.home} />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "19rem" } as CSSProperties}>
      <AppSidebar user={user} />
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/30">
        {/* <AppHeader user={user} /> */}
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
