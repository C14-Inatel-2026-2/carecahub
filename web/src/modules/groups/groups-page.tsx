import { useList } from "@/api";
import { writer } from "@/api/writer";
import { isMockAPIEnabled } from "@/mocks/config";
import { GroupCard } from "@/modules/projects/components/project-card";
import { useUser } from "@/stores/use-user";
import type { Group } from "@/types/group";
import { canPromoteGroupLeader } from "./group-permissions";
import { GroupsSkeleton } from "./components/groups-skeleton";

export function GroupsPage() {
  const user = useUser((state) => state.user);
  const {
    data: groups,
    isLoading,
    mutate,
  } = useList({
    endpoint: "/groups",
    params: { take: 100 },
    disabled: isMockAPIEnabled || !user,
  });

  async function promote(group: Group, leaderId: string) {
    const result = await writer("PATCH /groups/:id/leader", {
      params: { id: group.id },
      body: { leaderId },
      onSuccessMessage: "Novo líder definido",
    });
    if (result.ok) void mutate();
    return result.ok;
  }

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <h1 className="text-lg font-medium">Grupos</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Gerencie os grupos no CarecaHub.
      </p>

      <div className="mt-6 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            showOptions={!!user && canPromoteGroupLeader(user, group)}
            onLeaderChange={(leaderId) => promote(group, leaderId)}
          />
        ))}
      </div>

      {isLoading && <GroupsSkeleton />}
      {!isLoading && groups.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum grupo encontrado.
        </p>
      )}
    </section>
  );
}
