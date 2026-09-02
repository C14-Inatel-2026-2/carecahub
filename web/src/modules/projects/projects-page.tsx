// import { useUser } from "@/stores/use-user";

export function ProjectsPage() {
  //   const user = useUser((state) => state.user);

  return (
    <section className="w-full px-4 py-5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Projetos</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gerencie os projetos no CarecaHub.
          </p>
        </div>
      </div>
    </section>
  );
}
