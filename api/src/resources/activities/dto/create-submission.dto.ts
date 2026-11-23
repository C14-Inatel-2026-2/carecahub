import { ArrayMaxSize, ArrayUnique, IsArray, IsOptional, IsUrl, IsUUID } from 'class-validator'

export class CreateSubmissionDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  fileIds: string[] = []

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  repositoryIds: string[] = []

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  additionalLinks: string[] = []
}
