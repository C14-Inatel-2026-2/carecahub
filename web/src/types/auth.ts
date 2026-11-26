import { z } from "zod";
import { registrationSchema, type UserRole } from "@/types/user";

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = Omit<z.infer<typeof registerSchema>, "passwordConfirmation">;

export type TwoFactorAuthRequest = {
  email: string;
  code: string;
};

export type RegistrationConfirmationRequest = {
  verificationId: string;
  code: string;
};

export type RegistrationVerificationResponse = {
  verificationId: string;
};

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.");

export const loginSchema = z.object({
  username: z.email("Informe um e-mail válido."),
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo."),
  email: z.email("Informe um e-mail válido."),
  registration: registrationSchema.refine(
    (registration) => registration !== undefined,
    "Informe uma matrícula válida.",
  ),
  password: passwordSchema,
  passwordConfirmation: z.string(),
}).refine(({ password, passwordConfirmation }) => password === passwordConfirmation, {
  message: "As senhas não coincidem.",
  path: ["passwordConfirmation"],
});

export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, "A senha atual é obrigatória."),
  newPassword: passwordSchema,
});

export type PasswordChangeRequest = z.infer<typeof passwordChangeSchema>;
export type RecoverPasswordRequest = { email: string };
export type ResetPasswordRequest = { token: string; password: string };

export type LoggedUser = {
  id: string;
  groupId?: string | null;
  name: string;
  email: string;
  role: UserRole;
};
