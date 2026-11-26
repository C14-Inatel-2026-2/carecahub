import { FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useList } from "@/api";
import { writer } from "@/api/writer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Activity } from "@/types/activity";

export function getSelectedFileNames(files: File[]) {
  return files.map((file) => file.name);
}

export function removeSelectedFile(files: File[], index: number) {
  return files.filter((_, fileIndex) => fileIndex !== index);
}

export function createSubmissionFilePreviewUrl(file: Blob) {
  return URL.createObjectURL(file);
}

export function SubmissionForm({
  activity,
  onSubmitted,
  formId = `activity-submission-${activity.id}`,
}: {
  activity: Activity;
  onSubmitted: () => void;
  formId?: string;
}) {
  const [links, setLinks] = useState<string[]>([""]);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(
    [],
  );
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { data: repositories } = useList({
    endpoint: "/repositories",
    params: { skip: 0, take: 100 },
  });
  const needsFiles =
    activity.submissionType === "files" || activity.submissionType === "both";
  const needsLinks =
    activity.submissionType === "links" || activity.submissionType === "both";
  const closed =
    new Date() > new Date(activity.dueAt) && !activity.allowLateSubmissions;
  const selectedFileNames = getSelectedFileNames(files);

  function previewFile(file: File) {
    const url = createSubmissionFilePreviewUrl(file);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function submit() {
    if (submitting) return;
    if (closed) return toast.error("O prazo de entrega foi encerrado.");
    const additionalLinks = links.map((link) => link.trim()).filter(Boolean);
    if (
      (needsFiles && !files.length) ||
      (needsLinks && !selectedRepositories.length && !additionalLinks.length)
    ) {
      toast.error("Inclua todos os tipos de entrega exigidos pela atividade.");
      return;
    }
    if (files.some((file) => file.type !== "application/pdf")) {
      toast.error("Somente arquivos PDF podem ser enviados.");
      return;
    }
    setSubmitting(true);
    const fileIds: string[] = [];
    for (const file of files) {
      const body = new FormData();
      body.append("file", file);
      const uploaded = await writer("POST /files/private", {
        body,
        silent: true,
      });
      if (!uploaded.ok) {
        toast.error(uploaded.error.message);
        setSubmitting(false);
        return;
      }
      fileIds.push(uploaded.data.id);
    }
    const result = await writer("POST /activities/:id/submissions", {
      params: { id: activity.id },
      body: { fileIds, repositoryIds: selectedRepositories, additionalLinks },
      silent: true,
    });
    setSubmitting(false);
    if (!result.ok) return toast.error(result.error.message);
    toast.success(`Entrega versão ${result.data.version} registrada`);
    onSubmitted();
  }

  return (
    <form
      id={formId}
      className="mt-6 w-full max-w-3xl rounded-lg border bg-card p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h2 className="font-medium">Enviar entrega</h2>
      {needsLinks && (
        <div className="mt-4 grid gap-3">
          <p className="text-sm font-medium">Repositórios do projeto</p>
          {repositories.map((repository) => (
            <label
              key={repository.id}
              className="flex min-w-0 items-center gap-2 text-sm"
            >
              <Checkbox
                className="cursor-pointer"
                checked={selectedRepositories.includes(repository.id)}
                onCheckedChange={(checked) =>
                  setSelectedRepositories((current) =>
                    checked
                      ? [...current, repository.id]
                      : current.filter((id) => id !== repository.id),
                  )
                }
              />
              <span className="break-all">{repository.url}</span>
            </label>
          ))}
          <p className="pt-2 text-sm font-medium">Links adicionais</p>
          {links.map((link, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={link}
                placeholder="https://..."
                onChange={(event) =>
                  setLinks((current) =>
                    current.map((item, position) =>
                      position === index ? event.target.value : item,
                    ),
                  )
                }
              />
              {links.length > 1 && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="self-end sm:self-auto"
                  onClick={() =>
                    setLinks((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-fit"
            onClick={() => setLinks((current) => [...current, ""])}
          >
            <Plus />
            Adicionar link
          </Button>
        </div>
      )}
      {needsFiles && (
        <>
          <label className="mt-4 grid gap-2 text-sm font-medium">
            Arquivos PDF
            <span className="relative flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary/60 hover:bg-muted/50 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <Upload
                className="mb-3 size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="font-medium text-foreground">
                Clique para selecionar arquivos
              </span>
              <span className="mt-1 font-normal text-muted-foreground">
                Máximo de 10 arquivos PDF
              </span>
              <input
                className="sr-only"
                type="file"
                accept="application/pdf"
                multiple
                aria-describedby="submission-files-help"
                onChange={(event) =>
                  setFiles(Array.from(event.target.files ?? []).slice(0, 10))
                }
              />
            </span>
          </label>
          {selectedFileNames.length > 0 && (
            <div
              id="submission-files-help"
              className="font-normal text-muted-foreground mt-3"
            >
              <ul className="grid gap-2" aria-label="Arquivos selecionados">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex min-w-0 items-stretch gap-2"
                  >
                    <button
                      type="button"
                      className="flex w-[87%] sm:w-full items-center gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-left text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={`Abrir ${file.name}`}
                      onClick={() => previewFile(file)}
                    >
                      <FileText
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate">{file.name}</span>
                    </button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="my-auto shrink-0 w-[13%] sm:w-fit p-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remover ${file.name}`}
                      onClick={() =>
                        setFiles((current) =>
                          removeSelectedFile(current, index),
                        )
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </form>
  );
}
