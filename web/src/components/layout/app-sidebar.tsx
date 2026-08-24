import { FileText, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
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
} from '@/components/ui/sidebar'
import { appRoutes } from '@/router/routes'
import type { LoggedUser } from '@/types/auth'

export function AppSidebar({ user }: { user: LoggedUser }) {
  const location = useLocation()

  return (
    <Sidebar collapsible='icon' className='border-sidebar-border/70'>
      <SidebarHeader className='px-3 pt-3 pb-2 group-data-[collapsible=icon]:px-2'>
        <div className='flex h-9 items-center gap-2.5 px-1'>
          <span className='flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md'>
            <img src='/scoder.png' alt='' className='size-full object-contain' />
          </span>
          <span className='truncate text-sm font-medium tracking-tight group-data-[collapsible=icon]:hidden'>
            Scoder
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className='px-1'>
        <SidebarGroup className='pt-1'>
          {/*<SidebarGroupLabel className="h-7 px-2 text-[11px] font-normal text-sidebar-foreground/50">
            Geral
          </SidebarGroupLabel>*/}
          <SidebarGroupContent>
            <SidebarMenu className='gap-0.5'>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === appRoutes.posts}
                  tooltip='Publicações'
                  className='h-9 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent'
                  render={<Link to={appRoutes.posts} />}
                >
                  <FileText />
                  <span>Publicações</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === appRoutes.users}
                    tooltip='Usuários'
                    className='h-9 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent'
                    render={<Link to={appRoutes.users} />}
                  >
                    <Users />
                    <span>Usuários</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
