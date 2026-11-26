import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { writer } from "@/api/writer";
import { FormSchemaProvider } from "@/components/form-fields/form-schema";
import { LabeledInput } from "@/components/form-fields/labeled-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { useIsMobile } from "@/lib/use-mobile";
import { appRoutes } from "@/router/routes";
import { useUser } from "@/stores/use-user";
import { registerSchema } from "@/types/auth";

export const registrationConfirmationSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Informe o código de 6 dígitos."),
});

type RegisterFormInput = z.input<typeof registerSchema>;
type RegisterFormValues = z.output<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setUser = useUser((state) => state.setUser);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const form = useForm<RegisterFormInput, unknown, RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      registration: undefined,
      password: "",
      passwordConfirmation: "",
    },
  });
  const [password, passwordConfirmation] = useWatch({
    control: form.control,
    name: ["password", "passwordConfirmation"],
  });

  useEffect(() => {
    if (passwordConfirmation && password !== undefined) {
      void form.trigger("passwordConfirmation");
    }
  }, [form, password, passwordConfirmation]);
  const confirmationForm = useForm<
    z.infer<typeof registrationConfirmationSchema>
  >({
    resolver: zodResolver(registrationConfirmationSchema),
    defaultValues: { code: "" },
  });

  async function submit(values: RegisterFormValues) {
    form.clearErrors("root");

    const { passwordConfirmation: _, ...request } = values;
    const result = await writer("POST /auth/register", {
      body: request,
      silent: true,
    });

    if (!result.ok) {
      form.setError("root", {
        message: result.error.friendlyMessage ?? result.error.message,
      });
      return;
    }

    setVerificationEmail(values.email);
    setVerificationId(result.data.verificationId);
  }

  async function confirmRegistration(
    values: z.infer<typeof registrationConfirmationSchema>,
  ) {
    if (!verificationId) return;
    confirmationForm.clearErrors("root");

    const result = await writer("POST /auth/register/confirm", {
      body: { verificationId, code: values.code },
      silent: true,
    });
    if (!result.ok) {
      confirmationForm.setError("root", {
        message: result.error.friendlyMessage ?? result.error.message,
      });
      return;
    }

    setUser(result.data.user);
    navigate(appRoutes.home, { replace: true });
  }

  async function resendConfirmationCode() {
    if (!verificationId) return;
    confirmationForm.clearErrors("root");
    setIsResending(true);

    const result = await writer("POST /auth/register/resend", {
      body: { verificationId },
      silent: true,
    });
    setIsResending(false);

    if (!result.ok) {
      confirmationForm.setError("root", {
        message: result.error.friendlyMessage ?? result.error.message,
      });
      return;
    }

    confirmationForm.reset();
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4 sm:p-8">
      <Card
        aria-label="Acesso ao CarecaHub"
        className="w-full max-w-4xl overflow-hidden rounded-xl border bg-card p-0 shadow-sm ring-0 md:h-[min(44rem,calc(100dvh-4rem))] md:grid-cols-[0.9fr_1.1fr]"
        style={{
          backgroundImage: isMobile
            ? "radial-gradient(circle at bottom, color-mix(in srgb, var(--highlight) 25%, transparent), transparent 70%)"
            : "radial-gradient(circle at bottom left, color-mix(in srgb, var(--highlight) 25%, transparent), transparent 70%)",
        }}
      >
        <div className="flex flex-col px-6 py-6 sm:px-8 md:py-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/carecahub.png"
              alt=""
              className="size-9 object-contain"
            />
            <span className="text-lg font-semibold">
              Careca<span className="text-highlight-soft-foreground">Hub</span>
            </span>
          </div>
          {verificationId ? (
            <form
              className="my-auto w-full space-y-5 py-6 md:py-4"
              noValidate
              onSubmit={confirmationForm.handleSubmit(confirmRegistration)}
            >
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Confirme seu e-mail.
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos para {verificationEmail}.
                </p>
              </div>
              <FormSchemaProvider schema={registrationConfirmationSchema}>
                <FieldGroup>
                  <LabeledInput
                    label="Código de confirmação"
                    showRequiredIndicator={true}
                    id="register-confirmation-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="h-10 text-center tracking-[0.4em]"
                    {...confirmationForm.register("code", {
                      onChange: (event) => {
                        event.target.value = event.target.value.replace(
                          /\D/g,
                          "",
                        );
                      },
                    })}
                    error={confirmationForm.formState.errors.code?.message}
                  />
                  <FieldError
                    errors={[confirmationForm.formState.errors.root]}
                  />
                </FieldGroup>
              </FormSchemaProvider>
              <Button
                variant="highlight"
                className="h-10 w-full"
                type="submit"
                disabled={confirmationForm.formState.isSubmitting}
              >
                {confirmationForm.formState.isSubmitting
                  ? "Confirmando…"
                  : "Confirmar e-mail"}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-x-1 text-xs text-muted-foreground">
                <span>Não recebeu o código?</span>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-bold hover:underline"
                  disabled={isResending}
                  onClick={resendConfirmationCode}
                >
                  {isResending ? "Reenviando…" : "Reenviar"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-bold hover:underline"
                  onClick={() => {
                    confirmationForm.reset();
                    setVerificationId(null);
                  }}
                >
                  Alterar e-mail
                </Button>
              </div>
            </form>
          ) : (
            <form
              className="w-full space-y-5 py-6 md:py-4 mt-6"
              noValidate
              onSubmit={form.handleSubmit(submit)}
            >
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Crie sua conta.
                </h1>
                <p className="text-sm text-muted-foreground">
                  Cadastre-se para acompanhar sua turma.
                </p>
              </div>
              <FormSchemaProvider schema={registerSchema}>
                <FieldGroup>
                  <div className="flex flex-row w-full gap-3">
                    <div className="w-[70%]">
                      <LabeledInput
                        label="Nome completo"
                        showRequiredIndicator={true}
                        id="register-name"
                        autoComplete="name"
                        className="h-10"
                        {...form.register("name")}
                        error={form.formState.errors.name?.message}
                      />
                    </div>
                    <div className="w-[30%]">
                      <LabeledInput
                        label="Turma"
                        showRequiredIndicator={true}
                        id="register-classroom"
                        type="text"
                        maxLength={1}
                        className="h-10"
                        {...form.register("classroom")}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase();
                          form.register("classroom").onChange(e);
                        }}
                        error={form.formState.errors.classroom?.message}
                      />
                    </div>
                  </div>

                  <div className="flex flex-row w-full gap-3">
                    <div className="w-[70%]">
                      <LabeledInput
                        label="E-mail institucional"
                        showRequiredIndicator={true}
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        className="h-10"
                        {...form.register("email")}
                        error={form.formState.errors.email?.message}
                      />
                    </div>
                    <div className="w-[30%]">
                      <LabeledInput
                        label="Matrícula"
                        showRequiredIndicator={true}
                        id="register-registration"
                        type="number"
                        inputMode="numeric"
                        className="h-10"
                        {...form.register("registration")}
                        error={form.formState.errors.registration?.message}
                      />
                    </div>
                  </div>

                  <LabeledInput
                    label="Senha"
                    showRequiredIndicator={true}
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    className="h-10"
                    {...form.register("password")}
                    error={form.formState.errors.password?.message}
                  />
                  <LabeledInput
                    label="Confirmar senha"
                    showRequiredIndicator={true}
                    showPasswordToggle={false}
                    id="register-password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    className="h-10"
                    {...form.register("passwordConfirmation")}
                    error={form.formState.errors.passwordConfirmation?.message}
                  />
                  <FieldError errors={[form.formState.errors.root]} />
                </FieldGroup>
              </FormSchemaProvider>
              <Button
                variant="highlight"
                className="h-10 w-full"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Criando conta…" : "Criar conta"}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-x-1 text-xs text-muted-foreground">
                <span>Já possui conta?</span>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-bold hover:underline"
                  onClick={() => navigate("/login", { replace: true })}
                  aria-label="Entrar"
                >
                  Entrar
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </main>
  );
}
