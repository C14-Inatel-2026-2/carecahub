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
import { profileRoute } from '@/router/routes'
import { useUser } from '@/stores/use-user'
import { type User, userRoleLabels } from '@/types/user'
import { CreateMentorDialog } from './dialogs/create-mentor-dialog'
import { DeleteUserDialog } from './dialogs/delete-mentor-dialog'
import { EditUserDialog } from './dialogs/edit-mentor-dialog'

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
    {
      header: 'Nome',
      accessorKey: 'name',
      sortable: true,
      cell: (listedUser) => <span className='font-medium text-foreground'>{listedUser.name}</span>,
    },
    { header: 'E-mail', accessorKey: 'email', sortable: true },
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
          <UserActions
            user={listedUser}
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
            Editar monitor
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Excluir monitor
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
