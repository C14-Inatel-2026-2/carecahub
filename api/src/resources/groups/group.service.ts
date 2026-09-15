import { Injectable } from '@nestjs/common'
import { IGroupService } from './group.interface'
import { groups } from "@db"
import { CustomLogger } from '@/providers/logger/custom-logger.service';
import { DrizzleService } from '@/providers/database/drizzle.service';
import { LoggerFactory } from '@/providers/logger/logger-factory.service';

const publicColumns = {
  id: groups.id,
  friendlyId: groups.friendlyId,
  creatorId: groups.creatorId,
  createdAt: groups.createdAt,
  updatedAt: groups.updatedAt,
  deletedAt: groups.deletedAt,
};

@Injectable()
export class GroupService implements IGroupService {
  private readonly logger: CustomLogger;

  constructor(
      private readonly database: DrizzleService,
      loggerFactory: LoggerFactory,
    ) {
      this.logger = loggerFactory.create(GroupService.name);
    }
}
