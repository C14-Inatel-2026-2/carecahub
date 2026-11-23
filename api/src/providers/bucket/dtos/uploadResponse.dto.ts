import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UploadResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty({
    description: 'The key reference to access the file',
  })
  key: string

  @ApiPropertyOptional({
    description: 'The URL to access the public file',
  })
  url?: string | null

  @ApiProperty()
  filename: string

  @ApiProperty()
  size: number

  @ApiProperty()
  mimeType: string

  @ApiProperty()
  isPublic: boolean
}
