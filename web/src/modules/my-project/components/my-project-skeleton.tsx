import { Skeleton } from "@/components/ui/skeleton";

export function MyProjectSkeleton() {
  return (
    <section className="flex w-full flex-1 flex-col px-4 py-5 md:px-6 lg:px-8">
      <h1 className="text-lg font-medium">Meu Projeto</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Gerencie seu projeto no CarecaHub.
      </p>
      <div className="mt-7 border-t pt-7">
        <Skeleton className="h-10 w-30" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mt-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-30 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-30 mt-8" />
        <Skeleton className="h-120 w-140 mt-4" />
      </div>
    </section>
  );
}
