import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import type { User } from '@/types/user'
import { UserCard, UserCardMenuItems } from './user-card'

const member: User = {
  id: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb',
  groupId: '9db4a18e-1341-4899-a62b-49c0d92bdd3a',
  name: 'Student',
  registration: 1234,
  githubName: 'student',
  classroom: 'A1',
  email: 'student@example.com',
  role: 'student',
  status: 'active',
  twoFactor: false,
  createdAt: '2026-09-30T12:00:00.000Z',
  updatedAt: '2026-09-30T12:00:00.000Z',
}

describe('UserCard actions', () => {
  it('places an accessible options button in the card', () => {
    const html = renderToStaticMarkup(<UserCard user={member} onViewProfile={vi.fn()} />)

    expect(html).toContain('aria-label="Opções para Student"')
    expect(html).toContain('lucide-ellipsis-vertical')
  })

  it('offers profile viewing, leader promotion and member removal with their icons', () => {
    const html = renderToStaticMarkup(
      <DropdownMenu>
        <UserCardMenuItems onViewProfile={vi.fn()} onPromote={vi.fn()} onRemove={vi.fn()} />
      </DropdownMenu>
    )

    expect(html).toContain('Visualizar perfil')
    expect(html).toContain('lucide-eye')
    expect(html).toContain('Promover a líder')
    expect(html).toContain('lucide-user-star')
    expect(html).toContain('Remover membro')
    expect(html).toContain('lucide-trash-2')
  })

  it('hides promotion when the requester cannot promote and disables a missing profile', () => {
    const html = renderToStaticMarkup(
      <DropdownMenu>
        <UserCardMenuItems />
      </DropdownMenu>
    )

    expect(html).toContain('Visualizar perfil')
    expect(html).toContain('disabled')
    expect(html).not.toContain('Promover a líder')
    expect(html).not.toContain('Remover membro')
  })
})
