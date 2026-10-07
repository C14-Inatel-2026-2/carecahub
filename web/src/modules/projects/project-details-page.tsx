import {
  Box,
  CalendarDays,
  CircleUser,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  Package,
  Settings,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useGet } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getFriendlyDate } from "@/lib/utils";
import { projectCustomizeRoute } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import {
  dependencyManagerOptions,
  type Project,
  repositoryTypeOptions,
  technologyOptions,
  versionControlOptions,
} from "@/types/project";

function optionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value?: string | null,
) {
  if (!value) return "Não informado";
  return options.find((option) => option.value === value)?.label ?? value;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 wrap-break-word text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

export function ProjectDetailsContent({
  project,
  canCustomize = false,
}: {
  project: Project;
  canCustomize?: boolean;
}) {
  const members = project.members ?? [];
  const memberColumns = Math.ceil(members.length / 3) || 1;
  const memberRows = Math.ceil(members.length / memberColumns);
  const technologies = (project.technologies ?? []).map((technology) =>
    optionLabel(technologyOptions, technology),
  );
  if (project.usesOtherTechnology && project.otherTechnology) {
    technologies.push(project.otherTechnology);
  }

  const dependencyManager =
    project.dependencyManager === "other" && project.otherDependencyManager
      ? project.otherDependencyManager
      : optionLabel(dependencyManagerOptions, project.dependencyManager);
  const versionControl =
    project.versionControl === "other" && project.otherVersionControl
      ? project.otherVersionControl
      : optionLabel(versionControlOptions, project.versionControl);

  return (
    <section className="flex w-full flex-1 flex-col gap-4 px-4 py-5 md:px-6 lg:px-8">
      <Card className="py-0">
        <CardHeader
          className="flex min-h-20 flex-row items-center justify-between gap-4 px-5 py-4 md:px-6"
          style={
            project.mainColor
              ? {
                  background: `linear-gradient(to right, var(--card) 0%, var(--card) 70%, ${project.mainColor} 100%)`,
                }
              : undefined
          }
        >
          <div className="gap-5 flex flex-row items-center">
            {project.iconUrl ? (
              <img
                src={project.iconUrl}
                alt=""
                className="size-9 rounded-lg object-cover"
              />
            ) : (
              <Box
                className="size-9"
                style={{ color: project.mainColor ?? undefined }}
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Projeto
              </p>
              <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
                {project.projectName}
              </h1>
            </div>
          </div>
          {canCustomize && (
            <Button
              render={<Link to={projectCustomizeRoute(project.projectName)} />}
              variant="default"
              size="icon-lg"
              className="bg-card text-foreground hover:bg-card/70 hover:text-foreground/80"
              aria-label="Personalizar projeto"
              title="Personalizar projeto"
            >
              <Settings className="size-5" />
            </Button>
          )}
        </CardHeader>
      </Card>

      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.38fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card
            className="py-0"
            style={
              project.mainColor
                ? {
                    borderColor: `${project.mainColor}66`,
                    boxShadow: `0 0px 16px ${project.mainColor}40`,
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
                  alt={`Imagem do projeto ${project.projectName}`}
                  className="rounded-lg dark:hidden"
                />
                <img
                  src="/project-fallback-dark.png"
                  alt={`Imagem do projeto ${project.projectName}`}
                  className="hidden rounded-lg dark:block"
                />
              </>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Descrição</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
                {project.description || "Nenhuma descrição informada."}
              </p>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>
                <h2>Tecnologias utilizadas</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {technologies.length > 0 ? (
                technologies.map((technology) => (
                  <Badge
                    key={technology}
                    variant="secondary"
                    className="h-7 px-3"
                  >
                    {technology}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma tecnologia informada.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:h-full">
          <CardHeader>
            <CardTitle className="text-lg">
              <h2>Detalhes básicos</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <DetailItem
                icon={Package}
                label="Tipo de repositório"
                value={optionLabel(
                  repositoryTypeOptions,
                  project.repositoryType,
                )}
              />
              <DetailItem
                icon={Package}
                label="Gerenciador"
                value={dependencyManager}
              />
              <DetailItem
                icon={GitBranch}
                label="Controle de versão"
                value={versionControl}
              />
              <DetailItem
                icon={GitCommitHorizontal}
                label="Commits"
                value={project.commitCount}
              />
              <DetailItem
                icon={GitBranch}
                label="Branches"
                value={project.branchCount}
              />
              <DetailItem
                icon={CalendarDays}
                label="Última atualização"
                value={getFriendlyDate(
                  new Date(project.updatedAt),
                  "dd/mm/yyyy - hh:mm",
                )}
              />
            </dl>

            <div>
              <h2 className="mb-2 text-sm font-medium">Grupo</h2>
              {members.length > 0 ? (
                <ul
                  className="grid grid-flow-col gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${memberColumns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${memberRows}, minmax(0, auto))`,
                  }}
                >
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex min-w-0 items-center gap-2"
                    >
                      {member.gitHubDetails?.avatarUrl ? (
                        <img
                          src={member.gitHubDetails.avatarUrl}
                          alt={member.name}
                          className="size-7 shrink-0 rounded-full"
                        />
                      ) : (
                        <CircleUser className="size-7 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-sm">{member.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum integrante vinculado.
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-medium">Repositórios</h2>
              {project.repositories.length > 0 ? (
                <ul className="space-y-2">
                  {project.repositories.map((repository) => (
                    <li key={repository.id}>
                      <a
                        href={repository.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-2 rounded-lg border border-border/70 p-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ExternalLink
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{repository.url}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum repositório vinculado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function ProjectDetailsPage() {
  const { projectName } = useParams<{ projectName: string }>();
  const user = useUser((state) => state.user);
  const {
    data: project,
    error,
    isLoading,
  } = useGet("/projects/by-name/:id", projectName);

  if (isLoading) {
    return (
      <section
        className="grid w-full flex-1 gap-4 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8"
        aria-busy="true"
      >
        <p role="status" className="sr-only">
          Carregando detalhes do projeto
        </p>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="aspect-video min-h-64 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
        <Skeleton className="min-h-80 w-full" />
      </section>
    );
  }

  if (error || !projectName || !project) {
    return (
      <section
        role="alert"
        className="grid w-full flex-1 place-items-center px-4 py-10"
      >
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Projeto não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não foi possível carregar os detalhes deste projeto.
          </p>
        </div>
      </section>
    );
  }

  const canCustomize =
    user?.role === "student" &&
    project.members?.some((member) => member.id === user.id) === true;
  return (
    <ProjectDetailsContent project={project} canCustomize={canCustomize} />
  );
}
