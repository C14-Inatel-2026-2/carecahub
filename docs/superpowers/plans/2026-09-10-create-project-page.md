# Create Project Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a protected `/my-project/create` page where students can validate and locally submit project details, with confirmation before discarding a changed form.

**Architecture:** Keep project form validation and option constants in `web/src/types/project.ts`, and keep page-only form rendering and navigation behavior in `CreateProjectPage`. Reuse the existing React Hook Form, Zod, shadcn/Base UI, routing, and toast patterns; do not add persistence or API code.

**Tech Stack:** React 19, TypeScript, React Router, React Hook Form, Zod, Base UI/shadcn components, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-create-project-page-design.md`

## Global Constraints

- The page component must live at `web/src/modules/my-project/create-project-page.tsx`.
- The route must be exactly `/my-project/create` and must be authorized for `student` users.
- Submission is local only: validate, show a success toast, and navigate to `/my-project`; do not call an API or persist data.
- The explicit back button must confirm before discarding a dirty form; browser back, reload, and tab-close interception are out of scope.
- Use existing shadcn/Tailwind primitives and repository form patterns; add no dependency or generic form framework.

---

### Task 1: Project form schema and fixed options

**Files:**
- Create: `web/src/types/project.ts`
- Create: `web/tests/project.test.ts`

**Interfaces:**
- Produces: `technologyOptions`, `dependencyManagerOptions`, `versionControlOptions`, and `repositoryTypeOptions`, each as a readonly `{ value: string; label: string }[]`.
- Produces: `projectFormSchema`, `ProjectFormInput = z.input<typeof projectFormSchema>`, and `ProjectFormValues = z.output<typeof projectFormSchema>`.
- Validation contract: trimmed non-empty name and description; at least one fixed technology or a non-empty custom technology; required dependency manager, version-control system, and repository type.

- [ ] **Step 1: Write the failing schema tests**

Create `web/tests/project.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { projectFormSchema, technologyOptions } from '../src/types/project.ts'

const validProject = {
  name: 'CarecaHub Web',
  description: 'Plataforma para organizar projetos acadêmicos.',
  technologies: ['react', 'typescript'],
  usesOtherTechnology: false,
  otherTechnology: '',
  dependencyManager: 'pnpm',
  versionControl: 'git',
  repositoryType: 'monorepo',
}

describe('projectFormSchema', () => {
  it('accepts a complete project with multiple fixed technologies', () => {
    expect(projectFormSchema.parse(validProject)).toEqual(validProject)
  })

  it('rejects missing required project fields', () => {
    const result = projectFormSchema.safeParse({
      ...validProject,
      name: '',
      description: '',
      technologies: [],
      dependencyManager: '',
      versionControl: '',
      repositoryType: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        name: expect.any(Array),
        description: expect.any(Array),
        technologies: expect.any(Array),
        dependencyManager: expect.any(Array),
        versionControl: expect.any(Array),
        repositoryType: expect.any(Array),
      })
    }
  })

  it('requires a custom value when the Other option is selected', () => {
    const result = projectFormSchema.safeParse({
      ...validProject,
      technologies: [],
      usesOtherTechnology: true,
      otherTechnology: '   ',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.otherTechnology).toEqual([
        'Informe a outra tecnologia.',
      ])
    }
  })

  it('accepts a custom technology without a fixed technology', () => {
    const result = projectFormSchema.parse({
      ...validProject,
      technologies: [],
      usesOtherTechnology: true,
      otherTechnology: 'Elixir',
    })

    expect(result.otherTechnology).toBe('Elixir')
  })

  it('offers a broad fixed technology list without duplicate values', () => {
    expect(technologyOptions.length).toBeGreaterThanOrEqual(30)
    expect(new Set(technologyOptions.map((option) => option.value)).size).toBe(
      technologyOptions.length,
    )
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd web && pnpm vitest run tests/project.test.ts`

Expected: FAIL because `../src/types/project.ts` does not exist.

- [ ] **Step 3: Implement the option constants and schema**

Create `web/src/types/project.ts` with readonly options covering common languages, frameworks, databases, mobile, cloud, and tooling. Use these exact value sets:

```ts
import { z } from 'zod'

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
] as const

export const versionControlOptions = [
  { value: 'git', label: 'Git' },
  { value: 'mercurial', label: 'Mercurial' },
  { value: 'subversion', label: 'Subversion' },
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
    versionControl: z.enum(versionControlValues, {
      error: 'Selecione o sistema de controle de versão.',
    }),
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
  })

export type ProjectFormInput = z.input<typeof projectFormSchema>
export type ProjectFormValues = z.output<typeof projectFormSchema>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd web && pnpm vitest run tests/project.test.ts`

Expected: 5 tests PASS.

- [ ] **Step 5: Commit the schema deliverable**

```bash
git add web/src/types/project.ts web/tests/project.test.ts
git commit -m "feat: add project form schema"
```

---

### Task 2: Protected route and entry-point navigation

**Files:**
- Modify: `web/src/router/routes.ts`
- Modify: `web/src/router/index.tsx`
- Modify: `web/src/components/layout/auth-layout.tsx`
- Modify: `web/src/modules/my-project/my-project-page.tsx`
- Create: `web/src/modules/my-project/create-project-page.tsx`

**Interfaces:**
- Consumes: `appRoutes`, `pagesByRole`, React Router navigation.
- Produces: `appRoutes.createMyProject` with literal value `/my-project/create`.
- Produces: an authenticated router entry rendering `CreateProjectPage` and student authorization for that exact route.

- [ ] **Step 1: Add the route constant and minimal page component**

Add this property to `appRoutes` in `web/src/router/routes.ts`:

```ts
createMyProject: '/my-project/create',
```

Create the initial `web/src/modules/my-project/create-project-page.tsx`:

```tsx
export function CreateProjectPage() {
  return <section>Criação de projeto</section>
}
```

- [ ] **Step 2: Register and authorize the route**

Import `CreateProjectPage` in `web/src/router/index.tsx` and add a sibling route below `appRoutes.myProject`:

```tsx
{
  path: appRoutes.createMyProject,
  children: [{ index: true, Component: CreateProjectPage }],
},
```

In `web/src/components/layout/auth-layout.tsx`, change the student entry to:

```ts
student: [...commonPages, appRoutes.myProject, appRoutes.createMyProject],
```

- [ ] **Step 3: Link the existing create button to the new route**

In `web/src/modules/my-project/my-project-page.tsx`, remove the temporary `toast` import, import `useNavigate` and `appRoutes`, initialize `const navigate = useNavigate()`, and change the button to:

```tsx
<Button type="button" onClick={() => navigate(appRoutes.createMyProject)}>
  <Plus />
  Criar projeto
</Button>
```

- [ ] **Step 4: Verify route wiring and types**

Run: `cd web && pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `cd web && pnpm test`

Expected: all existing tests plus the Task 1 schema tests PASS.

- [ ] **Step 5: Commit the route deliverable**

```bash
git add web/src/router/routes.ts web/src/router/index.tsx web/src/components/layout/auth-layout.tsx web/src/modules/my-project/my-project-page.tsx web/src/modules/my-project/create-project-page.tsx
git commit -m "feat: add create project route"
```

---

### Task 3: Responsive project form and discard confirmation

**Files:**
- Modify: `web/src/modules/my-project/create-project-page.tsx`

**Interfaces:**
- Consumes: all exports from `web/src/types/project.ts` created in Task 1.
- Consumes: `InputFF`, `TextAreaFF`, `Checkbox`, `Select`, `Dialog`, `Button`, `Field`, React Hook Form, `appRoutes`, `useNavigate`, and `toast`.
- Produces: a responsive form whose submit handler accepts `ProjectFormValues`, shows `toast.success('Projeto criado')`, and navigates to `appRoutes.myProject`.
- Produces: `requestBack()`, which navigates immediately when `form.formState.isDirty` is false and opens the discard dialog when it is true.

- [ ] **Step 1: Configure form state and page shell**

Replace the placeholder page with a `CreateProjectPage` using:

```tsx
const navigate = useNavigate()
const [discardOpen, setDiscardOpen] = useState(false)
const form = useForm<ProjectFormInput, unknown, ProjectFormValues>({
  resolver: zodResolver(projectFormSchema),
  defaultValues: {
    name: '',
    description: '',
    technologies: [],
    usesOtherTechnology: false,
    otherTechnology: '',
    dependencyManager: undefined,
    versionControl: undefined,
    repositoryType: undefined,
  },
})
const usesOtherTechnology = useWatch({
  control: form.control,
  name: 'usesOtherTechnology',
})

function requestBack() {
  if (form.formState.isDirty) {
    setDiscardOpen(true)
    return
  }
  navigate(appRoutes.myProject)
}

function submit(_values: ProjectFormValues) {
  toast.success('Projeto criado')
  navigate(appRoutes.myProject)
}
```

Render a full-width responsive section with a top-left back button and heading:

```tsx
<section className="flex w-full flex-1 flex-col px-4 py-5 md:px-6 lg:px-8">
  <Button type="button" variant="ghost" className="w-fit" onClick={requestBack}>
    <ArrowLeft />
    Voltar
  </Button>
  <div className="mx-auto mt-4 w-full max-w-4xl">
    <h1 className="text-xl font-medium">Criar projeto</h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Preencha os dados iniciais do projeto do seu grupo.
    </p>
    {/* FormProvider and form from the following steps */}
  </div>
</section>
```

- [ ] **Step 2: Render basic text fields**

Inside `FormProvider`, render a native form with `noValidate`, `onSubmit={form.handleSubmit(submit)}`, and:

```tsx
<div className="grid gap-5">
  <InputFF name="name" label="Nome do projeto" />
  <TextAreaFF
    name="description"
    label="Descrição"
    rows={5}
    maxLength={1000}
  />
</div>
```

- [ ] **Step 3: Render fixed and custom technology controls**

Use one `Controller` for `technologies`. For each `technologyOptions` entry, render a labeled `Checkbox` whose `checked` state is `field.value.includes(option.value)` and whose `onCheckedChange` adds or removes that value without mutation:

```tsx
<Controller
  control={form.control}
  name="technologies"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Tecnologias utilizadas</FieldLabel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {technologyOptions.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={field.value.includes(option.value)}
              onCheckedChange={(checked) => {
                field.onChange(
                  checked
                    ? [...field.value, option.value]
                    : field.value.filter((value) => value !== option.value),
                )
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError errors={[fieldState.error]} />
    </Field>
  )}
/>
```

Add a second `Controller` for `usesOtherTechnology`, rendering a labeled checkbox with text `Outra`. When `usesOtherTechnology` is true, render:

```tsx
<InputFF
  name="otherTechnology"
  label="Outra tecnologia"
  placeholder="Outra"
/>
```

- [ ] **Step 4: Render the three required single-select fields**

For each of `dependencyManager`, `versionControl`, and `repositoryType`, use a `Controller`, `Field`, `FieldLabel`, `Select`, full-width `SelectTrigger`, `SelectValue`, `SelectContent`, mapped `SelectItem` values, and `FieldError`. The dependency-manager implementation must follow this concrete shape; repeat it with the corresponding name, label, placeholder, and options for the other two fields:

```tsx
<Controller
  control={form.control}
  name="dependencyManager"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="dependency-manager">Gerenciador de dependências</FieldLabel>
      <Select value={field.value ?? null} onValueChange={field.onChange}>
        <SelectTrigger
          id="dependency-manager"
          className="w-full"
          aria-invalid={fieldState.invalid}
        >
          <SelectValue placeholder="Selecione um gerenciador" />
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
```

Place the three fields in `className="grid gap-5 md:grid-cols-2"`; the repository type may occupy either grid column without adding a custom layout abstraction.

- [ ] **Step 5: Add submit action and centered discard dialog**

At the end of the form render:

```tsx
<div className="flex justify-end border-t pt-5">
  <Button type="submit">Criar projeto</Button>
</div>
```

Render this controlled dialog as a sibling of the page section:

```tsx
<Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Voltar?</DialogTitle>
      <DialogDescription>
        Os dados preenchidos serão perdidos. Deseja descartar as alterações?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={() => setDiscardOpen(false)}>
        Continuar editando
      </Button>
      <Button type="button" onClick={() => navigate(appRoutes.myProject)}>
        Descartar e voltar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Return the page section and dialog in a fragment. Do not intercept browser navigation or add persistence.

- [ ] **Step 6: Verify the completed page**

Run: `cd web && pnpm vitest run tests/project.test.ts`

Expected: 5 tests PASS.

Run: `cd web && pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `cd web && pnpm test`

Expected: all test files PASS.

Run: `cd web && pnpm build`

Expected: PASS. If it fails in unrelated pre-existing code, record the exact file and diagnostic without modifying unrelated files.

- [ ] **Step 7: Commit the completed form**

```bash
git add web/src/modules/my-project/create-project-page.tsx
git commit -m "feat: build project creation form"
```

---

### Task 4: Final requirement and regression verification

**Files:**
- Review: `web/src/types/project.ts`
- Review: `web/src/modules/my-project/create-project-page.tsx`
- Review: `web/src/modules/my-project/my-project-page.tsx`
- Review: `web/src/router/routes.ts`
- Review: `web/src/router/index.tsx`
- Review: `web/src/components/layout/auth-layout.tsx`

**Interfaces:**
- Consumes: the completed schema, page, routing, and authorization behavior from Tasks 1–3.
- Produces: evidence that the implementation meets every accepted requirement without API integration.

- [ ] **Step 1: Check the diff for accidental or malformed changes**

Run: `git diff --check HEAD~3..HEAD`

Expected: no whitespace errors.

- [ ] **Step 2: Run all frontend checks**

Run: `cd web && pnpm test`

Expected: all tests PASS.

Run: `cd web && pnpm typecheck`

Expected: PASS.

Run: `cd web && pnpm lint`

Expected: PASS, or report only pre-existing diagnostics with exact files; do not bulk-format unrelated files.

Run: `cd web && pnpm build`

Expected: PASS, or report only pre-existing diagnostics with exact files.

- [ ] **Step 3: Manually inspect the accepted behavior in the browser**

Run: `cd web && pnpm dev`

Verify all of these observable outcomes:

1. A student can open `/my-project/create`; unauthorized roles are redirected by `AuthLayout`.
2. The button on `/my-project` opens the new page.
3. The form shows every required field and remains usable at narrow and wide viewport sizes.
4. Multiple fixed technologies can be selected.
5. Selecting `Outra` reveals the input with placeholder `Outra` and submitting it blank shows an error.
6. Clicking `Voltar` on an untouched form returns immediately.
7. Clicking `Voltar` after any edit opens the centered confirmation dialog.
8. `Continuar editando` preserves form values; `Descartar e voltar` returns to `/my-project`.
9. A valid submit shows `Projeto criado` and returns to `/my-project` without a network request.

- [ ] **Step 4: Commit only if verification required a scoped correction**

If verification exposed a defect in the files listed above, fix it through a focused red-green cycle, then commit only that correction:

```bash
git add web/src/types/project.ts web/tests/project.test.ts web/src/modules/my-project/create-project-page.tsx web/src/modules/my-project/my-project-page.tsx web/src/router/routes.ts web/src/router/index.tsx web/src/components/layout/auth-layout.tsx
git commit -m "fix: verify project creation flow"
```

If no correction was necessary, do not create an empty commit.
