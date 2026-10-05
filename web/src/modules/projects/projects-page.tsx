import { useList } from '@/api'
import { isMockAPIEnabled } from '@/mocks/config'
import { mockGroups } from '@/mocks/groups'
import type { Group } from '@/types/group'
import type { Project } from '@/types/project'
import { GroupCard, ProjectCard } from './components/project-card'
import { ProjectsSkeleton } from './components/projects-skeleton'

function hasProject(group: Group): group is Group & { project: Project } {
  return group.project !== null && group.project !== undefined
}

export function ProjectsPage() {
  const { data: apiGroups, isLoading } = useList({
    endpoint: '/groups',
    params: { take: 100 },
    disabled: isMockAPIEnabled,
  })
  const groups = isMockAPIEnabled ? mockGroups : apiGroups
  const groupsWithProject = groups.filter(hasProject)
  const groupsWithoutProject = groups.filter((group) => !group.project)

  return (
    <section className='flex flex-1 flex-col w-full px-4 py-5 md:px-6 lg:px-8'>
      <h1 className='text-lg font-medium'>Projetos e grupos</h1>
      <p className='mt-0.5 text-xs text-muted-foreground'>
        Gerencie os projetos e grupos no CarecaHub.
      </p>

      <p className='w-full border border-gray-600 mt-7' />

      <div className='mt-7 flex flex-col gap-8'>
        {groupsWithProject.length > 0 && (
          <section>
            <h2 className='text-lg font-medium'>Projetos</h2>
            <div className='mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start'>
              {groupsWithProject.map((group) => (
                <ProjectCard key={group.id} group={group} project={group.project} />
              ))}
            </div>
          </section>
        )}

        {groupsWithoutProject.length > 0 && (
          <section>
            <h2 className='text-lg font-medium'>Grupos</h2>
            <div className='mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start'>
              {groupsWithoutProject.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </section>
        )}

        {!isMockAPIEnabled && isLoading && <ProjectsSkeleton />}
        {!isLoading && groups.length === 0 && (
          <p className='text-sm text-muted-foreground'>Nenhum grupo encontrado.</p>
        )}
      </div>
    </section>
  )
}
