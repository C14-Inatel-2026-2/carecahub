import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { GetProjectDto } from './get-project.dto'

const baseProject = {
  id: 'project-id',
  groupId: 'group-id',
  projectName: 'CarecaHub',
  description: 'Plataforma de acompanhamento de projetos',
  technologies: ['typescript'],
  usesOtherTechnology: false,
  otherTechnology: null,
  dependencyManager: 'pnpm',
  otherDependencyManager: null,
  versionControl: 'git',
  otherVersionControl: null,
  repositoryType: 'multirepo' as const,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  deletedAt: null,
}

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

  it('sums commits and branches from every repository and drops the missing_repo tag', () => {
    const result = GetProjectDto.toDto(baseProject, [
      {
        id: 'repo-1',
        url: 'https://github.com/acme/web',
        ownerId: 'owner-id',
        projectId: 'project-id',
        commitCount: 12,
        branchCount: 2,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'repo-2',
        url: 'https://github.com/acme/api',
        ownerId: 'owner-id',
        projectId: 'project-id',
        commitCount: 8,
        branchCount: 1,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ])

    assert.equal(result.commitCount, 20)
    assert.equal(result.branchCount, 3)
    assert.deepEqual(result.tags, ['multirepo'])
  })

  it('omits deletedAt for an active project and keeps the date for a removed one', () => {
    const active = GetProjectDto.toDto(baseProject)
    const removed = GetProjectDto.toDto({
      ...baseProject,
      deletedAt: new Date('2026-03-01T00:00:00Z'),
    })

    assert.equal(active.deletedAt, undefined)
    assert.deepEqual(removed.deletedAt, new Date('2026-03-01T00:00:00Z'))
  })
})