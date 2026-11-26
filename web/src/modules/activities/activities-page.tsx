import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useList } from "@/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import {
  getActivitiesByDueDate,
  getNextStudentActivitySectionUpdate,
  getStudentActivitySections,
} from "./activity-list-groups";
import { ActivityCard } from "./components/activity-card";

const studentSectionLabels = {
  todo: "A fazer",
  overdue: "Em atraso",
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
    user?.role === "student"
      ? getStudentActivitySections(activities, now)
      : null;
  const activityDateGroups = getActivitiesByDueDate(activities);

  useEffect(() => {
    if (user?.role !== "student") return;

    const updateAt = getNextStudentActivitySectionUpdate(activities, now);
    if (!updateAt) return;

    const timeout = window.setTimeout(
      () => setNow(new Date()),
      Math.max(updateAt.getTime() - Date.now(), 0),
    );
    return () => window.clearTimeout(timeout);
  }, [activities, now, user?.role]);

  return (
    <section className="flex flex-1 flex-col w-full">
      <div className="sticky top-0 z-10 bg-card flex items-end justify-between gap-4 px-4 py-5 md:px-6 lg:px-8">
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
      <div className="px-4 py-5 md:px-6 lg:px-8">
        {studentSections ? (
          <Tabs defaultValue="todo">
            <TabsList aria-label="Filtrar atividades por status" variant="line">
              {(
                Object.entries(studentSectionLabels) as Array<
                  [keyof typeof studentSectionLabels, string]
                >
              ).map(([section, label]) => (
                <TabsTrigger key={section} value={section}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {(
              Object.entries(studentSectionLabels) as Array<
                [keyof typeof studentSectionLabels, string]
              >
            ).map(([section]) => {
              const groups = studentSections[section];

              return (
                <TabsContent key={section} value={section} className="mt-6">
                  {groups.length ? (
                    <div className="grid gap-6">
                      {groups.map((group) => (
                        <div key={group.date} className="grid gap-3">
                          <h2 className="text-sm font-medium text-muted-foreground">
                            {group.label}
                          </h2>
                          <div className="grid gap-3">
                            {group.activities.map((activity) => (
                              <ActivityCard
                                key={activity.id}
                                activity={activity}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma atividade nesta categoria.
                    </p>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        ) : (
          <div className="grid gap-6">
            {activityDateGroups.map((group) => (
              <div key={group.date} className="grid gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {group.label}
                </h2>
                <div className="grid gap-3">
                  {group.activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
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
      </div>
    </section>
  );
}
