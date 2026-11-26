import { FileText } from "lucide-react";
import { useState } from "react";
import { API_BASE_URL } from "@/api/fetchers";
import { writer } from "@/api/writer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActivitySubmission } from "@/types/activity";

export function SubmissionHistory({
  activityId,
  submissions,
  canEvaluate,
  onUpdated,
}: {
  activityId: string;
  submissions: ActivitySubmission[];
  canEvaluate: boolean;
  onUpdated: () => void;
}) {
  const [scores, setScores] = useState<Record<string, string>>({});
  async function evaluate(submission: ActivitySubmission) {
    const score = Number(scores[submission.id] ?? submission.score);
    if (!Number.isInteger(score) || score < 0 || score > 100) return;
    const result = await writer(
      "PUT /activities/:id/submissions/:submissionId/evaluation",
      {
        params: { id: activityId, submissionId: submission.id },
        body: { score },
        silent: true,
      },
    );
    if (result.ok) onUpdated();
  }
  return (
    <section className="mt-6 w-full max-w-3xl">
      <h2 className="mb-3 font-medium">Histórico de entregas</h2>
      <div className="grid gap-3">
        {submissions.map((submission) => (
          <article
            key={submission.id}
            className="rounded-lg border bg-card p-3 sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
                  <span>Entrega versão {submission.version}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {submission.score !== null && !submission.invalidatedAt && (
                      <Badge>Nota: {submission.score}</Badge>
                    )}
                    {submission.invalidatedAt && (
                      <Badge variant="destructive">Invalidada</Badge>
                    )}
                    {submission.isLate && (
                      <Badge className="bg-amber-200 text-amber-700">
                        Em atraso
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  Enviada por {submission.submittedBy.name} ·{" "}
                  {new Date(submission.submittedAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                {submission.score === null &&
                  !submission.invalidatedAt &&
                  canEvaluate && (
                    <>
                      <Input
                        className="w-full sm:w-20"
                        type="number"
                        min={0}
                        max={100}
                        value={scores[submission.id] ?? submission.score ?? ""}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [submission.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        className="shrink-0"
                        size="sm"
                        onClick={() => void evaluate(submission)}
                      >
                        Avaliar
                      </Button>
                    </>
                  )}
              </div>
            </div>
            <div className="mt-2 grid gap-1 text-sm">
              {submission.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 text-primary underline-offset-4 hover:underline"
                >
                  {link.thumbnailUrl && (
                    <img
                      alt={`Prévia de ${link.url}`}
                      className="size-10 shrink-0 rounded border object-cover"
                      src={link.thumbnailUrl}
                    />
                  )}
                  <span className="truncate">{link.url}</span>
                </a>
              ))}
              {submission.files.map((file) => (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-left text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={`Abrir ${file.filename}`}
                  onClick={async () => {
                    const response = await fetch(
                      `${API_BASE_URL}/activities/${activityId}/submissions/${submission.id}/files/${file.id}/download`,
                      { credentials: "include" },
                    );
                    const data = (await response.json()) as { url?: string };
                    if (data.url)
                      window.open(data.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <FileText
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{file.filename}</span>
                </button>
              ))}
            </div>
          </article>
        ))}
        {submissions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma entrega registrada.
          </p>
        )}
      </div>
    </section>
  );
}
