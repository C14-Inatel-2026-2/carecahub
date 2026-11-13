import { activities } from '@db'
import { Injectable } from '@nestjs/common'
import { and, asc, count, eq, ilike, isNull } from 'drizzle-orm'
import { DrizzleService } from '@/providers/database/drizzle.service'
import { CustomLogger } from '@/providers/logger/custom-logger.service'
import { LoggerFactory } from '@/providers/logger/logger-factory.service'
import { ErrKeys, type UserMetadata } from '@/types'
import { QueryDto } from '@/utils/dtos/query.dto'
import type {
  GetActivityOutput,
  ListActivityOutput,
  RemoveActivityOutput,
} from './activity.interface'
import { IActivityService } from './activity.interface'
import type { GetActivityDtoRecord } from './dto/get-activity.dto'
import { GetActivityDto } from './dto/get-activity.dto'
import { UpsertActivityDto } from './dto/upsert-activity.dto'

export function canManageActivities(requester: UserMetadata): boolean {
  return requester.role === 'teacher' || requester.role === 'admin'
}

@Injectable()
export class ActivityService implements IActivityService {
  private readonly logger: CustomLogger

  constructor(
    private readonly database: DrizzleService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(ActivityService.name)
  }

  async upsert(input: UpsertActivityDto, requester: UserMetadata): Promise<GetActivityOutput> {
    if (!canManageActivities(requester)) return { ok: false, errKey: ErrKeys.forbidden }

    const dueDate = new Date(input.dueDate)
    const isPast = dueDate.getTime() <= Date.now()

    if (!input.id) {
      if (isPast) return { ok: false, errKey: ErrKeys.invalidPayload }

      const [created] = await this.database.db
        .insert(activities)
        .values({
          title: input.title,
          description: input.description,
          dueDate,
          allowLateSubmissions: input.allowLateSubmissions ?? false,
          createdById: requester.userId,
        })
        .returning(this.selection)
      return { ok: true, ...GetActivityDto.toDto(created) }
    }

    const current = await this.getRecord(input.id)
    if (!current) return { ok: false, errKey: ErrKeys.notFound }

    // Editing the description of an activity whose deadline already passed is allowed,
    // but moving the deadline to a date in the past is not.
    const dueDateChanged = dueDate.getTime() !== current.dueDate.getTime()
    if (dueDateChanged && isPast) return { ok: false, errKey: ErrKeys.invalidPayload }

    const [updated] = await this.database.db
      .update(activities)
      .set({
        title: input.title,
        description: input.description,
        dueDate,
        allowLateSubmissions: input.allowLateSubmissions ?? current.allowLateSubmissions,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, input.id))
      .returning(this.selection)
    return { ok: true, ...GetActivityDto.toDto(updated) }
  }

  async findAll(query: QueryDto): Promise<ListActivityOutput> {
    const where = and(
      isNull(activities.deletedAt),
      query.search ? ilike(activities.title, `%${query.search}%`) : undefined,
    )
    const [rows, totalCount] = await Promise.all([
      this.database.db
        .select(this.selection)
        .from(activities)
        .where(where)
        .orderBy(asc(activities.dueDate))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(activities).where(where),
    ])

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: rows.map((row) => GetActivityDto.toDto(row)),
    }
  }

  async findOne(id: string): Promise<GetActivityOutput> {
    const activity = await this.getRecord(id)
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }
    return { ok: true, ...GetActivityDto.toDto(activity) }
  }

  async remove(id: string, requester: UserMetadata): Promise<RemoveActivityOutput> {
    if (!canManageActivities(requester)) return { ok: false, errKey: ErrKeys.forbidden }

    const activity = await this.getRecord(id)
    if (!activity) return { ok: false, errKey: ErrKeys.notFound }

    await this.database.db
      .update(activities)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(activities.id, id))
    this.logger.log(`Activity ${id} removed`)
    return { ok: true }
  }

  private readonly selection = {
    id: activities.id,
    title: activities.title,
    description: activities.description,
    dueDate: activities.dueDate,
    allowLateSubmissions: activities.allowLateSubmissions,
    createdById: activities.createdById,
    createdAt: activities.createdAt,
    updatedAt: activities.updatedAt,
    deletedAt: activities.deletedAt,
  }

  private async getRecord(id: string): Promise<GetActivityDtoRecord | undefined> {
    const [activity] = await this.database.db
      .select(this.selection)
      .from(activities)
      .where(and(eq(activities.id, id), isNull(activities.deletedAt)))
    return activity
  }
}
