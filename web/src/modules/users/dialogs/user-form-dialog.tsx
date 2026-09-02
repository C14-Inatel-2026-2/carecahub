import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { InputFF, NumberFF } from "@/components/form-fields/input-ff";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole } from "@/types/user";
import {
  academicFieldsByRole,
  formatUserRole,
  manageableRolesByRole,
  userFormSchema,
  userRoleLabels,
} from "@/types/user";

type UserFormInput = z.input<typeof userFormSchema>;
export type UserFormValues = z.output<typeof userFormSchema>;

export function UserFormDialog({
  title,
  description,
  submitLabel = "Criar usuário",
  requesterRole,
  user,
  onSubmit,
}: {
  title: string;
  description: string;
  submitLabel?: string;
  requesterRole: UserRole;
  user?: User;
  onSubmit: (values: UserFormValues) => Promise<string | undefined>;
}) {
  const availableRoles = manageableRolesByRole[requesterRole];
  const defaultRole = user?.role ?? availableRoles.at(-1);
  const form = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name ?? "",
      registration: user?.registration ?? undefined,
      githubName: user?.githubName ?? "",
      classroom: user?.classroom ?? "",
      email: user?.email ?? "",
      password: "",
      role: defaultRole,
    },
  });
  const selectedRole =
    useWatch({ control: form.control, name: "role" }) ?? defaultRole;
  const academicFields = selectedRole ? academicFieldsByRole[selectedRole] : [];

  useEffect(() => {
    form.reset({
      name: user?.name ?? "",
      registration: user?.registration ?? undefined,
      githubName: user?.githubName ?? "",
      classroom: user?.classroom ?? "",
      email: user?.email ?? "",
      password: "",
      role: defaultRole,
    });
  }, [user, defaultRole, form.reset]);

  async function submit(values: UserFormValues) {
    form.clearErrors("root");
    const error = await onSubmit(values);
    if (error) form.setError("root", { message: error });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <FormProvider {...form}>
        <form
          className="grid gap-4"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
          <FieldGroup>
            <InputFF name="name" label="Nome" />
            {academicFields.includes("registration") && (
              <NumberFF name="registration" label="Matrícula" min={1} />
            )}
            {academicFields.includes("githubName") && (
              <InputFF name="githubName" label="Usuário do GitHub" />
            )}
            {academicFields.includes("classroom") && (
              <InputFF name="classroom" label="Turma" maxLength={2} />
            )}
            <InputFF name="email" label="E-mail" type="email" />
            {availableRoles.length > 1 && (
              <Controller
                control={form.control}
                name="role"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="user-role">Função</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="user-role"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue>
                          {(role) => formatUserRole(role as UserRole | null)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {userRoleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )}
            {!user && <InputFF name="password" label="Senha" type="password" />}
            <FieldError errors={[form.formState.errors.root]} />
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {!form.formState.isSubmitting
                ? `Criar ${formatUserRole(selectedRole)}` || submitLabel
                : "Criando..."}
            </Button>
          </DialogFooter>
        </form>
      </FormProvider>
    </DialogContent>
  );
}
