import { describe, expect, it } from 'vitest'
import { projectFormSchema, technologyOptions } from '../src/types/project.ts'

const validProject = {
  name: 'CarecaHub Web',
  description: 'Plataforma para organizar projetos acadêmicos.',
  technologies: ['react', 'typescript'],
  usesOtherTechnology: false,
  otherTechnology: '',
  dependencyManager: 'pnpm',
  otherDependencyManager: '',
  versionControl: 'git',
  otherVersionControl: '',
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
        dependencyManager: expect.any(Array),
        versionControl: expect.any(Array),
        repositoryType: expect.any(Array),
      })
    }

    const missingTechnology = projectFormSchema.safeParse({
      ...validProject,
      technologies: [],
    })
    expect(missingTechnology.success).toBe(false)
    if (!missingTechnology.success) {
      expect(missingTechnology.error.flatten().fieldErrors.technologies).toEqual([
        'Selecione pelo menos uma tecnologia.',
      ])
    }
  })

  it('requires a custom value when Other is selected', () => {
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

  it('requires a custom dependency manager when Other is selected', () => {
    const result = projectFormSchema.safeParse({
      ...validProject,
      dependencyManager: 'other',
      otherDependencyManager: '   ',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.otherDependencyManager).toEqual([
        'Informe o outro gerenciador de dependências.',
      ])
    }
  })

  it('requires a custom version-control system when Other is selected', () => {
    const result = projectFormSchema.safeParse({
      ...validProject,
      versionControl: 'other',
      otherVersionControl: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.otherVersionControl).toEqual([
        'Informe o outro sistema de controle de versão.',
      ])
    }
  })

  it('offers a broad fixed technology list without duplicate values', () => {
    expect(technologyOptions.length).toBeGreaterThanOrEqual(30)
    expect(new Set(technologyOptions.map((option) => option.value)).size).toBe(
      technologyOptions.length,
    )
  })
})
