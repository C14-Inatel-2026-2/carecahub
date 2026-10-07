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
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFriendlyDate } from "@/lib/utils";
import { ChangeGroupLeaderDialog } from "@/modules/groups/dialogs/change-group-leader-dialog";
import { projectDetailsRoute } from "@/router/routes";
import type { Group } from "@/types/group";
import type { Project } from "@/types/project";
import { GroupBadge, ProjectBadge } from "./project-badge";

export function ProjectCard({
  group,
  project,
}: {
  group: Group;
  project: Project;
}) {
  const hasRepositories = project.repositories.length > 0;

  return (
    <div
      className="h-full flex flex-col p-5 gap-2 bg-card rounded-sm shadow-lg/40 shadow-foreground/10 border border-border/70"
      style={
        project.mainColor
          ? {
              borderColor: `${project.mainColor}66`,
              boxShadow: `0 4px 16px ${project.mainColor}40`,
            }
          : undefined
      }
    >
      {project.thumbnailUrl ? (
        <img
          src={project.thumbnailUrl}
          alt={`Imagem do projeto ${project.projectName}`}
          className="aspect-video w-full rounded-lg object-cover"
        />
      ) : (
        <>
          <img
            src="/project-fallback-light.png"
            className="rounded-lg dark:hidden"
          />
          <img
            src="/project-fallback-dark.png"
            className="hidden rounded-lg dark:block"
          />
        </>
      )}
      <div className="flex flex-row justify-start items-center w-fit gap-2 mt-2">
        {group.tags &&
          group.tags.map((tag) => <GroupBadge key={tag} tag={tag} />)}

        {project.tags &&
          project.tags.map((tag) => <ProjectBadge key={tag} tag={tag} />)}
      </div>
      <div className="flex flex-row items-center justify-between gap-4 mt-2">
        <div className="flex flex-row items-center gap-4">
          {project.iconUrl ? (
            <img
              src={project.iconUrl}
              alt=""
              className="size-8 rounded-lg object-cover"
            />
          ) : (
            <Box className="size-8 text-highlight-soft-foreground" />
          )}
          <span>{project.projectName}</span>
        </div>
        <div className="flex flex-row max-w-40 gap-2 justify-start items-center text-muted-foreground">
          <Clock className="size-6" />
          <span className="text-xs">
            Ultima atualização{" "}
            {getFriendlyDate(new Date(group.updatedAt), "dd/mm/yyyy - hh:mm")}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 w-fit gap-4 py-2">
        <div className="flex items-center gap-2">
          <GitCommitHorizontal className="size-5 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Commits</dt>
            <dd className="text-sm font-medium">{project.commitCount}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="size-5 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">Branches</dt>
            <dd className="text-sm font-medium">{project.branchCount}</dd>
          </div>
        </div>
      </dl>

      {hasRepositories && project.repositoryType === "monorepo" && (
        <a
          href={project.repositories[0].url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline mb-4"
        >
          <GitHubIcon />
          <span className="truncate">{project.repositories[0].url}</span>
        </a>
      )}

      {hasRepositories && project.repositoryType === "multirepo" && (
        <DropdownMenu>
          <DropdownMenuTrigger className="group flex w-full cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium mt-2 mb-2">
            <div className="flex flex-row gap-3 items-center justify-start">
              <FolderGit2 className="size-5" />
              <span>Repositórios ({project.repositories.length})</span>
            </div>
            <ChevronDown className="size-4 transition-transform group-data-popup-open:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="z-50 max-h-64 min-w-64 max-w-96 overflow-y-auto"
          >
            {project.repositories.map((repository) => (
              <DropdownMenuItem
                key={repository.id}
                className="cursor-pointer"
                render={
                  <a href={repository.url} target="_blank" rel="noreferrer" />
                }
              >
                <GitHubIcon />
                <span className="truncate">{repository.url}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        className="p-5 mt-auto"
        render={<Link to={projectDetailsRoute(project.projectName)} />}
      >
        Ver detalhes <ArrowRight />
      </Button>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 shrink-0 fill-current"
    >
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18A10.95 10.95 0 0 1 12 6.31c.98 0 1.96.13 2.87.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.05c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

export function GroupCard({
  group,
  showOptions = false,
  onLeaderChange,
}: {
  group: Group;
  showOptions?: boolean;
  onLeaderChange?: (leaderId: string) => Promise<boolean>;
}) {
  return (
    <div className="h-full flex flex-col p-5 gap-2 bg-card rounded-sm border shadow-lg/40 shadow-foreground/10 border border-border/70">
      <img src="/group-fallback-light.png" className="rounded-lg dark:hidden" />
      <img
        src="/group-fallback-dark.png"
        className="hidden rounded-lg dark:block"
      />

      <div className="mt-2 flex w-full items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {group.tags &&
            group.tags.map((tag) => <GroupBadge key={tag} tag={tag} />)}
        </div>
        {showOptions && onLeaderChange && (
          <GroupCardOptions group={group} onLeaderChange={onLeaderChange} />
        )}
      </div>

      <div className="flex flex-row items-center justify-between gap-4 mt-2">
        <div className="flex flex-row items-center gap-4">
          <Users className="size-8 text-highlight-soft-foreground" />
          <span>{group.friendlyId}</span>
        </div>
        <div className="flex flex-row gap-2 justify-start items-center text-muted-foreground">
          <Clock className="size-4" />
          <span className="text-xs">
            Ultima atualização{" "}
            {getFriendlyDate(new Date(group.updatedAt), "dd/mm/yyyy - hh:mm")}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 justify-start py-3">
        <span className="text-foreground text-sm">Membros</span>
        <div className="grid grid-flow-col grid-cols-2 grid-rows-3 gap-x-4 gap-y-2.5">
          {group.members.map((member) => (
            <div
              key={member.id}
              className="flex min-w-0 flex-row items-center justify-start gap-2 text-muted-foreground"
            >
              {member.gitHubDetails?.avatarUrl ? (
                <img
                  src={member.gitHubDetails.avatarUrl}
                  alt={member.name}
                  className="size-5 shrink-0 rounded-full"
                />
              ) : (
                <User className="size-5 shrink-0" />
              )}
              <span className="truncate text-xs">{member.name}</span>
              {group.leaderId === member.id && (
                <Badge className="ml-1 text-xs bg-highlight-soft text-highlight-soft-foreground">
                  Líder
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupCardOptions({
  group,
  onLeaderChange,
}: {
  group: Group;
  onLeaderChange: (leaderId: string) => Promise<boolean>;
}) {
  const [changeLeaderOpen, setChangeLeaderOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Opções do grupo ${group.friendlyId}`}
            />
          }
        >
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem
            className="gap-2"
            onClick={() => setChangeLeaderOpen(true)}
          >
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
  );
}
