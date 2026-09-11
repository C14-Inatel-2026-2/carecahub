import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { InputFF, TextAreaFF } from "@/components/form-fields/input-ff";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appRoutes } from "@/router/routes";
import {
  dependencyManagerOptions,
  type ProjectFormInput,
  type ProjectFormValues,
  projectFormSchema,
  repositoryTypeOptions,
  technologyOptions,
  versionControlOptions,
} from "@/types/project";

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [discardOpen, setDiscardOpen] = useState(false);
  const form = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      technologies: [],
      usesOtherTechnology: false,
      otherTechnology: "",
      dependencyManager: undefined,
      otherDependencyManager: "",
      versionControl: undefined,
      otherVersionControl: "",
      repositoryType: undefined,
    },
  });
  const usesOtherTechnology = useWatch({
    control: form.control,
    name: "usesOtherTechnology",
  });
  const dependencyManager = useWatch({
    control: form.control,
    name: "dependencyManager",
  });
  const versionControl = useWatch({
    control: form.control,
    name: "versionControl",
  });
  const { isDirty } = useFormState({ control: form.control });

  function requestBack() {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    navigate(appRoutes.myProject);
  }

  function submit(_values: ProjectFormValues) {
    toast.success("Projeto criado");
    navigate(appRoutes.myProject);
  }

  return (
    <>
      <section className="flex w-full flex-1 flex-col px-4 py-5 md:px-6 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          className="w-fit fixed"
          onClick={requestBack}
        >
          <ArrowLeft />
          Voltar
        </Button>

        <div className="mx-auto mt-4 w-full max-w-4xl">
          <h1 className="text-xl font-medium">Criar projeto</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha os dados iniciais do projeto do seu grupo.
          </p>

          <FormProvider {...form}>
            <form
              className="mt-7 grid gap-7 pb-10"
              noValidate
              onSubmit={form.handleSubmit(submit)}
            >
              <div className="grid gap-5">
                <InputFF name="name" label="Nome do projeto" />
                <TextAreaFF
                  name="description"
                  label="Descrição"
                  rows={5}
                  maxLength={1000}
                />
              </div>

              <Controller
                control={form.control}
                name="technologies"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Tecnologias utilizadas</FieldLabel>
                    <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-3 lg:grid-cols-4">
                      {technologyOptions
                        .toSorted((a, b) =>
                          a.label.localeCompare(b.label, "pt-BR", {
                            sensitivity: "base",
                          }),
                        )
                        .map((option) => {
                          const id = `technology-${option.value}`;
                          const selected = (field.value ?? []).includes(
                            option.value,
                          );
                          return (
                            <label
                              key={option.value}
                              htmlFor={id}
                              className="flex cursor-pointer items-center gap-2 text-sm"
                            >
                              <Checkbox
                                id={id}
                                checked={selected}
                                onCheckedChange={(checked) => {
                                  const current = field.value ?? [];
                                  field.onChange(
                                    checked
                                      ? [...current, option.value]
                                      : current.filter(
                                          (value) => value !== option.value,
                                        ),
                                  );
                                }}
                              />
                              {option.label}
                            </label>
                          );
                        })}
                    </div>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="usesOtherTechnology"
                render={({ field }) => (
                  <label
                    htmlFor="uses-other-technology"
                    className="flex w-fit cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      id="uses-other-technology"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    Outra
                  </label>
                )}
              />

              {usesOtherTechnology && (
                <InputFF
                  name="otherTechnology"
                  label="Outra tecnologia"
                  placeholder="Outra"
                />
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Controller
                  control={form.control}
                  name="dependencyManager"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="dependency-manager">
                        Gerenciador de dependências
                      </FieldLabel>
                      <Select
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="dependency-manager"
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Selecione um gerenciador">
                            {(value) =>
                              dependencyManagerOptions.find(
                                (option) => option.value === value,
                              )?.label
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {dependencyManagerOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {dependencyManager === "other" && (
                  <InputFF
                    name="otherDependencyManager"
                    label="Outro gerenciador de dependências"
                    placeholder="Outro"
                  />
                )}

                <Controller
                  control={form.control}
                  name="versionControl"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="version-control">
                        Sistema de controle de versão
                      </FieldLabel>
                      <Select
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="version-control"
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Selecione um sistema">
                            {(value) =>
                              versionControlOptions.find(
                                (option) => option.value === value,
                              )?.label
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {versionControlOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {versionControl === "other" && (
                  <InputFF
                    name="otherVersionControl"
                    label="Outro sistema de controle de versão"
                    placeholder="Outro"
                  />
                )}

                <Controller
                  control={form.control}
                  name="repositoryType"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="repository-type">
                        Tipo de repositório
                      </FieldLabel>
                      <Select
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="repository-type"
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Selecione um tipo">
                            {(value) =>
                              repositoryTypeOptions.find(
                                (option) => option.value === value,
                              )?.label
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {repositoryTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>

              <div className="flex justify-end border-t pt-5">
                <Button type="submit">Criar projeto</Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </section>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="max-w-105! w-105!">
          <DialogHeader>
            <DialogTitle>Voltar?</DialogTitle>
            <DialogDescription>
              Os dados preenchidos serão perdidos. Deseja descartar as
              alterações?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDiscardOpen(false)}
            >
              Continuar editando
            </Button>
            <Button type="button" onClick={() => navigate(appRoutes.myProject)}>
              Descartar e voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
