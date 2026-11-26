import { ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { activityDetailsRoute } from "@/router/routes";
import type { Activity } from "@/types/activity";

export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Button
      className="flex h-fit flex-col gap-2 rounded-sm border border-border/70 bg-card p-5 shadow-lg/40 shadow-muted-foreground/10 hover:shadow-lg/60 hover:shadow-muted-foreground/30 text-foreground items-start justify-start"
      render={<Link to={activityDetailsRoute(activity.id)} />}
      variant="card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-highlight-soft text-highlight-soft-foreground">
            <ClipboardCheck className="size-5" />
          </div>
          <h2 className="truncate font-medium">{activity.title}</h2>
        </div>
      </div>
    </Button>
  );
}
