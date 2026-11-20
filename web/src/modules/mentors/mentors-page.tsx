import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useList } from '@/api'
import { type ColumnDef, DataTable } from '@/components/data-table'
import { Input } from '@/components/ui/input'
import { UserActions } from '@/modules/users/user-actions'
import { userColumns } from '@/modules/users/user-columns'
import { profileRoute } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import type { User } from '@/types/user'
import { CreateMentorDialog } from './dialogs/create-mentor-dialog'

export function MentorsPage() {
  const navigate = useNavigate()
  const user = useUser((state) => state.user)

  const {
    data: users,
    isLoading: isLoadingUsers,
    mutate,
  } = useList({
    endpoint: '/users',
    params: { take: 100, roles: 'mentor' },
    disabled: !user || user.role === 'student',
  })
  const [search, setSearch] = useState('')
  const columns: ColumnDef<User>[] = [
    ...userColumns,
    {
      header: 'Ações',
      accessorKey: 'actions',
      sortable: false,
      className: 'w-20 text-right',
      cell: (listedUser) =>
        user?.role === 'admin' && (
          <UserActions
            user={listedUser}
            label='monitor'
            requesterRole={user.role}
            onUpdated={() => void mutate()}
          />
        ),
    },
  ]

  return (
    <section className='w-full px-4 py-5 md:px-6 lg:px-8'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-lg font-medium'>Monitores</h1>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Gerencie as os monitores da disciplina dentro do CarecaHub.
          </p>
        </div>
        <div className='flex w-full items-center gap-2 sm:w-auto'>
          <label htmlFor='users-search' className='relative min-w-0 flex-1 sm:w-72 sm:flex-none'>
            <span className='sr-only'>Buscar monitores</span>
            <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-muted' />
            <Input
              id='users-search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className='pl-8'
              placeholder='Buscar monitores…'
            />
          </label>
          {user?.role === 'admin' && (
            <CreateMentorDialog requesterRole={user.role} onCreated={() => void mutate()} />
          )}
        </div>
      </div>

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
          emptyStateTitle={search ? 'Nenhum monitor encontrado' : 'Nenhum monitor'}
          emptyStateDescription={
            search ? 'Tente outro nome, e-mail ou função.' : 'Crie a primeira conta de monitor.'
          }
        />
      </div>
    </section>
  )
}
