import type { Project, User } from "@db";
import { ApiProperty } from "@nestjs/swagger";
import type { RepositoryDetails } from "@/providers/github/github.types";
import { BaseDto } from "@/utils/dtos/base.dto";

export type GetRepositoryDtoRecord = {
  id: string;
  url: string;
  owner: User;
  project: Project;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export class GetRepositoryDto extends BaseDto<GetRepositoryDto> {
  @ApiProperty()
  url: string;

  @ApiProperty()
  owner: User;

  @ApiProperty()
  project: Project;

  @ApiProperty({ nullable: true })
  details: RepositoryDetails | null;

  static toDto(
    repository: GetRepositoryDtoRecord,
    details: RepositoryDetails | null = null,
  ): GetRepositoryDto {
    return {
      id: repository.id,
      url: repository.url,
      owner: repository.owner,
      project: repository.project,
      details,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
      deletedAt: repository.deletedAt ?? undefined,
    };
  }
}
