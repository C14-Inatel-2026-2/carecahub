import { BaseDto } from "@/utils/dtos/base.dto";
import { QueryDto } from "@/utils/dtos/query.dto";
import { ApiProperty } from "@nestjs/swagger";

export class GetGroupQueryDto extends QueryDto {}

export type GetGroupDtoRecord = {
  id: string;
  friendlyId: string;
  leaderId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export class GetGroupDto extends BaseDto<GetGroupDto> {
  @ApiProperty()
  friendlyId: string;

  @ApiProperty()
  leaderId: string;

  static toDto(group: GetGroupDtoRecord): GetGroupDto {
    return {
      id: group.id,
      friendlyId: group.friendlyId,
      leaderId: group.leaderId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      deletedAt: group.deletedAt ?? undefined,
    };
  }
}
