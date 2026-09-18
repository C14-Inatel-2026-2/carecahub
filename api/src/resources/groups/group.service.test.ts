import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import { ErrKeys, type UserMetadata } from '@/types'
import { GroupService } from './group.service'

function createService() {
  const queries: { text: string; values: unknown[] }[] = []
  const client = {
    async query(query: { text: string }, values: unknown[]) {
      queries.push({ text: query.text, values })
      if (query.text.startsWith('select') && query.text.includes('from "Group"')) {
        return { rows: [['group', 'leader']] }
      }
      if (query.text.startsWith('select')) {
        return { rows: [['member', 'group']] }
      }
      return { rows: [] }
    },
  }
  const service = new GroupService(
    { db: drizzle(client as never) } as never,
    { create: () => ({ error() {} }) } as never,
  )
  return { service, queries }
}

const student = (userId: string) => ({ userId, role: 'student' }) as UserMetadata

describe('GroupService.removeUserFromGroup', () => {
  it.each([
    ['leader removing a member', 'leader', 'member'],
    ['member leaving the group', 'member', 'member'],
  ])('allows %s and scopes the update to that membership', async (_, requesterId, targetId) => {
    const { service, queries } = createService()
    const result = await service.removeUserFromGroup(targetId, 'group', student(requesterId))
    const update = queries.find(query => query.text.startsWith('update'))

    assert.ok(update, 'authorized removal must reach the update')
    assert.match(update.text, /where .*"User"\."id" = \$\d+ and "User"\."group_id" = \$\d+/)
    assert.deepEqual(update.values.slice(-2), [targetId, 'group'])
    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })

  it.each(['member', 'leader'])('rejects another student removing %s', async targetId => {
    const { service, queries } = createService()
    const result = await service.removeUserFromGroup(targetId, 'group', student('outsider'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
    assert.equal(queries.some(query => query.text.startsWith('update')), false)
  })
})
