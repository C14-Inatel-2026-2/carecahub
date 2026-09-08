// import { useUser } from "@/stores/use-user";

export function GroupsPage() {
  //   const user = useUser((state) => state.user);

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Grupos</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gerencie os grupos no CarecaHub.
          </p>
        </div>
      </div>

      <div className="mt-5" /*aria-busy={isLoadingGroups}*/></div>
    </section>
  );
}
