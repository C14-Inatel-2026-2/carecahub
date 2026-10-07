import { Search } from "lucide-react";
import { useState } from "react";
import { useList } from "@/api";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/use-debounce";
import { isMockAPIEnabled } from "@/mocks/config";
import { mockGroups } from "@/mocks/groups";
import type { Group } from "@/types/group";
import type { Project } from "@/types/project";
import { ProjectCard } from "./components/project-card";
import { ProjectsSkeleton } from "./components/projects-skeleton";

function hasProject(group: Group): group is Group & { project: Project } {
  return group.project !== null && group.project !== undefined;
}

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const { data: apiGroups, isLoading } = useList({
    endpoint: "/groups",
    params: {
      take: 100,
      search: debouncedSearch.trim() || undefined,
      searchScope: "projects",
    },
    disabled: isMockAPIEnabled,
  });
  const groups = isMockAPIEnabled ? mockGroups : apiGroups;
  const groupsWithProject = groups.filter(hasProject);

  return (
    <section className="flex flex-1 flex-col w-full px-4 py-5 md:px-6 lg:px-8">
      <h1 className="text-lg font-medium">Projetos</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Gerencie os projetos no CarecaHub.
      </p>

      <label className="relative mt-6 block max-w-md">
        <span className="sr-only">
          Buscar projetos, repositórios ou membros
        </span>
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-muted" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-8"
          placeholder="Buscar projetos, repositórios ou membros…"
        />
      </label>

      <div className="mt-4 flex flex-col gap-8">
        {groupsWithProject.length > 0 && (
          <section>
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {groupsWithProject.map((group) => (
                <ProjectCard
                  key={group.id}
                  group={group}
                  project={group.project}
                />
              ))}
            </div>
          </section>
        )}

        {!isMockAPIEnabled && isLoading && <ProjectsSkeleton />}
        {!isLoading && groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum grupo encontrado.
          </p>
        )}
      </div>
    </section>
  );
}
