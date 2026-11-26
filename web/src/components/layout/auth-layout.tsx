import { Bell, CircleUserRound, Menu } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useGet, useList } from "@/api";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserAccountMenu } from "@/components/layout/user-account-menu";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { type AppRoute, appRoutes } from "@/router/routes";
import { isMockAPIEnabled } from "@/mocks/config";
import { useUser } from "@/stores/use-user";
import type { UserRole } from "@/types/user";

const commonPages = [
  appRoutes.home,
  appRoutes.profile,
  appRoutes.settings,
  appRoutes.notifications,
  appRoutes.activities,
] satisfies AppRoute[];

type ScrollMetrics = Pick<
  HTMLElement,
  "clientHeight" | "scrollHeight" | "scrollTop"
>;

export function shouldShowScrollFade({
  clientHeight,
  scrollHeight,
  scrollTop,
}: ScrollMetrics) {
  return (
    scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 1
  );
}

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
  const isStudentGroupDelivery =
    role === "student" && /^\/activities\/[^/]+\/groups\/[^/]+$/.test(pathname);
  const isStudentProjectDetails =
    role === "student" && /^\/projects\/[^/]+(?:\/customize)?$/.test(pathname);

  return (
    !isStudentGroupDelivery &&
    (isAllowedPath(pathname, pagesByRole[role]) || isStudentProjectDetails)
  );
}

export function AuthLayout() {
  const { user, isLoading, loadUser } = useUser();
  const { pathname } = useLocation();
  const contentPanelRef = useRef<HTMLDivElement>(null);
  const [showScrollFade, setShowScrollFade] = useState(false);
  const { unreadCount } = useList({
    endpoint: "/notifications",
    params: { skip: 0, take: 100 },
    disabled: isMockAPIEnabled,
  });
  const { data: currentUser } = useGet("/users/:id", user?.id);
  const avatarUrl = currentUser?.gitHubDetails?.avatarUrl;

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

  useEffect(() => {
    const panel = contentPanelRef.current;
    if (!panel) return;

    const updateScrollFade = () =>
      setShowScrollFade(shouldShowScrollFade(panel));
    updateScrollFade();
    panel.addEventListener("scroll", updateScrollFade, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollFade);
    resizeObserver.observe(panel);
    if (panel.firstElementChild)
      resizeObserver.observe(panel.firstElementChild);

    const mutationObserver = new MutationObserver(updateScrollFade);
    mutationObserver.observe(panel, { childList: true, subtree: true });

    return () => {
      panel.removeEventListener("scroll", updateScrollFade);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

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
      <AppSidebar user={user} avatarUrl={avatarUrl} />
      <SidebarInset className="flex h-svh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background p-2 md:pl-0">
        <header
          data-slot="mobile-navigation-header"
          className="flex h-14 shrink-0 items-center gap-3 rounded-lg bg-card px-3 text-card-foreground shadow-sm ring-1 ring-border md:hidden"
        >
          <SidebarTrigger
            aria-label="Abrir menu"
            className="size-9 [&_svg]:size-5 shrink-0"
          >
            <Menu />
          </SidebarTrigger>
          <div className="ml-auto flex items-center gap-1">
            <Button
              aria-label="Ver notificações"
              className="relative"
              render={<Link to={appRoutes.notifications} />}
              size="icon-lg"
              variant="ghost"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span
                  aria-label={`${unreadCount} notificações não lidas`}
                  className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-highlight ring-2 ring-card"
                />
              )}
            </Button>
            <UserAccountMenu
              user={user}
              trigger={
                <Button
                  aria-label="Abrir menu da conta"
                  size="icon-lg"
                  variant="ghost"
                >
                  {avatarUrl ? (
                    <img
                      alt={user.name}
                      className="size-6 rounded-full object-cover"
                      src={avatarUrl}
                    />
                  ) : (
                    <CircleUserRound className="size-6" />
                  )}
                </Button>
              }
            />
          </div>
        </header>
        <div
          data-slot="app-content-panel"
          className="relative mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-sidebar text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border md:mt-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at bottom right, color-mix(in srgb, var(--highlight) 25%, transparent), transparent 70%)",
          }}
        >
          <div
            ref={contentPanelRef}
            data-slot="app-content-scroll-viewport"
            className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
          >
            <Outlet />
          </div>
          {showScrollFade && (
            <div
              aria-hidden="true"
              data-slot="app-content-scroll-fade"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,hsl(var(--sidebar))_20%,transparent_72%)]"
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
