import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UploadResponseDto {
  @ApiProperty({
    description: 'The key reference to access the file',
  })
  key: string

  @ApiPropertyOptional({
    description: 'The URL to access the public file',
  })
  url?: string | null
}
