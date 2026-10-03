import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import type { UserMetadata } from '@/types'
import { NotificationService } from './notification.service'

class UpdateResult<T> implements PromiseLike<T> {
  constructor(
    private readonly result: T,
    private readonly writes: Record<string, unknown>[],
  ) {}

  set(values: Record<string, unknown>) {
    this.writes.push(values)
    return this
  }

  where() {
    return this
  }

  returning() {
    return this
  }

  // biome-ignore lint/suspicious/noThenProperty: query builders are intentionally awaitable
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected)
  }
}

describe('NotificationService.markAllAsRead', () => {
  it('marks the requester unread notifications and returns the updated count', async () => {
    const writes: Record<string, unknown>[] = []
    const database = {
      db: {
        update: () => new UpdateResult([{ id: 'one' }, { id: 'two' }], writes),
      },
    }
    const service = new NotificationService(database as never)
    const requester = {
      userId: '48d513dc-5a9e-4f13-9c13-ee27589bb7eb',
      name: 'Student',
      role: 'student',
    } as UserMetadata

    const result = await service.markAllAsRead(requester)

    assert.deepEqual(result, { ok: true, updatedCount: 2 })
    assert.ok(writes[0]?.readAt instanceof Date)
    assert.equal(writes[0]?.updatedAt, writes[0]?.readAt)
  })
})
