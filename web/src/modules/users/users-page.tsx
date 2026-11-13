import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useList } from '@/api'
import { type ColumnDef, DataTable } from '@/components/data-table'
import { Input } from '@/components/ui/input'
import { isMockAPIEnabled } from '@/mocks/config'
import { mockUsers } from '@/mocks/users'
import { profileRoute } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import type { User } from '@/types/user'
import { UserAnalyticsCards } from './components/user-analytics-cards'
import { CreateUserDialog } from './dialogs/create-user-dialog'
import { useUserAnalytics } from './use-user-analytics'
import { UserActions } from './user-actions'
import { userColumns } from './user-columns'

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
    ...userColumns.slice(0, 2),
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
    ...userColumns.slice(2),
    {
      header: 'Ações',
      accessorKey: 'actions',
      sortable: false,
      className: 'w-20 text-right',
      cell: (listedUser) =>
        user?.role === 'admin' && (
          <UserActions
            user={listedUser}
            label='usuário'
            requesterRole={user.role}
            onUpdated={refreshUsers}
          />
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
