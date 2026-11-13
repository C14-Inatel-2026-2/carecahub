import type { ColumnDef } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { getBadgeClassNamesByRole } from '@/lib/badges'
import { cn } from '@/lib/utils'
import { type User, userRoleLabels } from '@/types/user'

export const userColumns: ColumnDef<User>[] = [
  {
    header: 'Nome',
    accessorKey: 'name',
    sortable: true,
    cell: (user) => <span className='font-medium text-foreground'>{user.name}</span>,
  },
  { header: 'E-mail', accessorKey: 'email', sortable: true },
  {
    header: 'Função',
    accessorKey: 'role',
    sortable: false,
    className: 'w-32',
    cell: (user) => (
      <Badge className={cn('mx-auto', getBadgeClassNamesByRole(user.role))} variant='default'>
        {userRoleLabels[user.role]}
      </Badge>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'status',
    sortable: false,
    className: 'w-28',
    cell: (user) => (
      <span className='inline-flex items-center gap-2 text-xs'>
        <span
          className={`size-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
        />
        {user.status === 'active' ? 'Ativo' : 'Inativo'}
      </span>
    ),
  },
]
