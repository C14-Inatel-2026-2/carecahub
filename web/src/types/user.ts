import { z } from 'zod'

export const USER_ROLES = ['admin', 'teacher', 'mentor', 'student'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const manageableRolesByRole: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'teacher', 'mentor', 'student'],
  teacher: ['mentor', 'student'],
  mentor: ['student'],
  student: [],
}

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  teacher: 'Professor',
  mentor: 'Monitor',
  student: 'Aluno',
}

export function formatUserRole(role: UserRole | null | undefined) {
  return role ? userRoleLabels[role] : 'Selecione uma função'
}

type AcademicField = 'registration' | 'githubName' | 'classroom'

export const academicFieldsByRole: Record<UserRole, AcademicField[]> = {
  admin: [],
  teacher: [],
  mentor: ['registration', 'githubName'],
  student: ['registration', 'githubName', 'classroom'],
}

const optionalText = (maxLength: number, message: string) =>
  z
    .string()
    .max(maxLength, message)
    .optional()
    .transform((value) => (value === '' ? undefined : value))

const registrationSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.coerce
    .number({ error: 'Informe uma matrícula válida.' })
    .int('A matrícula deve ser um número inteiro.')
    .positive('A matrícula deve ser maior que zero.')
    .optional()
)

const userFieldsSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  registration: registrationSchema,
  githubName: optionalText(39, 'O usuário do GitHub deve ter no máximo 39 caracteres.'),
  classroom: optionalText(2, 'A turma deve ter no máximo 2 caracteres.'),
  email: z.email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .regex(/[a-z]/, 'A senha deve conter uma letra minúscula.')
    .regex(/[A-Z]/, 'A senha deve conter uma letra maiúscula.')
    .regex(/[0-9]/, 'A senha deve conter um número.')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter um símbolo.'),
  role: z.enum(USER_ROLES),
})

type AcademicData = {
  role: UserRole
  registration?: number
  githubName?: string
  classroom?: string
}

const validateAcademicFields = (data: AcademicData, context: z.RefinementCtx) => {
  if (['mentor', 'student'].includes(data.role) && data.registration === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['registration'],
      message: 'A matrícula é obrigatória para alunos e monitores.',
    })
  }
}

const cleanAcademicFields = <T extends AcademicData>(data: T): T => ({
  ...data,
  registration: academicFieldsByRole[data.role].includes('registration')
    ? data.registration
    : undefined,
  githubName: academicFieldsByRole[data.role].includes('githubName') ? data.githubName : undefined,
  classroom: academicFieldsByRole[data.role].includes('classroom') ? data.classroom : undefined,
})

export const createUserSchema = userFieldsSchema
  .superRefine(validateAcademicFields)
  .transform(cleanAcademicFields)

export const updateUserSchema = userFieldsSchema
  .omit({ password: true })
  .superRefine(validateAcademicFields)
  .transform(cleanAcademicFields)
export type CreateUserRequest = z.infer<typeof createUserSchema>

export const userFormSchema = userFieldsSchema
  .extend({ password: z.string().optional() })
  .superRefine(validateAcademicFields)
  .transform(cleanAcademicFields)
export type UpdateUserRequest = z.infer<typeof updateUserSchema>

export type User = {
  id: string
  name: string
  registration: number | null
  githubName: string | null
  classroom: string | null
  email: string
  role: UserRole
  status: 'active' | 'inactive' | 'deleted'
  twoFactor: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export type GetUserResponse = User
