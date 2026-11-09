import {
  ArrowRight,
  Box,
  ChevronDown,
  Clock,
  EllipsisVertical,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  User,
  UserStar,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GitHubIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getFriendlyDate } from '@/lib/utils'
import { ChangeGroupLeaderDialog } from '@/modules/groups/dialogs/change-group-leader-dialog'
import { projectDetailsRoute } from '@/router/routes'
import type { Group } from '@/types/group'
import type { Project } from '@/types/project'
import { GroupBadge, ProjectBadge } from './project-badge'
import { ProjectThumbnail, projectAccentStyle } from './project-thumbnail'

export function ProjectCard({ group, project }: { group: Group; project: Project }) {
  const hasRepositories = project.repositories.length > 0

  return (
    <div
      className='h-full flex flex-col p-5 gap-2 bg-card rounded-sm shadow-lg/40 shadow-foreground/10 border border-border/70'
      style={projectAccentStyle(project.mainColor, '4px')}
    >
      <ProjectThumbnail project={project} />
      <div className='flex flex-row justify-start items-center w-fit gap-2 mt-2'>
        {group.tags && group.tags.map((tag) => <GroupBadge key={tag} tag={tag} />)}

        {project.tags && project.tags.map((tag) => <ProjectBadge key={tag} tag={tag} />)}
      </div>
      <div className='flex flex-row items-center justify-between gap-4 mt-2'>
        <div className='flex flex-row items-center gap-4'>
          {project.iconUrl ? (
            <img src={project.iconUrl} alt='' className='size-8 rounded-lg object-cover' />
          ) : (
            <Box className='size-8 text-highlight-soft-foreground' />
          )}
          <span>{project.projectName}</span>
        </div>
        <div className='flex flex-row max-w-40 gap-2 justify-start items-center text-muted-foreground'>
          <Clock className='size-6' />
          <span className='text-xs'>
            Ultima atualização {getFriendlyDate(new Date(group.updatedAt), 'dd/mm/yyyy - hh:mm')}
          </span>
        </div>
      </div>

      <dl className='grid grid-cols-2 w-fit gap-4 py-2'>
        <div className='flex items-center gap-2'>
          <GitCommitHorizontal className='size-5 text-muted-foreground' />
          <div>
            <dt className='text-xs text-muted-foreground'>Commits</dt>
            <dd className='text-sm font-medium'>{project.commitCount}</dd>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <GitBranch className='size-5 text-muted-foreground' />
          <div>
            <dt className='text-xs text-muted-foreground'>Branches</dt>
            <dd className='text-sm font-medium'>{project.branchCount}</dd>
          </div>
        </div>
      </dl>

      {hasRepositories && project.repositoryType === 'monorepo' && (
        <a
          href={project.repositories[0].url}
          target='_blank'
          rel='noreferrer'
          className='flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline mb-4'
        >
          <GitHubIcon className='size-4 shrink-0' />
          <span className='truncate'>{project.repositories[0].url}</span>
        </a>
      )}

      {hasRepositories && project.repositoryType === 'multirepo' && (
        <DropdownMenu>
          <DropdownMenuTrigger className='group flex w-full cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium mt-2 mb-2'>
            <div className='flex flex-row gap-3 items-center justify-start'>
              <FolderGit2 className='size-5' />
              <span>Repositórios ({project.repositories.length})</span>
            </div>
            <ChevronDown className='size-4 transition-transform group-data-popup-open:rotate-180' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            sideOffset={6}
            className='z-50 max-h-64 min-w-64 max-w-96 overflow-y-auto'
          >
            {project.repositories.map((repository) => (
              <DropdownMenuItem
                key={repository.id}
                className='cursor-pointer'
                render={<a href={repository.url} target='_blank' rel='noreferrer' />}
              >
                <GitHubIcon className='size-4 shrink-0' />
                <span className='truncate'>{repository.url}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button className='p-5 mt-auto' render={<Link to={projectDetailsRoute(project.id)} />}>
        Ver detalhes <ArrowRight />
      </Button>
    </div>
  )
}

export function GroupCard({
  group,
  showOptions = false,
  onLeaderChange,
}: {
  group: Group
  showOptions?: boolean
  onLeaderChange?: (leaderId: string) => Promise<boolean>
}) {
  return (
    <div className='h-full flex flex-col p-5 gap-2 bg-card rounded-sm border shadow-lg/40 shadow-foreground/10 border border-border/70'>
      <img src='/group-fallback-light.png' className='rounded-lg dark:hidden' />
      <img src='/group-fallback-dark.png' className='hidden rounded-lg dark:block' />

      <div className='mt-2 flex w-full items-start justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          {group.tags && group.tags.map((tag) => <GroupBadge key={tag} tag={tag} />)}
        </div>
        {showOptions && onLeaderChange && (
          <GroupCardOptions group={group} onLeaderChange={onLeaderChange} />
        )}
      </div>

      <div className='flex flex-row items-center justify-between gap-4 mt-2'>
        <div className='flex flex-row items-center gap-4'>
          <Users className='size-8 text-highlight-soft-foreground' />
          <span>{group.friendlyId}</span>
        </div>
        <div className='flex flex-row gap-2 justify-start items-center text-muted-foreground'>
          <Clock className='size-4' />
          <span className='text-xs'>
            Ultima atualização {getFriendlyDate(new Date(group.updatedAt), 'dd/mm/yyyy - hh:mm')}
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-2.5 justify-start py-3'>
        <span className='text-foreground text-sm'>Membros</span>
        <div className='grid grid-flow-col grid-cols-2 grid-rows-3 gap-x-4 gap-y-2.5'>
          {group.members.map((member) => (
            <div
              key={member.id}
              className='flex min-w-0 flex-row items-center justify-start gap-2 text-muted-foreground'
            >
              {member.gitHubDetails?.avatarUrl ? (
                <img
                  src={member.gitHubDetails.avatarUrl}
                  alt={member.name}
                  className='size-5 shrink-0 rounded-full'
                />
              ) : (
                <User className='size-5 shrink-0' />
              )}
              <span className='truncate text-xs'>{member.name}</span>
              {group.leaderId === member.id && (
                <Badge className='ml-1 text-xs bg-highlight-soft text-highlight-soft-foreground'>
                  Líder
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GroupCardOptions({
  group,
  onLeaderChange,
}: {
  group: Group
  onLeaderChange: (leaderId: string) => Promise<boolean>
}) {
  const [changeLeaderOpen, setChangeLeaderOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={`Opções do grupo ${group.friendlyId}`}
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='min-w-44'>
          <DropdownMenuItem className='gap-2' onClick={() => setChangeLeaderOpen(true)}>
            <UserStar />
            Alterar líder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangeGroupLeaderDialog
        group={group}
        open={changeLeaderOpen}
        onOpenChange={setChangeLeaderOpen}
        onLeaderChange={onLeaderChange}
      />
    </>
  )
}
