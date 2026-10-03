import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { GetGroupDto } from './get-group.dto'

const group = {
  id: 'group-id',
  friendlyId: 'Grupo 1',
  leaderId: 'leader-id',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  deletedAt: null,
}

describe('GetGroupDto', () => {
  it('marks a group without a project and with available member slots', () => {
    const result = GetGroupDto.toDto(group, [], null)

    assert.deepEqual(result.tags, ['space_available', 'no_project'])
    assert.deepEqual(result.members, [])
    assert.equal(result.project, null)
  })

  it('marks a group with six members as full', () => {
    const members = Array.from({ length: 6 }, (_, index) => ({ id: `member-${index}` }))

    const result = GetGroupDto.toDto(group, members as never, null)

    assert.equal(result.tags.includes('full'), true)
    assert.equal(result.tags.includes('space_available'), false)
  })
})
