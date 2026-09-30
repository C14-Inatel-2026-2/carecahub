import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { GetProjectDto } from './get-project.dto'

describe('GetProjectDto', () => {
  it('maps every persisted form field and derives the missing repository tag', () => {
    const result = GetProjectDto.toDto({
      id: 'project-id',
      groupId: 'group-id',
      projectName: 'CarecaHub',
      description: 'Descrição',
      technologies: ['typescript'],
      usesOtherTechnology: false,
      otherTechnology: null,
      dependencyManager: 'pnpm',
      otherDependencyManager: null,
      versionControl: 'git',
      otherVersionControl: null,
      repositoryType: 'multirepo',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
      deletedAt: null,
    })

    assert.equal(result.groupId, 'group-id')
    assert.equal(result.description, 'Descrição')
    assert.deepEqual(result.technologies, ['typescript'])
    assert.deepEqual(result.tags, ['multirepo', 'missing_repo'])
  })
})
