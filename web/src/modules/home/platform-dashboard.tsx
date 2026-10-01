import { FolderKanban, GitBranch, Users, UsersRound } from "lucide-react";
import { useGet } from "@/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Dashboard } from "@/types/dashboard";
import type { UserRole } from "@/types/user";
import { CommitCharts } from "./components/commit-charts";
import { DashboardMetricCard } from "./components/dashboard-metric-card";
import { ProjectCommitRanking } from "./components/project-commit-ranking";

export function canViewPlatformDashboard(role: UserRole) {
  return role === "admin" || role === "teacher" || role === "mentor";
}

export function PlatformDashboard() {
  const { data, isLoading, error } = useGet("/dashboard");

  if (isLoading) {
    return (
      <div className="mt-7 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="mt-7 rounded-lg border border-destructive/30 p-5 text-sm text-destructive">
        Não foi possível carregar os dados do dashboard.
      </p>
    );
  }

  return <PlatformDashboardContent dashboard={data} />;
}

export function PlatformDashboardContent({
  dashboard,
}: {
  dashboard: Dashboard;
}) {
  const metricCards = [
    {
      label: "Alunos cadastrados",
      value: dashboard.metrics.students,
      icon: Users,
    },
    {
      label: "Grupos criados",
      value: dashboard.metrics.groups,
      icon: UsersRound,
    },
    {
      label: "Projetos iniciados",
      value: dashboard.metrics.projects,
      icon: FolderKanban,
    },
    {
      label: "Repositórios vinculados",
      value: dashboard.metrics.repositories,
      icon: GitBranch,
    },
  ];

  return (
    <div className="mt-7 grid gap-4">
      {!dashboard.githubDataComplete && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Alguns repositórios não puderam ser consultados. As métricas de
          commits podem estar incompletas.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <DashboardMetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <CommitCharts
        commitsByDay={dashboard.commitsByDay}
        commitsByClassroom={dashboard.commitsByClassroom}
      />
      <ProjectCommitRanking projects={dashboard.projectRanking} />
    </div>
  );
}
