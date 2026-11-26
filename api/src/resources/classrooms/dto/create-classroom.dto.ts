import { ApiProperty } from '@nestjs/swagger'
import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateClassroomDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string

  @ApiProperty({ example: '2026.2' })
  @IsString()
  @Matches(/^\d{4}\.[12]$/)
  semester: string
}
