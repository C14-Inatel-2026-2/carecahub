import { z } from 'zod'
import type { Repository } from './repository'

export const technologyOptions = [
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'vue', label: 'Vue' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'express', label: 'Express' },
  { value: 'java', label: 'Java' },
  { value: 'spring-boot', label: 'Spring Boot' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'python', label: 'Python' },
  { value: 'django', label: 'Django' },
  { value: 'fastapi', label: 'FastAPI' },
  { value: 'csharp', label: 'C#' },
  { value: 'dotnet', label: '.NET' },
  { value: 'php', label: 'PHP' },
  { value: 'laravel', label: 'Laravel' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rails', label: 'Ruby on Rails' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'flutter', label: 'Flutter' },
  { value: 'react-native', label: 'React Native' },
  { value: 'swift', label: 'Swift' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'firebase', label: 'Firebase' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'aws', label: 'AWS' },
  { value: 'azure', label: 'Azure' },
  { value: 'google-cloud', label: 'Google Cloud' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'rest', label: 'REST' },
] as const

export const dependencyManagerOptions = [
  { value: 'npm', label: 'npm' },
  { value: 'pnpm', label: 'pnpm' },
  { value: 'yarn', label: 'Yarn' },
  { value: 'bun', label: 'Bun' },
  { value: 'maven', label: 'Maven' },
  { value: 'gradle', label: 'Gradle' },
  { value: 'pip', label: 'pip' },
  { value: 'poetry', label: 'Poetry' },
  { value: 'composer', label: 'Composer' },
  { value: 'nuget', label: 'NuGet' },
  { value: 'cargo', label: 'Cargo' },
  { value: 'go-modules', label: 'Go Modules' },
  { value: 'other', label: 'Outro' },
] as const

export const versionControlOptions = [
  { value: 'git', label: 'Git' },
  { value: 'mercurial', label: 'Mercurial' },
  { value: 'subversion', label: 'Subversion' },
  { value: 'other', label: 'Outro' },
] as const

export const repositoryTypeOptions = [
  { value: 'monorepo', label: 'Monorepo' },
  { value: 'multirepo', label: 'Multirepo' },
] as const

const technologyValues = technologyOptions.map((option) => option.value) as [
  (typeof technologyOptions)[number]['value'],
  ...(typeof technologyOptions)[number]['value'][],
]
const dependencyManagerValues = dependencyManagerOptions.map((option) => option.value) as [
  (typeof dependencyManagerOptions)[number]['value'],
  ...(typeof dependencyManagerOptions)[number]['value'][],
]
const versionControlValues = versionControlOptions.map((option) => option.value) as [
  (typeof versionControlOptions)[number]['value'],
  ...(typeof versionControlOptions)[number]['value'][],
]
const repositoryTypeValues = repositoryTypeOptions.map((option) => option.value) as [
  (typeof repositoryTypeOptions)[number]['value'],
  ...(typeof repositoryTypeOptions)[number]['value'][],
]

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome do projeto.'),
    description: z.string().trim().min(1, 'Informe a descrição do projeto.'),
    technologies: z.array(z.enum(technologyValues)),
    usesOtherTechnology: z.boolean(),
    otherTechnology: z.string().trim(),
    dependencyManager: z.enum(dependencyManagerValues, {
      error: 'Selecione o gerenciador de dependências.',
    }),
    otherDependencyManager: z.string().trim(),
    versionControl: z.enum(versionControlValues, {
      error: 'Selecione o sistema de controle de versão.',
    }),
    otherVersionControl: z.string().trim(),
    repositoryType: z.enum(repositoryTypeValues, {
      error: 'Selecione o tipo de repositório.',
    }),
  })
  .superRefine((project, context) => {
    if (project.technologies.length === 0 && !project.usesOtherTechnology) {
      context.addIssue({
        code: 'custom',
        path: ['technologies'],
        message: 'Selecione pelo menos uma tecnologia.',
      })
    }
    if (project.usesOtherTechnology && project.otherTechnology.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['otherTechnology'],
        message: 'Informe a outra tecnologia.',
      })
    }
    if (project.dependencyManager === 'other' && project.otherDependencyManager.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['otherDependencyManager'],
        message: 'Informe o outro gerenciador de dependências.',
      })
    }
    if (project.versionControl === 'other' && project.otherVersionControl.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['otherVersionControl'],
        message: 'Informe o outro sistema de controle de versão.',
      })
    }
  })

export const REPOSITORY_TYPE = ['monorepo', 'multirepo'] as const
export type RepositoryType = (typeof REPOSITORY_TYPE)[number]

export const PROJECT_TAGS = ['monorepo', 'multirepo', 'missing_repo'] as const
export type ProjectTag = (typeof PROJECT_TAGS)[number]

export const projectTagLabels: Record<ProjectTag, string> = {
  monorepo: 'MONOREPO',
  multirepo: 'MULTIREPO',
  missing_repo: 'SEM REPOSITORIO',
}

export type Project = {
  id: string
  groupId?: string
  projectName: string
  description?: string
  technologies?: string[]
  usesOtherTechnology?: boolean
  otherTechnology?: string | null
  dependencyManager?: string
  otherDependencyManager?: string | null
  versionControl?: string
  otherVersionControl?: string | null
  repositoryType?: RepositoryType | null
  tags?: ProjectTag[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
  repositories: Repository[]
  commitCount: number
  branchCount: number
}

export type GetProjectResponse = Project

export type ProjectFormInput = z.input<typeof projectFormSchema>
export type ProjectFormValues = z.output<typeof projectFormSchema>
export type CreateProjectRequest = ProjectFormValues & { groupId?: string }
export type UpdateProjectRequest = ProjectFormValues
