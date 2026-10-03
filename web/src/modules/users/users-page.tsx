import { Ellipsis, Pencil, Search, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useList } from '@/api'
import { type ColumnDef, DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { getBadgeClassNamesByRole } from '@/lib/badges'
import { cn } from '@/lib/utils'
import { isMockAPIEnabled } from '@/mocks/config'
import { mockUsers } from '@/mocks/users'
import { profileRoute } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { type User, userRoleLabels } from '@/types/user'
import { UserAnalyticsCards } from './components/user-analytics-cards'
import { CreateUserDialog } from './dialogs/create-user-dialog'
import { DeleteUserDialog } from './dialogs/delete-user-dialog'
import { EditUserDialog } from './dialogs/edit-user-dialog'
import { useUserAnalytics } from './use-user-analytics'

export function UsersPage() {
  const navigate = useNavigate()
  const user = useUser((state) => state.user)
  const isAdmin = user?.role === 'admin'

  const getVisibleRoles = (role: User['role'] | undefined) => {
    switch (role) {
      case 'admin':
        return ['admin', 'teacher', 'mentor', 'student']
      case 'teacher':
        return ['student']
      case 'mentor':
        return ['student']
      default:
        return []
    }
  }

  const {
    data: apiUsers,
    isLoading: isLoadingApiUsers,
    mutate,
  } = useList({
    endpoint: '/users',
    params: { take: 100, roles: getVisibleRoles(user?.role) },
    disabled: isMockAPIEnabled || !user || user.role === 'student',
  })

  const {
    data: userAnalytics,
    error: userAnalyticsError,
    isLoading: isLoadingUserAnalytics,
    mutate: mutateUserAnalytics,
  } = useUserAnalytics(isAdmin)

  const users = isMockAPIEnabled
    ? mockUsers.filter((mockUser) => getVisibleRoles(user?.role).includes(mockUser.role))
    : apiUsers
  const isLoadingUsers = isMockAPIEnabled ? false : isLoadingApiUsers
  const refreshUsers = () => {
    if (!isMockAPIEnabled) void mutate()
    if (isAdmin) void mutateUserAnalytics()
  }

  const [search, setSearch] = useState('')
  const columns: ColumnDef<User>[] = [
    {
      header: 'Nome',
      accessorKey: 'name',
      sortable: true,
      cell: (listedUser) => <span className='font-medium text-foreground'>{listedUser.name}</span>,
    },
    { header: 'E-mail', accessorKey: 'email', sortable: true },
    {
      header: 'Matrícula',
      accessorKey: 'registration',
      sortable: true,
      cell: (listedUser) => (
        <span className='font-medium text-foreground'>{listedUser.registration || '—'}</span>
      ),
    },
    {
      header: 'Turma',
      accessorKey: 'classroom',
      sortable: true,
      cell: (listedUser) => (
        <span className='font-medium text-foreground'>{listedUser.classroom || '—'}</span>
      ),
    },
    {
      header: 'Função',
      accessorKey: 'role',
      sortable: false,
      className: 'w-32',
      cell: (listedUser) => (
        <Badge
          className={cn('mx-auto', getBadgeClassNamesByRole(listedUser.role))}
          variant='default'
        >
          {userRoleLabels[listedUser.role]}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: false,
      className: 'w-28',
      cell: (listedUser) => (
        <span className='inline-flex items-center gap-2 text-xs'>
          <span
            className={`size-1.5 rounded-full ${listedUser.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
          />
          {listedUser.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessorKey: 'actions',
      sortable: false,
      className: 'w-20 text-right',
      cell: (listedUser) =>
        user?.role === 'admin' && (
          <UserActions user={listedUser} requesterRole={user.role} onUpdated={refreshUsers} />
        ),
    },
  ]

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-lg font-medium'>{user?.role === 'admin' ? 'Usuários' : 'Alunos'}</h1>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Gerencie {user?.role === 'admin' ? 'os usuários' : 'os alunos'} com acesso ao CarecaHub.
          </p>
        </div>
        <div className='flex w-full items-center gap-2 sm:w-auto'>
          <label htmlFor='users-search' className='relative min-w-0 flex-1 sm:w-72 sm:flex-none'>
            <span className='sr-only'>Buscar usuários</span>
            <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-muted' />
            <Input
              id='users-search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className='pl-8'
              placeholder='Buscar usuários…'
            />
          </label>
          {user?.role === 'admin' && (
            <CreateUserDialog requesterRole={user.role} onCreated={refreshUsers} />
          )}
        </div>
      </div>

      {isAdmin && (
        <UserAnalyticsCards
          data={userAnalytics}
          error={userAnalyticsError}
          isLoading={isLoadingUserAnalytics}
          onRetry={() => void mutateUserAnalytics()}
        />
      )}

      <div className='mt-5' aria-busy={isLoadingUsers}>
        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoadingUsers}
          searchValue={search}
          onSearchChange={setSearch}
          onRowClick={(listedUser) => {
            if (listedUser.githubName) {
              navigate(profileRoute(listedUser.githubName), {
                state: { user: listedUser },
              })
            }
          }}
          searchFunction={(listedUser, term) => {
            const query = term.toLocaleLowerCase()
            return [listedUser.name, listedUser.email, listedUser.role].some((value) =>
              value.toLocaleLowerCase().includes(query)
            )
          }}
          emptyStateIcon={<Users className='size-8 text-icon-muted' />}
          emptyStateTitle={search ? 'Nenhum usuário encontrado' : 'Nenhum usuário'}
          emptyStateDescription={
            search ? 'Tente outro nome, e-mail ou função.' : 'Crie a primeira conta de usuário.'
          }
        />
      </div>
    </section>
  )
}

function UserActions({
  user,
  requesterRole,
  onUpdated,
}: {
  user: User
  requesterRole: User['role']
  onUpdated: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className='flex justify-end'>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Ações para ${user.name}`}
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-44'>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Editar usuário
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Excluir usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        requesterRole={requesterRole}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={onUpdated}
      />
      <DeleteUserDialog
        user={user}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={onUpdated}
      />
    </div>
  )
}
