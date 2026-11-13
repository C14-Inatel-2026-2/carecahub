import { ApiProperty } from '@nestjs/swagger'
import { IsUrl, MaxLength } from 'class-validator'

export class SubmitActivityDto {
  @ApiProperty({ example: 'https://github.com/acme/carecahub' })
  @IsUrl()
  @MaxLength(500)
  url: string
}
