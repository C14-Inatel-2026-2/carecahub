import { File } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGet } from "@/api";
import { API_BASE_URL } from "@/api/fetchers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/stores/use-user";
import type { Activity, Attachment } from "@/types/activity";
import type { UserRole } from "@/types/user";
import { ActivityActions } from "./components/activity-actions";
import {
  ActivityDetailsSkeleton,
  ActivityPipelineSkeleton,
} from "./components/activity-details-skeleton";
import { ActivityPipeline } from "./components/activity-pipeline";
import { ActivityRichTextContent } from "./components/activity-rich-text";
import { SubmissionForm } from "./components/submission-form";
import { SubmissionHistory } from "./components/submission-history";

export function canShowSubmissionForm({
  role,
  dueAt,
  hasSubmission,
  isLoadingSubmissions,
  now = new Date(),
}: {
  role?: UserRole;
  dueAt: string;
  hasSubmission: boolean;
  isLoadingSubmissions: boolean;
  now?: Date;
}) {
  return (
    role === "student" &&
    !isLoadingSubmissions &&
    !hasSubmission &&
    new Date(dueAt) > now
  );
}

export function ActivityDetailsPage() {
  const { activityId } = useParams();
  const user = useUser((state) => state.user);
  const {
    data: activity,
    isLoading,
    mutate: mutateActivity,
  } = useGet("/activities/:id", activityId);
  const canTrack =
    user?.role === "admin" ||
    user?.role === "teacher" ||
    user?.role === "mentor";
  const {
    data: pipeline,
    isLoading: isLoadingPipeline,
    mutate: mutatePipeline,
  } = useGet("/activities/:id/pipeline", activityId, undefined, !canTrack);
  const {
    data: submissions,
    isLoading: isLoadingSubmissions,
    mutate: mutateSubmissions,
  } = useGet(
    "/activities/:id/submissions",
    activityId,
    undefined,
    user?.role !== "student",
  );

  if (isLoading) return <ActivityDetailsSkeleton showPipeline={canTrack} />;
  if (!activity)
    return (
      <main className="p-6 text-sm text-muted-foreground">
        Atividade não encontrada.
      </main>
    );

  const submissionFormId = `activity-submission-${activity.id}`;
  const showSubmissionForm = canShowSubmissionForm({
    role: user?.role,
    dueAt: activity.dueAt,
    hasSubmission: Boolean(submissions?.data.length),
    isLoadingSubmissions,
  });

  async function fetchAttachmentFile({
    activity,
    attachment,
  }: {
    activity: Activity;
    attachment: Attachment;
  }) {
    const response = await fetch(
      `${API_BASE_URL}/activities/${activity.id}/attachments/${attachment.id}/download`,
      { credentials: "include" },
    );
    const data = (await response.json()) as { url?: string };
    if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="flex flex-1 flex-col px-4 py-5 md:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-medium">{activity.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prazo: {new Date(activity.dueAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showSubmissionForm && (
            <Button variant="highlight" type="submit" form={submissionFormId}>
              Enviar entrega
            </Button>
          )}
          {(user?.role === "teacher" || user?.role === "mentor") && (
            <ActivityActions
              activity={activity}
              onChanged={() => void mutateActivity()}
            />
          )}
        </div>
      </div>

      <div className="mt-6 max-w-3xl flex flex-col gap-3">
        <p className="text-lg font-semibold">Instruções</p>
        <ActivityRichTextContent content={activity.description} />
      </div>

      {activity.attachments.length > 0 && (
        <Card className="mt-4 max-w-3xl">
          <CardHeader>
            <CardTitle className="text-base">Materiais de referência</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {activity.attachments.map((attachment) => (
              <button
                key={attachment.id}
                type="button"
                className="w-full flex flex-1 flex-row items-center gap-2 px-3 py-4 rounded bg-muted border border-muted-foreground/20 text-left text-base leading-tight hover:text-primary hover:underline"
                aria-label={`Visualizar ${attachment.filename}`}
                onClick={() => fetchAttachmentFile({ activity, attachment })}
              >
                <File className="size-5" />
                {attachment.filename}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
      {showSubmissionForm && (
        <SubmissionForm
          activity={activity}
          formId={submissionFormId}
          onSubmitted={() => {
            void mutateSubmissions();
            if (canTrack) void mutatePipeline();
          }}
        />
      )}

      {canTrack && isLoadingPipeline && <ActivityPipelineSkeleton />}
      {pipeline && <ActivityPipeline activityId={activity.id} pipeline={pipeline} />}
      {user?.role === "student" &&
        submissions &&
        submissions.data.length > 0 &&
        activityId && (
          <SubmissionHistory
            activityId={activityId}
            submissions={submissions.data}
            canEvaluate={false}
            onUpdated={() => void mutateSubmissions()}
          />
        )}
    </section>
  );
}
