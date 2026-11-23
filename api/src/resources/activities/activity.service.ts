import {
  activities,
  activityAttachments,
  activityEvaluations,
  activityGroups,
  activitySubmissionFiles,
  activitySubmissionLinks,
  activitySubmissions,
  activityViews,
  bucketFiles,
  groups,
  projects,
  repositories,
  users,
} from '@db'
import { Injectable } from '@nestjs/common'
import { and, desc, eq, ilike, inArray, isNull } from 'drizzle-orm'
import { BucketService } from '@/providers/bucket/bucket.service'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { GitHubService } from '@/providers/github/github.service'
import { ErrKeys, type UserMetadata } from '@/types'
import { GroupService } from '../groups/group.service'
import { NotificationService } from '../notification/notification.service'
import type {
  ActivityPipelineRow,
  ActivitySubmissionDetail,
  CreateSubmissionOutput,
  GetActivityAttachmentDownloadOutput,
  GetActivityOutput,
  GetGroupDeliveryOutput,
  GetPipelineOutput,
  GetSubmissionFileDownloadOutput,
  ListActivityOutput,
  ListSubmissionOutput,
  PipelineStatus,
  UpsertEvaluationOutput,
} from './activity.interface'
import { IActivityService } from './activity.interface'
import type { ActivityQueryDto } from './dto/activity-query.dto'
import type { CreateActivityDto } from './dto/create-activity.dto'
import type { CreateSubmissionDto } from './dto/create-submission.dto'
import type { GetActivityDto } from './dto/get-activity.dto'
import type { UpdateActivityDto } from './dto/update-activity.dto'
import type { UpsertEvaluationDto } from './dto/upsert-evaluation.dto'

export function calculatePipelineMetrics(statuses: PipelineStatus[]) {
  const total = statuses.length || 1
  return {
    viewed: Math.round((statuses.filter((status) => status !== 'not_viewed').length / total) * 100),
    submitted: Math.round(
      (statuses.filter((status) => status === 'submitted' || status === 'evaluated').length /
        total) *
        100,
    ),
    notViewed: Math.round(
      (statuses.filter((status) => status === 'not_viewed').length / total) * 100,
    ),
  }
}

@Injectable()
export class ActivityService implements IActivityService {
  constructor(
    private readonly database: DrizzleService,
    private readonly notifications: NotificationService,
    private readonly groupService: GroupService,
    private readonly gitHubService: GitHubService,
    private readonly bucket?: BucketService,
  ) {}

  async create(input: CreateActivityDto, requester: UserMetadata): Promise<GetActivityOutput> {
    if (!['admin', 'teacher', 'mentor'].includes(requester.role))
      return { ok: false, errKey: ErrKeys.forbidden }
    const dueAt = new Date(input.dueAt)
    if (Number.isNaN(dueAt.getTime()) || dueAt <= new Date())
      return { ok: false, errKey: ErrKeys.invalidPayload }

    return this.database.db.transaction(async (tx) => {
      const audience = await tx
        .select({ id: groups.id })
        .from(groups)
        .where(isNull(groups.deletedAt))
      if (audience.length === 0) return { ok: false as const, errKey: ErrKeys.invalidPayload }

      if (input.attachmentIds.length > 0) {
        const files = await tx
          .select({ id: bucketFiles.id })
          .from(bucketFiles)
          .where(
            and(
              inArray(bucketFiles.id, input.attachmentIds),
              eq(bucketFiles.uploadedById, requester.userId),
              eq(bucketFiles.is_public, false),
              isNull(bucketFiles.deletedAt),
            ),
          )
        if (files.length !== input.attachmentIds.length)
          return { ok: false as const, errKey: ErrKeys.invalidPayload }
      }

      const [activity] = await tx
        .insert(activities)
        .values({
          title: input.title.trim(),
          description: input.description.trim(),
          dueAt,
          allowLateSubmissions: input.allowLateSubmissions,
          submissionType: input.submissionType,
          createdById: requester.userId,
        })
        .returning()
      await tx.insert(activityGroups).values(
        audience.map((group) => ({
          activityId: activity.id,
          groupId: group.id,
        })),
      )
      if (input.attachmentIds.length)
        await tx.insert(activityAttachments).values(
          input.attachmentIds.map((fileId) => ({
            activityId: activity.id,
            fileId,
          })),
        )
      const recipients = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            inArray(
              users.groupId,
              audience.map((group) => group.id),
            ),
            eq(users.status, 'active'),
            isNull(users.deletedAt),
          ),
        )
      await this.notifications.createActivityNotifications(
        {
          type: 'activity_published',
          activityId: activity.id,
          actorId: requester.userId,
          recipientIds: recipients.map((user) => user.id),
        },
        tx,
      )
      return { ok: true as const, ...(await this.toDetailDto(activity)) }
    })
  }

  async findAll(query: ActivityQueryDto, requester: UserMetadata): Promise<ListActivityOutput> {
    const groupId =
      requester.role === 'student' ? await this.findRequesterGroupId(requester.userId) : undefined
    if (requester.role === 'student' && !groupId) return { ok: true, totalCount: 0, data: [] }
    const where = and(
      isNull(activities.deletedAt),
      query.includeArchived && requester.role !== 'student'
        ? undefined
        : isNull(activities.archivedAt),
      query.search ? ilike(activities.title, `%${query.search}%`) : undefined,
    )
    const rows = await this.database.db
      .select()
      .from(activities)
      .where(where)
      .orderBy(desc(activities.dueAt))
      .offset(query.skip)
      .limit(query.take)
    const visible = groupId ? await this.filterAudience(rows, groupId) : rows
    return {
      ok: true,
      totalCount: visible.length,
      data: await Promise.all(visible.map((activity) => this.toDetailDto(activity))),
    }
  }

  async findOne(id: string, requester: UserMetadata): Promise<GetActivityOutput> {
    const [activity] = await this.database.db
      .select()
      .from(activities)
      .where(and(eq(activities.id, id), isNull(activities.deletedAt)))
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }
    if (requester.role === 'student') {
      const groupId = await this.findRequesterGroupId(requester.userId)
      if (!groupId || !(await this.isAudienceMember(id, groupId)))
        return { ok: false, errKey: ErrKeys.forbidden }
      await this.database.db
        .insert(activityViews)
        .values({ activityId: id, groupId, userId: requester.userId })
        .onConflictDoNothing()
    }
    return { ok: true, ...(await this.toDetailDto(activity)) }
  }

  async update(
    id: string,
    input: UpdateActivityDto,
    requester: UserMetadata,
  ): Promise<GetActivityOutput> {
    if (!['teacher', 'mentor'].includes(requester.role))
      return { ok: false, errKey: ErrKeys.forbidden }
    const [activity] = await this.database.db
      .select()
      .from(activities)
      .where(and(eq(activities.id, id), isNull(activities.deletedAt)))
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }
    if (activity.archivedAt) return { ok: false, errKey: ErrKeys.resourceInUse }
    const dueAt = input.dueAt ? new Date(input.dueAt) : undefined
    if (dueAt && (Number.isNaN(dueAt.getTime()) || dueAt < activity.dueAt))
      return { ok: false, errKey: ErrKeys.invalidPayload }
    const [submission] = await this.database.db
      .select({ id: activitySubmissions.id })
      .from(activitySubmissions)
      .where(eq(activitySubmissions.activityId, id))
      .limit(1)
    if (
      submission &&
      ((input.submissionType && input.submissionType !== activity.submissionType) ||
        (input.allowLateSubmissions !== undefined &&
          input.allowLateSubmissions !== activity.allowLateSubmissions) ||
        (dueAt && dueAt <= activity.dueAt))
    )
      return { ok: false, errKey: ErrKeys.submissionImmutable }
    if (input.attachmentIds) {
      const files = await this.database.db
        .select({ id: bucketFiles.id })
        .from(bucketFiles)
        .where(
          and(
            inArray(bucketFiles.id, input.attachmentIds),
            eq(bucketFiles.uploadedById, requester.userId),
            eq(bucketFiles.is_public, false),
            isNull(bucketFiles.deletedAt),
          ),
        )
      if (files.length !== input.attachmentIds.length)
        return { ok: false, errKey: ErrKeys.invalidPayload }
    }
    const unchanged =
      input.title === undefined &&
      input.description === undefined &&
      !dueAt &&
      input.allowLateSubmissions === undefined &&
      input.submissionType === undefined &&
      input.attachmentIds === undefined
    if (unchanged) return { ok: true, ...this.toDto(activity) }
    return this.database.db.transaction(async (tx) => {
      if (input.attachmentIds !== undefined) {
        await tx.delete(activityAttachments).where(eq(activityAttachments.activityId, id))
        if (input.attachmentIds.length) {
          await tx
            .insert(activityAttachments)
            .values(input.attachmentIds.map((fileId) => ({ activityId: id, fileId })))
        }
      }
      const [updated] = await tx
        .update(activities)
        .set({
          title: input.title?.trim(),
          description: input.description?.trim(),
          dueAt,
          allowLateSubmissions: input.allowLateSubmissions,
          submissionType: input.submissionType,
          deadlineRevision: dueAt ? activity.deadlineRevision + 1 : activity.deadlineRevision,
          updatedAt: new Date(),
        })
        .where(eq(activities.id, id))
        .returning()
      const recipients = await tx
        .select({ id: users.id })
        .from(users)
        .innerJoin(activityGroups, eq(activityGroups.groupId, users.groupId))
        .where(
          and(
            eq(activityGroups.activityId, id),
            eq(users.status, 'active'),
            isNull(users.deletedAt),
          ),
        )
      await this.notifications.createActivityNotifications(
        {
          type: 'activity_updated',
          activityId: id,
          actorId: requester.userId,
          recipientIds: recipients.map((recipient) => recipient.id),
          deadlineRevision: updated.deadlineRevision,
        },
        tx,
      )
      return { ok: true as const, ...this.toDto(updated) }
    })
  }

  async archive(id: string, requester: UserMetadata): Promise<GetActivityOutput> {
    if (!['teacher', 'mentor'].includes(requester.role))
      return { ok: false, errKey: ErrKeys.forbidden }
    const [activity] = await this.database.db
      .select()
      .from(activities)
      .where(and(eq(activities.id, id), isNull(activities.deletedAt)))
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }
    if (activity.archivedAt) return { ok: true, ...this.toDto(activity) }
    const [updated] = await this.database.db
      .update(activities)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning()
    return { ok: true, ...this.toDto(updated) }
  }

  async createSubmission(
    activityId: string,
    input: CreateSubmissionDto,
    requester: UserMetadata,
  ): Promise<CreateSubmissionOutput> {
    if (requester.role !== 'student') return { ok: false, errKey: ErrKeys.forbidden }
    return this.database.db.transaction(async (tx) => {
      const [user] = await tx
        .select({ groupId: users.groupId })
        .from(users)
        .where(
          and(eq(users.id, requester.userId), eq(users.status, 'active'), isNull(users.deletedAt)),
        )
        .for('update')
      if (!user?.groupId) return { ok: false as const, errKey: ErrKeys.forbidden }
      const [activity] = await tx
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.id, activityId),
            isNull(activities.deletedAt),
            isNull(activities.archivedAt),
          ),
        )
      if (!activity || !(await this.isAudienceMember(activityId, user.groupId)))
        return { ok: false as const, errKey: ErrKeys.forbidden }
      const now = new Date()
      const isLate = now > activity.dueAt
      const previous = await tx
        .select({ version: activitySubmissions.version })
        .from(activitySubmissions)
        .where(
          and(
            eq(activitySubmissions.activityId, activityId),
            eq(activitySubmissions.groupId, user.groupId),
          ),
        )
        .orderBy(desc(activitySubmissions.version))
        .limit(1)
      if (isLate && (!activity.allowLateSubmissions || previous.length))
        return { ok: false as const, errKey: ErrKeys.submissionClosed }
      if (
        (activity.submissionType === 'files' && !input.fileIds.length) ||
        (activity.submissionType === 'links' &&
          !input.repositoryIds.length &&
          !input.additionalLinks.length) ||
        (activity.submissionType === 'both' &&
          (!input.fileIds.length || (!input.repositoryIds.length && !input.additionalLinks.length)))
      )
        return {
          ok: false as const,
          errKey: ErrKeys.submissionRequirementsNotMet,
        }
      if (input.fileIds.length) {
        const files = await tx
          .select({ id: bucketFiles.id })
          .from(bucketFiles)
          .where(
            and(
              inArray(bucketFiles.id, input.fileIds),
              eq(bucketFiles.uploadedById, requester.userId),
              eq(bucketFiles.is_public, false),
              eq(bucketFiles.mimeType, 'application/pdf'),
              isNull(bucketFiles.deletedAt),
            ),
          )
        if (files.length !== input.fileIds.length)
          return { ok: false as const, errKey: ErrKeys.invalidPayload }
      }
      const [project] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.groupId, user.groupId), isNull(projects.deletedAt)))
      const selectedRepositories = input.repositoryIds.length
        ? await tx
            .select({ id: repositories.id, url: repositories.url })
            .from(repositories)
            .where(
              and(
                inArray(repositories.id, input.repositoryIds),
                eq(repositories.projectId, project?.id ?? ''),
                isNull(repositories.deletedAt),
              ),
            )
        : []
      if (selectedRepositories.length !== input.repositoryIds.length)
        return { ok: false as const, errKey: ErrKeys.invalidPayload }
      const [submission] = await tx
        .insert(activitySubmissions)
        .values({
          activityId,
          groupId: user.groupId,
          submittedById: requester.userId,
          version: (previous[0]?.version ?? 0) + 1,
          isLate,
        })
        .returning()
      if (input.fileIds.length)
        await tx.insert(activitySubmissionFiles).values(
          input.fileIds.map((fileId) => ({
            submissionId: submission.id,
            fileId,
          })),
        )
      const links = [
        ...selectedRepositories.map((repository) => ({
          submissionId: submission.id,
          repositoryId: repository.id,
          url: repository.url,
        })),
        ...input.additionalLinks.map((url) => ({
          submissionId: submission.id,
          url,
        })),
      ]
      if (links.length) await tx.insert(activitySubmissionLinks).values(links)
      const recipients = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          and(eq(users.groupId, user.groupId), eq(users.status, 'active'), isNull(users.deletedAt)),
        )
      await this.notifications.createActivityNotifications(
        {
          type: 'activity_submission_created',
          activityId,
          actorId: requester.userId,
          groupId: user.groupId,
          submissionId: submission.id,
          recipientIds: recipients.map((recipient) => recipient.id),
        },
        tx,
      )
      return {
        ok: true as const,
        id: submission.id,
        version: submission.version,
        isLate: submission.isLate,
      }
    })
  }

  async getAttachmentDownload(
    id: string,
    fileId: string,
    requester: UserMetadata,
  ): Promise<GetActivityAttachmentDownloadOutput> {
    const [activity] = await this.database.db
      .select()
      .from(activities)
      .where(and(eq(activities.id, id), isNull(activities.deletedAt)))
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }
    if (requester.role === 'student') {
      const groupId = await this.findRequesterGroupId(requester.userId)
      if (!groupId || !(await this.isAudienceMember(id, groupId)))
        return { ok: false, errKey: ErrKeys.forbidden }
    }
    const [attachment] = await this.database.db
      .select({ key: bucketFiles.key, filename: bucketFiles.filename })
      .from(activityAttachments)
      .innerJoin(bucketFiles, eq(activityAttachments.fileId, bucketFiles.id))
      .where(
        and(
          eq(activityAttachments.activityId, id),
          eq(activityAttachments.fileId, fileId),
          eq(bucketFiles.is_public, false),
          isNull(bucketFiles.deletedAt),
        ),
      )
    if (!attachment) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.bucket) return { ok: false, errKey: ErrKeys.internalServerError }
    return {
      ok: true,
      url: await this.bucket.getDownloadUrl(attachment.key, attachment.filename),
    }
  }

  async findSubmissions(
    activityId: string,
    requester: UserMetadata,
  ): Promise<ListSubmissionOutput> {
    let groupId: string | undefined
    if (requester.role === 'student') {
      groupId = await this.findRequesterGroupId(requester.userId)
      if (!groupId || !(await this.isAudienceMember(activityId, groupId)))
        return { ok: false, errKey: ErrKeys.forbidden }
    }
    return { ok: true, data: await this.findSubmissionsForGroup(activityId, groupId) }
  }

  async getGroupDelivery(
    activityId: string,
    groupId: string,
    requester: UserMetadata,
  ): Promise<GetGroupDeliveryOutput> {
    if (!['admin', 'teacher', 'mentor'].includes(requester.role))
      return { ok: false, errKey: ErrKeys.forbidden }
    const [activity] = await this.database.db
      .select({ id: activities.id })
      .from(activities)
      .where(and(eq(activities.id, activityId), isNull(activities.deletedAt)))
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }

    const groupResult = await this.groupService.findOne(groupId)
    if (!groupResult.ok) return groupResult
    if (!(await this.isAudienceMember(activityId, groupId)))
      return { ok: false, errKey: ErrKeys.forbidden }
    const { ok: _ok, ...group } = groupResult
    const [viewers, submissions] = await Promise.all([
      this.database.db
        .select({ id: users.id, name: users.name })
        .from(activityViews)
        .innerJoin(users, eq(activityViews.userId, users.id))
        .where(
          and(
            eq(activityViews.activityId, activityId),
            eq(activityViews.groupId, groupId),
            eq(users.status, 'active'),
            isNull(users.deletedAt),
          ),
        ),
      this.findSubmissionsForGroup(activityId, groupId),
    ])
    return { ok: true, group, project: group.project, viewers, submissions }
  }

  private async findSubmissionsForGroup(
    activityId: string,
    groupId?: string,
  ): Promise<ActivitySubmissionDetail[]> {
    const rows = await this.database.db
      .select({
        id: activitySubmissions.id,
        groupId: activitySubmissions.groupId,
        version: activitySubmissions.version,
        isLate: activitySubmissions.isLate,
        submittedAt: activitySubmissions.submittedAt,
        score: activityEvaluations.score,
        submittedById: activitySubmissions.submittedById,
        submittedByName: users.name,
      })
      .from(activitySubmissions)
      .innerJoin(users, eq(activitySubmissions.submittedById, users.id))
      .leftJoin(activityEvaluations, eq(activityEvaluations.submissionId, activitySubmissions.id))
      .where(
        and(
          eq(activitySubmissions.activityId, activityId),
          groupId ? eq(activitySubmissions.groupId, groupId) : undefined,
        ),
      )
      .orderBy(desc(activitySubmissions.version))
    const data = await Promise.all(
      rows.map(async (submission) => {
        const [links, files] = await Promise.all([
          this.database.db
            .select({
              id: activitySubmissionLinks.id,
              url: activitySubmissionLinks.url,
            })
            .from(activitySubmissionLinks)
            .where(eq(activitySubmissionLinks.submissionId, submission.id)),
          this.database.db
            .select({ id: bucketFiles.id, filename: bucketFiles.filename })
            .from(activitySubmissionFiles)
            .innerJoin(bucketFiles, eq(activitySubmissionFiles.fileId, bucketFiles.id))
            .where(eq(activitySubmissionFiles.submissionId, submission.id)),
        ])
        const linksWithThumbnails = await Promise.all(
          links.map(async (link) => {
            if (!this.isGitHubRepositoryUrl(link.url)) return link
            const thumbnailUrl = await this.gitHubService.getRepositoryOpenGraphImageUrl(link.url)
            return thumbnailUrl ? { ...link, thumbnailUrl } : link
          }),
        )
        return {
          id: submission.id,
          groupId: submission.groupId,
          version: submission.version,
          isLate: submission.isLate,
          submittedAt: submission.submittedAt,
          score: submission.score,
          submittedBy: {
            id: submission.submittedById,
            name: submission.submittedByName,
          },
          links: linksWithThumbnails,
          files,
        }
      }),
    )
    return data
  }

  private isGitHubRepositoryUrl(value: string) {
    try {
      const url = new URL(value)
      const parts = url.pathname.split('/').filter(Boolean)
      return (
        url.protocol === 'https:' &&
        (url.hostname === 'github.com' || url.hostname === 'www.github.com') &&
        parts.length === 2
      )
    } catch {
      return false
    }
  }

  async getSubmissionFileDownload(
    activityId: string,
    submissionId: string,
    fileId: string,
    requester: UserMetadata,
  ): Promise<GetSubmissionFileDownloadOutput> {
    const submissions = await this.findSubmissions(activityId, requester)
    if (!submissions.ok) return submissions
    if (!submissions.data.some((submission) => submission.id === submissionId))
      return { ok: false, errKey: ErrKeys.forbidden }
    const [file] = await this.database.db
      .select({ key: bucketFiles.key, filename: bucketFiles.filename })
      .from(activitySubmissionFiles)
      .innerJoin(bucketFiles, eq(activitySubmissionFiles.fileId, bucketFiles.id))
      .where(
        and(
          eq(activitySubmissionFiles.submissionId, submissionId),
          eq(activitySubmissionFiles.fileId, fileId),
          isNull(bucketFiles.deletedAt),
        ),
      )
    if (!file) return { ok: false, errKey: ErrKeys.notFound }
    if (!this.bucket) return { ok: false, errKey: ErrKeys.internalServerError }
    return {
      ok: true,
      url: await this.bucket.getDownloadUrl(file.key, file.filename),
    }
  }

  async upsertEvaluation(
    activityId: string,
    submissionId: string,
    input: UpsertEvaluationDto,
    requester: UserMetadata,
  ): Promise<UpsertEvaluationOutput> {
    if (!['teacher', 'mentor'].includes(requester.role))
      return { ok: false, errKey: ErrKeys.forbidden }
    const [submission] = await this.database.db
      .select({
        groupId: activitySubmissions.groupId,
        version: activitySubmissions.version,
      })
      .from(activitySubmissions)
      .where(
        and(
          eq(activitySubmissions.id, submissionId),
          eq(activitySubmissions.activityId, activityId),
        ),
      )
    if (!submission) return { ok: false, errKey: ErrKeys.notFound }
    const [latest] = await this.database.db
      .select({ version: activitySubmissions.version })
      .from(activitySubmissions)
      .where(
        and(
          eq(activitySubmissions.activityId, activityId),
          eq(activitySubmissions.groupId, submission.groupId),
        ),
      )
      .orderBy(desc(activitySubmissions.version))
      .limit(1)
    if (!latest || latest.version !== submission.version)
      return { ok: false, errKey: ErrKeys.submissionImmutable }
    const evaluatedAt = new Date()
    const [evaluation] = await this.database.db
      .insert(activityEvaluations)
      .values({
        submissionId,
        score: input.score,
        evaluatedById: requester.userId,
        evaluatedAt,
      })
      .onConflictDoUpdate({
        target: activityEvaluations.submissionId,
        set: {
          score: input.score,
          evaluatedById: requester.userId,
          evaluatedAt,
          updatedAt: evaluatedAt,
        },
      })
      .returning({
        score: activityEvaluations.score,
        evaluatedAt: activityEvaluations.evaluatedAt,
      })
    return { ok: true, ...evaluation }
  }

  async getPipeline(activityId: string, requester: UserMetadata): Promise<GetPipelineOutput> {
    if (!['admin', 'teacher', 'mentor'].includes(requester.role))
      return { ok: false, errKey: ErrKeys.forbidden }
    const [activity] = await this.database.db
      .select({ id: activities.id, dueAt: activities.dueAt })
      .from(activities)
      .where(and(eq(activities.id, activityId), isNull(activities.deletedAt)))
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }
    const audience = await this.database.db
      .select({
        groupId: groups.id,
      })
      .from(activityGroups)
      .innerJoin(groups, eq(activityGroups.groupId, groups.id))
      .where(eq(activityGroups.activityId, activityId))
    const [groupResults, views, submissions] = await Promise.all([
      Promise.all(audience.map(({ groupId }) => this.groupService.findOne(groupId))),
      this.database.db
        .select({ groupId: activityViews.groupId, name: users.name })
        .from(activityViews)
        .innerJoin(users, eq(activityViews.userId, users.id))
        .where(eq(activityViews.activityId, activityId)),
      this.database.db
        .select({
          id: activitySubmissions.id,
          groupId: activitySubmissions.groupId,
          version: activitySubmissions.version,
          submittedAt: activitySubmissions.submittedAt,
          isLate: activitySubmissions.isLate,
          submittedBy: users.name,
        })
        .from(activitySubmissions)
        .innerJoin(users, eq(activitySubmissions.submittedById, users.id))
        .where(eq(activitySubmissions.activityId, activityId)),
    ])
    const latest = new Map<
      string,
      {
        id: string
        version: number
        submittedAt: Date
        isLate: boolean
        submittedBy: string
      }
    >()
    for (const submission of submissions) {
      if ((latest.get(submission.groupId)?.version ?? -1) < submission.version)
        latest.set(submission.groupId, submission)
    }
    const evaluations = latest.size
      ? await this.database.db
          .select({
            submissionId: activityEvaluations.submissionId,
            score: activityEvaluations.score,
          })
          .from(activityEvaluations)
          .where(
            inArray(
              activityEvaluations.submissionId,
              [...latest.values()].map(({ id }) => id),
            ),
          )
      : []
    const evaluated = new Map(
      evaluations.map((evaluation) => [evaluation.submissionId, evaluation.score]),
    )
    const viewed = new Map<string, string[]>()
    for (const view of views)
      viewed.set(view.groupId, [...(viewed.get(view.groupId) ?? []), view.name])
    const typedColumns: Record<PipelineStatus, ActivityPipelineRow[]> = {
      not_viewed: [],
      viewed: [],
      not_submitted: [],
      submitted: [],
      evaluated: [],
    }
    for (const groupResult of groupResults) {
      if (!groupResult.ok) continue
      const { ok: _ok, ...group } = groupResult
      const submission = latest.get(group.id)
      const status: PipelineStatus = submission
        ? evaluated.has(submission.id)
          ? 'evaluated'
          : 'submitted'
        : new Date() > activity.dueAt
          ? 'not_submitted'
          : viewed.has(group.id)
            ? 'viewed'
            : 'not_viewed'
      typedColumns[status].push({
        group,
        project: group.project,
        viewers: viewed.get(group.id) ?? [],
        submission: submission
          ? {
              version: submission.version,
              submittedAt: submission.submittedAt,
              submittedBy: submission.submittedBy,
              isLate: submission.isLate,
              score: evaluated.get(submission.id) ?? null,
            }
          : null,
      })
    }
    return {
      ok: true,
      metrics: calculatePipelineMetrics(
        Object.keys(typedColumns).flatMap((status) =>
          typedColumns[status as PipelineStatus].map(() => status as PipelineStatus),
        ),
      ),
      columns: typedColumns,
    }
  }

  private async findRequesterGroupId(userId: string) {
    const [user] = await this.database.db
      .select({ groupId: users.groupId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.status, 'active'), isNull(users.deletedAt)))
    return user?.groupId ?? undefined
  }

  private async isAudienceMember(activityId: string, groupId: string) {
    const [row] = await this.database.db
      .select({ id: activityGroups.id })
      .from(activityGroups)
      .where(and(eq(activityGroups.activityId, activityId), eq(activityGroups.groupId, groupId)))
    return Boolean(row)
  }

  private async filterAudience<T extends { id: string }>(rows: T[], groupId: string) {
    const audience = await this.database.db
      .select({ activityId: activityGroups.activityId })
      .from(activityGroups)
      .where(
        and(
          eq(activityGroups.groupId, groupId),
          inArray(
            activityGroups.activityId,
            rows.map((activity) => activity.id),
          ),
        ),
      )
    const ids = new Set(audience.map((row) => row.activityId))
    return rows.filter((activity) => ids.has(activity.id))
  }

  private toDto(activity: typeof activities.$inferSelect): GetActivityDto {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      dueAt: activity.dueAt,
      allowLateSubmissions: activity.allowLateSubmissions,
      submissionType: activity.submissionType,
      createdById: activity.createdById,
      publishedAt: activity.publishedAt,
      deadlineRevision: activity.deadlineRevision,
      archivedAt: activity.archivedAt,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      attachments: [],
    }
  }

  private async toDetailDto(activity: typeof activities.$inferSelect): Promise<GetActivityDto> {
    const attachments = await this.database.db
      .select({
        id: bucketFiles.id,
        filename: bucketFiles.filename,
        mimeType: bucketFiles.mimeType,
        size: bucketFiles.size,
      })
      .from(activityAttachments)
      .innerJoin(bucketFiles, eq(activityAttachments.fileId, bucketFiles.id))
      .where(and(eq(activityAttachments.activityId, activity.id), isNull(bucketFiles.deletedAt)))
    return { ...this.toDto(activity), attachments }
  }
}
