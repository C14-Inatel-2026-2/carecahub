import { BookUser, Users, Boxes, User, CircleUserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { appRoutes } from "@/router/routes";
import type { LoggedUser } from "@/types/auth";
import { pagesByRole } from "./auth-layout";
import { toast } from "sonner";

export function AppSidebar({ user }: { user: LoggedUser }) {
  const location = useLocation();
  const usersLabel = user.role === "admin" ? "Usuários" : "Alunos";

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border/70">
      <SidebarHeader className="px-3 pt-3 pb-2 group-data-[collapsible=icon]:px-2">
        <div className="flex h-9 items-center gap-2.5 px-1">
          <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md">
            <img
              src="/carecahub.png"
              alt=""
              className="size-full object-contain"
            />
          </span>
          <span className="truncate text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden">
            CarecaHub
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <SidebarGroup className="pt-1">
          {/*<SidebarGroupLabel className="h-7 px-2 text-[11px] font-normal text-sidebar-foreground/50">
            Geral
          </SidebarGroupLabel>*/}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {pagesByRole[user.role].includes(appRoutes.users) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === appRoutes.users}
                    tooltip={usersLabel}
                    className="h-9 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent"
                    render={<Link to={appRoutes.users} />}
                  >
                    <BookUser />
                    <span>{usersLabel}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {pagesByRole[user.role].includes(appRoutes.mentors) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === appRoutes.mentors}
                    tooltip="Monitores"
                    className="h-9 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent"
                    render={<Link to={appRoutes.mentors} />}
                  >
                    <User />
                    <span>Monitores</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {pagesByRole[user.role].includes(appRoutes.groups) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === appRoutes.groups}
                    tooltip="Grupos"
                    className="h-9 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent"
                    render={<Link to={appRoutes.groups} />}
                  >
                    <Users />
                    <span>Grupos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {pagesByRole[user.role].includes(appRoutes.projects) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === appRoutes.projects}
                    tooltip="Projetos"
                    className="h-9 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent"
                    render={<Link to={appRoutes.projects} />}
                  >
                    <Boxes />
                    <span>Projetos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Meu Perfil"
                  className="h-9 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent"
                  onClick={() => toast("Indo para o seu perfil…")}
                >
                  <CircleUserRound />
                  <span>Meu Perfil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
