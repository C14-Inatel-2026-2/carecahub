import { users } from "@db";
import { Injectable } from "@nestjs/common";
import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { DrizzleService } from "@/providers/database/drizzle.service";
import { CustomLogger } from "@/providers/logger/custom-logger.service";
import { LoggerFactory } from "@/providers/logger/logger-factory.service";
import { ErrKeys, ServiceOutput, UserMetadata } from "@/types";
import { QueryDto } from "@/utils/dtos/query.dto";
import { hashPassword } from "@/utils/password";
import type { GetUserDtoRecord } from "./dto/get-user.dto";
import { GetUserDto } from "./dto/get-user.dto";
import { CreateUserDto, UpdateUserDto } from "./dto/upsert-user.dto";
import {
  GetUserOutput,
  IUsersService,
  ListUserOutput,
  UpsertUserOutput,
} from "./user.interface";

const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  status: users.status,
  two_factor: users.two_factor,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  deletedAt: users.deletedAt,
};

@Injectable()
export class UsersService implements IUsersService {
  private readonly logger: CustomLogger;

  constructor(
    private readonly database: DrizzleService,
    loggerFactory: LoggerFactory,
  ) {
    this.logger = loggerFactory.create(UsersService.name);
  }

  async register(input: CreateUserDto): Promise<UpsertUserOutput> {
    const [exists] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email));
    if (exists) return { ok: false, errKey: ErrKeys.alreadyExists };

    let user: GetUserDtoRecord;
    try {
      [user] = await this.database.db
        .insert(users)
        .values({
          name: input.name,
          registration: input.registration,
          githubName: input.githubName,
          classroom: input.classroom,
          email: input.email,
          password: await hashPassword(input.password),
          role: "student",
        })
        .returning(publicColumns);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists };
      }
      throw error;
    }

    return { ok: true, ...GetUserDto.toDto(user) };
  }

  async findAll(
    query: QueryDto,
    _requester?: UserMetadata,
  ): Promise<ListUserOutput> {
    const where = query.search
      ? and(
          isNull(users.deletedAt),
          or(
            ilike(users.name, `%${query.search}%`),
            ilike(users.email, `%${query.search}%`),
          ),
        )
      : isNull(users.deletedAt);
    const [userRows, totalCount] = await Promise.all([
      this.database.db
        .select(publicColumns)
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .offset(query.skip)
        .limit(query.take),
      this.database.db.select({ count: count() }).from(users).where(where),
    ]);

    return {
      ok: true,
      totalCount: Number(totalCount[0]?.count ?? 0),
      data: userRows.map((user) => GetUserDto.toDto(user)),
    };
  }

  async findOne(id: string, _requester?: UserMetadata): Promise<GetUserOutput> {
    const [user] = await this.database.db
      .select(publicColumns)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    if (!user) return { ok: false, errKey: ErrKeys.notFound };

    return { ok: true, ...GetUserDto.toDto(user) };
  }

  async update(
    id: string,
    input: UpdateUserDto,
    _requester: UserMetadata,
  ): Promise<UpsertUserOutput> {
    const [user] = await this.database.db
      .select(publicColumns)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    if (!user) return { ok: false, errKey: ErrKeys.notFound };

    if (input.email && input.email !== user.email) {
      const [emailInUse] = await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email));
      if (emailInUse) return { ok: false, errKey: ErrKeys.alreadyExists };
    }

    let updatedUser: GetUserDtoRecord;
    try {
      [updatedUser] = await this.database.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning(publicColumns);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return { ok: false, errKey: ErrKeys.alreadyExists };
      }
      throw error;
    }

    return { ok: true, ...GetUserDto.toDto(updatedUser) };
  }

  async remove(
    id: string,
    _requester: UserMetadata,
  ): Promise<ServiceOutput<object>> {
    const [user] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    if (!user) return { ok: false, errKey: ErrKeys.notFound };

    await this.database.db
      .update(users)
      .set({ status: "deleted", deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));

    this.logger.log(`User ${id} removed`);
    return { ok: true };
  }

  private isUniqueViolation(error: unknown): error is { code: "23505" } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}
