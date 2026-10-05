import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from '@/components/ui/dialog'
import type { User } from '@/types/user'
import { InviteUserCard } from '../components/invite-user-card'
import { InviteCandidateRow, InviteUserDialogPanel } from './invite-user-dialog'

const candidate: User = {
  id: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb',
  groupId: null,
  name: 'Available Student',
  registration: 1234,
  githubName: 'available-student',
  classroom: 'A1',
  email: 'student@example.com',
  role: 'student',
  status: 'active',
  twoFactor: false,
  createdAt: '2026-09-30T12:00:00.000Z',
  updatedAt: '2026-09-30T12:00:00.000Z',
}

describe('InviteUserDialog', () => {
  it('uses an accessible button as the invitation entry point', () => {
    const html = renderToStaticMarkup(<InviteUserCard />)

    expect(html).toMatch(/<button/)
    expect(html).toContain('aria-label="Convidar integrante"')
    expect(html).toContain('Convidar integrante')
  })

  it('renders the dialog guidance and search control', () => {
    const html = renderToStaticMarkup(
      <Dialog open>
        <InviteUserDialogPanel
          search=''
          onSearchChange={vi.fn()}
          candidates={[]}
          isLoading={false}
          invitingId={null}
          onInvite={vi.fn()}
        />
      </Dialog>
    )

    expect(html).toContain('Convidar integrante')
    expect(html).toContain('Busque entre os alunos disponíveis para projetos.')
    expect(html).toContain('Buscar por nome, e-mail ou GitHub')
  })

  it('renders candidate identity and invite action', () => {
    const html = renderToStaticMarkup(
      <InviteCandidateRow candidate={candidate} isInviting={false} onInvite={vi.fn()} />
    )

    expect(html).toContain('Available Student')
    expect(html).toContain('student@example.com')
    expect(html).toContain('available-student')
    expect(html).toContain('Convidar')
  })

  it('renders the candidate GitHub avatar when available', () => {
    const html = renderToStaticMarkup(
      <InviteCandidateRow
        candidate={{
          ...candidate,
          gitHubDetails: {
            login: 'available-student',
            avatarUrl: 'https://avatars.githubusercontent.com/u/1234',
            profileUrl: 'https://github.com/available-student',
            bio: null,
            createdAt: '2020-01-01T00:00:00.000Z',
            publicRepos: 10,
          },
        }}
        isInviting={false}
        onInvite={vi.fn()}
      />
    )

    expect(html).toContain('src="https://avatars.githubusercontent.com/u/1234"')
    expect(html).toContain('alt="Available Student"')
    expect(html).not.toContain('lucide-circle-user-round')
  })

  it('renders the highlighted user icon when the candidate has no GitHub avatar', () => {
    const html = renderToStaticMarkup(
      <InviteCandidateRow candidate={candidate} isInviting={false} onInvite={vi.fn()} />
    )

    expect(html).toContain('lucide-circle-user-round')
    expect(html).toContain('text-highlight-soft-foreground')
  })
})
