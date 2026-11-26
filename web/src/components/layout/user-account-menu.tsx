import type { ReactElement } from 'react'
import { KeyRound, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { writer } from '@/api/writer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logoutMockUser } from '@/mocks/auth'
import { isMockAPIEnabled } from '@/mocks/config'
import { ChangePasswordDialog } from '@/modules/auth/dialogs/change-password-dialog'
import { appRoutes } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import type { LoggedUser } from '@/types/auth'
import { ThemeSelector } from './theme-selector'

export function UserAccountMenu({
  user,
  trigger,
  align = 'end',
  side,
}: {
  user: LoggedUser
  trigger: ReactElement
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  const navigate = useNavigate()
  const clearUser = useUser((state) => state.clearUser)
  const [passwordOpen, setPasswordOpen] = useState(false)

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={trigger} />
        <DropdownMenuContent
          align={align}
          side={side}
          sideOffset={8}
          className='w-64 min-w-56 max-w-[calc(100vw-2rem)] p-1.5'
        >
          <DropdownMenuGroup className='mb-1 rounded-md bg-muted/50'>
            <DropdownMenuLabel className='px-2.5 py-3'>
              <span className='block truncate text-sm font-semibold text-foreground'>{user.name}</span>
              <span
                className='mt-1 block truncate text-xs font-normal text-muted-foreground'
                title={user.email}
              >
                {user.email}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem
            className='min-h-9 gap-2.5 px-2.5 font-normal'
            render={<Link to={appRoutes.profile} />}
          >
            <UserRound className='text-muted-foreground' />
            Meu perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            className='min-h-9 gap-2.5 px-2.5 font-normal'
            onClick={() => setPasswordOpen(true)}
          >
            <KeyRound className='text-muted-foreground' />
            Alterar senha
          </DropdownMenuItem>
          <ThemeSelector />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            className='min-h-9 gap-2.5 px-2.5 font-normal'
            onClick={() => void logout()}
          >
            <LogOut />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  )
}
