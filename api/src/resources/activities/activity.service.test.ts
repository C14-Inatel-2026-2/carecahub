import assert from 'node:assert/strict'
import { activitySubmissions, activityViews, users } from '@db'
import { describe, it } from 'vitest'
import { ErrKeys, type UserMetadata } from '@/types'
import { ActivityService } from './activity.service'

class QueryResult<T> implements PromiseLike<T> {
  constructor(
    private readonly result: T,
    private readonly whereCalls: unknown[][] = [],
  ) {}
  from() {
    return this
  }
  where(...conditions: unknown[]) {
    this.whereCalls.push(conditions)
    return this
  }
  orderBy() {
    return this
  }
  offset() {
    return this
  }
  limit() {
    return this
  }
  leftJoin() {
    return this
  }
  innerJoin() {
    return this
  }
  values() {
    return this
  }
  returning() {
    return this
  }
  onConflictDoNothing() {
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

const activityId = '48d513dc-5a9e-4f13-9c13-ee27589bb7eb'
const groupId = 'a761f798-c361-4a22-ab01-244dd3b4124a'
const requester = (role: UserMetadata['role'], userId = 'user-id') =>
  ({ userId, name: 'User', role }) as UserMetadata

const input = {
  title: 'Entrega da primeira atividade',
  description: 'Envie os arquivos e links solicitados.',
  dueAt: '2026-11-20T23:59:00.000-03:00',
  allowLateSubmissions: false,
  submissionType: 'both' as const,
  attachmentIds: [],
}

function createService(
  results: unknown[],
  groupService: { findOne: (id: string) => Promise<unknown> } = {
    findOne: async () => ({ ok: false, errKey: ErrKeys.notFound }),
  },
  gitHubService: { getRepositoryOpenGraphImageUrl: (url: string) => Promise<string | null> } = {
    getRepositoryOpenGraphImageUrl: async () => null,
  },
) {
  const whereCalls: unknown[][] = []
  const next = () => new QueryResult(results.shift(), whereCalls)
  const db = {
    select: next,
    insert: next,
    update: next,
    transaction: async (run: (tx: typeof db) => unknown) => run(db),
  }
  const notifications = { createActivityNotifications: async () => 0 }
  return Object.assign(
    new ActivityService(
      { db } as never,
      notifications as never,
      groupService as never,
      gitHubService as never,
    ),
    { whereCalls },
  )
}

function includesReference(
  value: unknown,
  expected: unknown,
  seen = new WeakSet<object>(),
): boolean {
  if (value === expected) return true
  if (!value || typeof value !== 'object' || seen.has(value)) return false
  seen.add(value)
  return Object.values(value).some((entry) => includesReference(entry, expected, seen))
}

describe('ActivityService.create', () => {
  it('forbids students from publishing an activity', async () => {
    const result = await createService([]).create(input, requester('student'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('rejects publication when there are no active groups to snapshot', async () => {
    const result = await createService([[]]).create(input, requester('teacher'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.invalidPayload })
  })
})

describe('ActivityService.findAll', () => {
  it('includes the requester group submission status for student activity lists', async () => {
    const submittedAt = new Date('2026-11-20T20:00:00.000Z')
    const activities = [
      {
        id: activityId,
        title: input.title,
        description: input.description,
        dueAt: new Date(input.dueAt),
        allowLateSubmissions: false,
        submissionType: 'both' as const,
        createdById: 'teacher-id',
        publishedAt: new Date(),
        deadlineRevision: 1,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '510a8f36-3a79-4f7f-85aa-f7cfdd0e2476',
        title: 'Atividade pendente',
        description: input.description,
        dueAt: new Date('2026-11-22T23:59:00.000Z'),
        allowLateSubmissions: false,
        submissionType: 'files' as const,
        createdById: 'teacher-id',
        publishedAt: new Date(),
        deadlineRevision: 1,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]
    const service = createService([
      [{ groupId }],
      activities,
      activities.map((activity) => ({ activityId: activity.id })),
      [
        { id: 'submission-id', activityId, version: 2, submittedAt, isLate: false },
        {
          id: 'previous-submission-id',
          activityId,
          version: 1,
          submittedAt: new Date('2026-11-19T20:00:00.000Z'),
          isLate: true,
        },
      ],
      [],
      [],
    ])

    const result = await service.findAll({ skip: 0, take: 20 }, requester('student'))

    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.deepEqual(
      result.data.map((activity) => activity.submission),
      [
        { id: 'submission-id', submittedAt, isLate: false },
        null,
      ],
    )
  })

  it('includes reference attachments for every listed activity', async () => {
    const activity = {
      id: activityId,
      title: input.title,
      description: input.description,
      dueAt: new Date(input.dueAt),
      allowLateSubmissions: false,
      submissionType: 'both' as const,
      createdById: 'teacher-id',
      publishedAt: new Date(),
      deadlineRevision: 1,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }
    const service = createService([
      [activity],
      [
        {
          id: 'attachment-id',
          filename: 'rubric.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        },
      ],
    ])

    const result = await service.findAll({ skip: 0, take: 20 }, requester('teacher'))
    const { deletedAt: _deletedAt, ...activityDto } = activity

    assert.deepEqual(result, {
      ok: true,
      totalCount: 1,
      data: [
        {
          ...activityDto,
          attachments: [
            {
              id: 'attachment-id',
              filename: 'rubric.pdf',
              mimeType: 'application/pdf',
              size: 1024,
            },
          ],
        },
      ],
    })
  })
})

describe('ActivityService.findOne', () => {
  it('does not register a view when a student is no longer in an audience group', async () => {
    const database = {
      inserted: false,
      db: {
        select: (() => {
          const results = [
            [
              {
                id: activityId,
                title: input.title,
                description: input.description,
                dueAt: new Date(input.dueAt),
                allowLateSubmissions: false,
                submissionType: 'both',
                createdById: 'teacher-id',
                publishedAt: new Date(),
                deadlineRevision: 1,
                archivedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              },
            ],
            [{ groupId, status: 'active' }],
            [],
          ]
          return () => new QueryResult(results.shift())
        })(),
        insert: () => {
          database.inserted = true
          return new QueryResult([])
        },
      },
    }
    const service = new ActivityService(
      database as never,
      {
        createActivityNotifications: async () => 0,
      } as never,
      { findOne: async () => ({ ok: false, errKey: ErrKeys.notFound }) } as never,
      { getRepositoryOpenGraphImageUrl: async () => null } as never,
    )

    const result = await service.findOne(activityId, requester('student'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
    assert.equal(database.inserted, false)
  })
})

describe('ActivityService.invalidateSubmission', () => {
  it('invalidates a student group delivery before the deadline', async () => {
    const invalidatedAt = new Date('2026-11-25T12:00:00.000Z')
    const service = createService([
      [{ groupId }],
      [{ dueAt: new Date('2099-11-25T12:00:00.000Z') }],
      [{ id: 'submission-id' }],
      [{ invalidatedAt }],
    ])

    const result = await service.invalidateSubmission(
      activityId,
      'submission-id',
      requester('student'),
    )

    assert.deepEqual(result, { ok: true, invalidatedAt })
  })
})

describe('ActivityService.getPipeline', () => {
  it('includes complete group and project details in each pipeline row', async () => {
    const project = {
      id: 'project-id',
      groupId,
      projectName: 'CarecaHub',
      description: 'Projeto da turma',
      technologies: ['TypeScript'],
      usesOtherTechnology: false,
      otherTechnology: null,
      dependencyManager: 'pnpm',
      otherDependencyManager: null,
      versionControl: 'git',
      otherVersionControl: null,
      repositoryType: 'monorepo',
      tags: ['monorepo'],
      repositories: [],
      commitCount: 0,
      branchCount: 0,
      iconUrl: 'https://example.com/project-icon.png',
      thumbnailUrl: null,
      mainColor: '#123456',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const group = {
      id: groupId,
      friendlyId: 'Grupo 1',
      leaderId: 'leader-id',
      tags: ['space_available'],
      members: [],
      project,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const service = createService(
      [
        [{ id: activityId, dueAt: new Date('2026-11-20T23:59:00.000-03:00') }],
        [{ groupId }],
        [],
        [],
      ],
      { findOne: async () => ({ ok: true, ...group }) },
    )

    const result = await service.getPipeline(activityId, requester('teacher'))

    assert.deepEqual(result, {
      ok: true,
      metrics: { viewed: 0, submitted: 0, notViewed: 100 },
      columns: {
        not_viewed: [
          {
            group,
            project,
            viewers: [],
            submission: null,
          },
        ],
        viewed: [],
        submitted: [],
        evaluated: [],
      },
    })
  })
})

describe('ActivityService.getGroupDelivery', () => {
  const project = {
    id: 'project-id',
    groupId,
    projectName: 'CarecaHub',
    description: 'Projeto da turma',
    technologies: ['TypeScript'],
    usesOtherTechnology: false,
    otherTechnology: null,
    dependencyManager: 'pnpm',
    otherDependencyManager: null,
    versionControl: 'git',
    otherVersionControl: null,
    repositoryType: 'monorepo',
    tags: ['monorepo'],
    repositories: [],
    commitCount: 0,
    branchCount: 0,
    iconUrl: 'https://example.com/project-icon.png',
    thumbnailUrl: null,
    mainColor: '#123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const group = {
    id: groupId,
    friendlyId: 'Grupo 1',
    leaderId: 'leader-id',
    tags: ['space_available'],
    members: [],
    project,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('returns only the selected audience group delivery details', async () => {
    const service = createService(
      [
        [{ id: activityId }],
        [{ id: groupId }],
        [{ id: 'viewer-id', name: 'Ana' }],
        [
          {
            id: 'submission-id',
            groupId,
            version: 1,
            isLate: false,
            submittedAt: new Date('2026-10-12T10:00:00.000Z'),
            score: null,
            submittedById: 'student-id',
            submittedByName: 'Ana',
          },
        ],
        [{ id: 'link-id', url: 'https://github.com/carecahub/web' }],
        [{ id: 'file-id', filename: 'delivery.pdf' }],
      ],
      { findOne: async () => ({ ok: true, ...group }) },
      {
        getRepositoryOpenGraphImageUrl: async () =>
          'https://repository-images.githubusercontent.com/1/preview',
      },
    )

    const result = await service.getGroupDelivery(activityId, groupId, requester('teacher'))

    assert.deepEqual(result, {
      ok: true,
      group,
      project,
      viewers: [{ id: 'viewer-id', name: 'Ana' }],
      submissions: [
        {
          id: 'submission-id',
          groupId,
          version: 1,
          isLate: false,
          submittedAt: new Date('2026-10-12T10:00:00.000Z'),
          score: null,
          submittedBy: { id: 'student-id', name: 'Ana' },
          links: [
            {
              id: 'link-id',
              url: 'https://github.com/carecahub/web',
              thumbnailUrl: 'https://repository-images.githubusercontent.com/1/preview',
            },
          ],
          files: [{ id: 'file-id', filename: 'delivery.pdf' }],
        },
      ],
    })
    const viewerFilter = service.whereCalls.find((conditions) =>
      conditions.some((condition) => includesReference(condition, activityViews.groupId)),
    )
    const submissionFilter = service.whereCalls.find((conditions) =>
      conditions.some((condition) => includesReference(condition, activitySubmissions.groupId)),
    )

    assert.ok(viewerFilter)
    assert.ok(viewerFilter.some((condition) => includesReference(condition, users.status)))
    assert.ok(viewerFilter.some((condition) => includesReference(condition, users.deletedAt)))
    assert.ok(submissionFilter)
  })

  it('forbids a group that is not in the activity audience', async () => {
    const service = createService([[{ id: activityId }], []], {
      findOne: async () => ({ ok: true, ...group }),
    })

    const result = await service.getGroupDelivery(activityId, groupId, requester('teacher'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })

  it('returns not found when the selected group does not exist', async () => {
    const service = createService([[{ id: activityId }]])

    const result = await service.getGroupDelivery(activityId, groupId, requester('teacher'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.notFound })
  })
})

describe('ActivityService activity lifecycle', () => {
  it('keeps administrators read-only when editing or archiving', async () => {
    const service = createService([])

    assert.deepEqual(
      await service.update(activityId, { title: 'Título atualizado' }, requester('admin')),
      { ok: false, errKey: ErrKeys.forbidden },
    )
    assert.deepEqual(await service.archive(activityId, requester('admin')), {
      ok: false,
      errKey: ErrKeys.forbidden,
    })
  })

  it('does not expose a private attachment to a student outside its audience', async () => {
    const service = createService([
      [
        {
          id: activityId,
          title: input.title,
          description: input.description,
          dueAt: new Date(input.dueAt),
          allowLateSubmissions: false,
          submissionType: 'both',
          createdById: 'teacher-id',
          publishedAt: new Date(),
          deadlineRevision: 1,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
      [],
    ])

    const result = await service.getAttachmentDownload(activityId, 'file-id', requester('student'))

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.forbidden })
  })
})

describe('ActivityService.upsertEvaluation', () => {
  it('rejects evaluating a historical delivery version', async () => {
    const service = createService([[{ groupId, version: 1 }], [{ version: 2 }]])

    const result = await service.upsertEvaluation(
      activityId,
      'submission-id',
      { score: 90 },
      requester('teacher'),
    )

    assert.deepEqual(result, { ok: false, errKey: ErrKeys.submissionImmutable })
  })
})
