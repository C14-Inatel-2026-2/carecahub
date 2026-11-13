import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class GradeSubmissionDto {
  @ApiProperty({ example: 8.5, minimum: 0, maximum: 10 })
  @IsNumber()
  @Min(0)
  @Max(10)
  grade: number

  @ApiPropertyOptional({ example: 'Boa modelagem, faltou o índice único no e-mail.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string
}
