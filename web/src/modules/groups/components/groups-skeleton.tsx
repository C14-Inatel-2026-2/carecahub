import { Skeleton } from "@/components/ui/skeleton";

export function GroupsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-126 w-full" />
      ))}
    </div>
  );
}
