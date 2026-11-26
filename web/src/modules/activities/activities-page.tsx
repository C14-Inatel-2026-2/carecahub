import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useList } from "@/api";
import { Button } from "@/components/ui/button";
import { appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import {
  getNextStudentActivitySectionUpdate,
  getStudentActivitySections,
} from "./activity-list-groups";
import { ActivityCard } from "./components/activity-card";

const studentSectionLabels = {
  todo: "A fazer",
  overdue: "Atrasadas/Não entregues",
  submitted: "Entregues",
} as const;

export function ActivitiesPage() {
  const user = useUser((state) => state.user);
  const [now, setNow] = useState(() => new Date());
  const { data: activities, isLoading } = useList({
    endpoint: "/activities",
    params: { skip: 0, take: 100 },
  });
  const canManage =
    user?.role === "admin" ||
    user?.role === "teacher" ||
    user?.role === "mentor";
  const studentSections =
    user?.role === "student" ? getStudentActivitySections(activities, now) : null;

  useEffect(() => {
    if (user?.role !== "student") return;

    const updateAt = getNextStudentActivitySectionUpdate(activities, now);
    if (!updateAt) return;

    const timeout = window.setTimeout(() => setNow(new Date()), Math.max(updateAt.getTime() - Date.now(), 0));
    return () => window.clearTimeout(timeout);
  }, [activities, now, user?.role]);

  return (
    <section className="flex flex-1 flex-col px-4 py-5 md:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Atividades</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Acompanhe prazos, entregas e avaliações.
          </p>
        </div>
        {canManage && (
          <Button
            render={<Link to={appRoutes.createActivity} />}
            variant="highlight"
            type="button"
          >
            <Plus />
            Nova atividade
          </Button>
        )}
      </div>
      {studentSections ? (
        <div className="mt-6 grid gap-8">
          {(Object.entries(studentSectionLabels) as Array<
            [keyof typeof studentSectionLabels, string]
          >).map(([section, label]) => {
            const groups = studentSections[section];
            if (!groups.length) return null;

            return (
              <section key={section} className="grid gap-4">
                <h2 className="text-base font-medium">{label}</h2>
                {groups.map((group) => (
                  <div key={group.date} className="grid gap-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {group.label}
                    </h3>
                    <div className="grid gap-3">
                      {group.activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
      {!isLoading && activities.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhuma atividade publicada.
        </p>
      )}
      {isLoading && (
        <p className="mt-6 text-sm text-muted-foreground">
          Carregando atividades…
        </p>
      )}
    </section>
  );
}
