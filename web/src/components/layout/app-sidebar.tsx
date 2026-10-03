import {
  Bell,
  BookUser,
  Box,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Home,
  KeyRound,
  LogOut,
  User,
  UserRound,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useList } from '@/api'
import { writer } from '@/api/writer'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { logoutMockUser } from '@/mocks/auth'
import { isMockAPIEnabled } from '@/mocks/config'
import { ChangePasswordDialog } from '@/modules/auth/dialogs/change-password-dialog'
import { appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import type { LoggedUser } from '@/types/auth'
import { userRoleLabels } from '@/types/user'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { pagesByRole } from './auth-layout'
import { ThemeSelector } from './theme-selector'

export function NotificationNavLabel({ unreadCount }: { unreadCount: number }) {
  return (
    <>
      <span className='group-data-[collapsible=icon]:hidden'>Notificações</span>
      {unreadCount > 0 && (
        <span
          aria-label={`${unreadCount} notificações não lidas`}
          className='ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-xs text-primary-foreground group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-0'
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </>
  )
}

export function AppSidebar({ user }: { user: LoggedUser }) {
  const location = useLocation()
  const { state, toggleSidebar } = useSidebar()
  const usersLabel = user.role === 'admin' ? 'Usuários' : 'Alunos'
  const navigate = useNavigate()
  const clearUser = useUser((state) => state.clearUser)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const { unreadCount } = useList({
    endpoint: '/notifications',
    params: { skip: 0, take: 100 },
    disabled: isMockAPIEnabled,
  })

  async function logout() {
    if (isMockAPIEnabled) {
      logoutMockUser(localStorage)
    } else {
      await writer('POST /auth/logout', { body: undefined, silent: true })
    }
    clearUser()
    navigate(appRoutes.login, { replace: true })
  }

  return (
    <Sidebar variant='floating' collapsible='icon' className='border-sidebar-border/70'>
      <Button
        type='button'
        variant='default'
        size='icon'
        aria-label={state === 'expanded' ? 'Recolher menu' : 'Expandir menu'}
        className='absolute top-9 right-1.5 z-20 hidden translate-x-1/2 rounded-lg border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm after:absolute after:-inset-2 after:rounded-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:translate-y-0! md:inline-flex'
        onClick={toggleSidebar}
      >
        {state === 'expanded' ? <ChevronLeft /> : <ChevronRight />}
      </Button>
      <SidebarHeader className='px-3 pt-3 pb-2 group-data-[collapsible=icon]:px-3'>
        <div className='flex h-16 items-center gap-2.5 px-1'>
          <span className='flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md'>
            <img src='/carecahub.png' alt='' className='size-full object-contain' />
          </span>
          <span className='truncate text-base font-medium tracking-tight group-data-[collapsible=icon]:hidden'>
            CarecaHub
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className='px-4 pt-2 group-data-[collapsible=icon]:px-5'>
        <SidebarMenu className='gap-0.5'>
          {pagesByRole[user.role].includes(appRoutes.home) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.pathname === appRoutes.home}
                tooltip='Início'
                className='h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
                render={<Link to={appRoutes.home} />}
              >
                <Home />
                <span>Início</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {pagesByRole[user.role].includes(appRoutes.users) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.pathname === appRoutes.users}
                tooltip={usersLabel}
                className='h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
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
                tooltip='Monitores'
                className='h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
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
                tooltip='Grupos'
                className='h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
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
                tooltip='Projetos'
                className='h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
                render={<Link to={appRoutes.projects} />}
              >
                <Boxes />
                <span>Projetos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {pagesByRole[user.role].includes(appRoutes.myProject) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={location.pathname === appRoutes.myProject}
                tooltip='Projeto'
                className='h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
                render={<Link to={appRoutes.myProject} />}
              >
                <Box />
                <span>Projeto</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={location.pathname === appRoutes.notifications}
              tooltip='Notificações'
              className='relative h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
              render={<Link to={appRoutes.notifications} />}
            >
              <Bell />
              <NotificationNavLabel unreadCount={unreadCount} />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip='Meu Perfil'
              className='h-12 px-2.5 font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground data-active:bg-sidebar-accent/70 data-active:font-normal data-active:text-sidebar-accent-foreground [&>svg]:text-icon-muted data-active:[&>svg]:text-icon-accent [&_svg]:size-6 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-10!'
              render={<Link to={appRoutes.profile} />}
            >
              <UserRound />
              <span>Meu Perfil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator className='w-[15.3rem]! mx-auto group-data-[collapsible=icon]:w-12!' />
      <SidebarFooter className='px-4 pt-3 pb-2 group-data-[collapsible=icon]:px-1'>
        <div className='flex flex-wrap items-center justify-start gap-2 py-2 text-sm group-data-[collapsible=icon]:justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size='xl'
                  variant='ghost'
                  className='font-normal group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-0!'
                />
              }
            >
              <CircleUserRound className='size-8' />
              <div className='hidden flex-col items-start gap-1 leading-tight sm:flex group-data-[collapsible=icon]:hidden!'>
                <span className='text-xs uppercase text-muted-foreground'>
                  {userRoleLabels[user.role]}
                </span>
                <span className='text-sm font-semibold'>{user.name}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-56'>
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <span className='block text-foreground'>{user.name}</span>
                  <span className='block font-normal'>{user.email}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <ThemeSelector />
              <DropdownMenuSeparator />
              <DropdownMenuItem className='font-normal' onClick={() => setPasswordOpen(true)}>
                <KeyRound />
                Alterar senha
              </DropdownMenuItem>
              <DropdownMenuItem className='font-normal' onClick={() => void logout()}>
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
