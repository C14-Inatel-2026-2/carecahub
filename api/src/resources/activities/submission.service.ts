import { activities, submissions, users } from '@db'
import { Injectable } from '@nestjs/common'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, type UserMetadata } from '@/types'
import { isUniqueViolation } from '@/utils/query-violations'
import type { GetSubmissionOutput, ListSubmissionOutput } from './activity.interface'
import { ISubmissionService } from './activity.interface'
import { canManageActivities } from './activity.service'
import { GetSubmissionDto } from './dto/get-submission.dto'
import { GradeSubmissionDto } from './dto/grade-submission.dto'
import { SubmitActivityDto } from './dto/submit-activity.dto'

@Injectable()
export class SubmissionService implements ISubmissionService {
  private readonly logger: CustomLogger

  constructor(
    private readonly database: DrizzleService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(SubmissionService.name)
  }

  async submit(
    activityId: string,
    input: SubmitActivityDto,
    requester: UserMetadata,
  ): Promise<GetSubmissionOutput> {
    if (requester.role !== 'student') return { ok: false, errKey: ErrKeys.forbidden }

    const activity = await this.findActiveActivity(activityId)
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }

    const groupId = await this.findRequesterGroupId(requester.userId)
    if (!groupId) return { ok: false, errKey: ErrKeys.forbidden }

    const submittedAt = new Date()
    const isLate = submittedAt.getTime() > activity.dueDate.getTime()
    if (isLate && !activity.allowLateSubmissions) {
      return { ok: false, errKey: ErrKeys.deadlineExpired }
    }

    const [existing] = await this.database.db
      .select({ id: submissions.id, gradedAt: submissions.gradedAt })
      .from(submissions)
      .where(and(eq(submissions.activityId, activityId), eq(submissions.groupId, groupId)))

    // Once the teacher grades a submission, the group can no longer replace it.
    if (existing?.gradedAt) return { ok: false, errKey: ErrKeys.resourceInUse }

    try {
      const [saved] = existing
        ? await this.database.db
            .update(submissions)
            .set({
              url: input.url,
              submittedById: requester.userId,
              submittedAt,
              isLate,
              updatedAt: submittedAt,
            })
            .where(eq(submissions.id, existing.id))
            .returning(this.selection)
        : await this.database.db
            .insert(submissions)
            .values({
              activityId,
              groupId,
              submittedById: requester.userId,
              url: input.url,
              isLate,
              submittedAt,
            })
            .returning(this.selection)

      this.logger.log(`Group ${groupId} submitted activity ${activityId}`)
      return { ok: true, ...GetSubmissionDto.toDto(saved) }
    } catch (error) {
      // Two members of the same group submitting at the same time: the unique
      // (activity, group) constraint rejects the second insert.
      if (isUniqueViolation(error)) return { ok: false, errKey: ErrKeys.alreadyExists }
      throw error
    }
  }

  async findByActivity(activityId: string, requester: UserMetadata): Promise<ListSubmissionOutput> {
    const activity = await this.findActiveActivity(activityId)
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }

    // Students only see their own group's submission (and its grade).
    let groupId: string | undefined
    if (requester.role === 'student') {
      groupId = await this.findRequesterGroupId(requester.userId)
      if (!groupId) return { ok: true, totalCount: 0, data: [] }
    }

    const rows = await this.database.db
      .select(this.selection)
      .from(submissions)
      .where(
        and(
          eq(submissions.activityId, activityId),
          groupId ? eq(submissions.groupId, groupId) : undefined,
        ),
      )
      .orderBy(desc(submissions.submittedAt))

    return {
      ok: true,
      totalCount: rows.length,
      data: rows.map((row) => GetSubmissionDto.toDto(row)),
    }
  }

  async grade(
    submissionId: string,
    input: GradeSubmissionDto,
    requester: UserMetadata,
  ): Promise<GetSubmissionOutput> {
    if (!canManageActivities(requester)) return { ok: false, errKey: ErrKeys.forbidden }

    const [submission] = await this.database.db
      .select({ id: submissions.id })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
    if (!submission) return { ok: false, errKey: ErrKeys.notFound }

    const gradedAt = new Date()
    const [graded] = await this.database.db
      .update(submissions)
      .set({
        grade: input.grade,
        feedback: input.feedback?.trim() || null,
        gradedById: requester.userId,
        gradedAt,
        updatedAt: gradedAt,
      })
      .where(eq(submissions.id, submissionId))
      .returning(this.selection)

    return { ok: true, ...GetSubmissionDto.toDto(graded) }
  }

  private readonly selection = {
    id: submissions.id,
    activityId: submissions.activityId,
    groupId: submissions.groupId,
    submittedById: submissions.submittedById,
    url: submissions.url,
    isLate: submissions.isLate,
    submittedAt: submissions.submittedAt,
    grade: submissions.grade,
    feedback: submissions.feedback,
    gradedById: submissions.gradedById,
    gradedAt: submissions.gradedAt,
    createdAt: submissions.createdAt,
    updatedAt: submissions.updatedAt,
  }

  private async findActiveActivity(id: string) {
    const [activity] = await this.database.db
      .select({
        id: activities.id,
        dueDate: activities.dueDate,
        allowLateSubmissions: activities.allowLateSubmissions,
      })
      .from(activities)
      .where(and(eq(activities.id, id), isNull(activities.deletedAt)))
    return activity
  }

  private async findRequesterGroupId(userId: string): Promise<string | undefined> {
    const [user] = await this.database.db
      .select({ groupId: users.groupId })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.status, 'active'), isNull(users.deletedAt)))
    return user?.groupId ?? undefined
  }
}
