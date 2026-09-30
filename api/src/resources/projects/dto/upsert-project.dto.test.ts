import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { describe, it } from 'vitest'
import { UpsertProjectDto } from './upsert-project.dto'

describe('UpsertProjectDto', () => {
  it('accepts every field from the project form', async () => {
    const input = Object.assign(new UpsertProjectDto(), {
      name: 'CarecaHub',
      description: 'Plataforma de acompanhamento de projetos',
      technologies: ['typescript', 'react'],
      usesOtherTechnology: false,
      otherTechnology: '',
      dependencyManager: 'pnpm',
      otherDependencyManager: '',
      versionControl: 'git',
      otherVersionControl: '',
      repositoryType: 'multirepo',
    })

    assert.deepEqual(await validate(input), [])
  })

  it('rejects a project without a description', async () => {
    const input = Object.assign(new UpsertProjectDto(), {
      name: 'CarecaHub',
      technologies: ['typescript'],
      usesOtherTechnology: false,
      dependencyManager: 'pnpm',
      versionControl: 'git',
      repositoryType: 'monorepo',
    })

    const errors = await validate(input)

    assert.equal(
      errors.some((error) => error.property === 'description'),
      true,
    )
  })

  it('accepts an empty predefined technology list when another technology is provided', async () => {
    const input = Object.assign(new UpsertProjectDto(), {
      name: 'CarecaHub',
      description: 'Descrição',
      technologies: [],
      usesOtherTechnology: true,
      otherTechnology: 'Elixir',
      dependencyManager: 'other',
      otherDependencyManager: 'Mix',
      versionControl: 'git',
      repositoryType: 'monorepo',
    })

    assert.deepEqual(await validate(input), [])
  })
})
