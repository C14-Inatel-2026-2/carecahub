import type { UserRole, UserStatus } from "@db";
import { USER_ROLES, USER_STATUSES } from "@db";
import { ApiProperty } from "@nestjs/swagger";
import { BaseDto } from "@/utils/dtos/base.dto";

export type GetUserDtoRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  two_factor: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export class GetUserDto extends BaseDto<GetUserDto> {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: USER_ROLES })
  role: UserRole;

  @ApiProperty({ enum: USER_STATUSES })
  status: UserStatus;

  @ApiProperty()
  twoFactor: boolean;

  static toDto(user: GetUserDtoRecord): GetUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      twoFactor: user.two_factor,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt ?? undefined,
    };
  }
}
