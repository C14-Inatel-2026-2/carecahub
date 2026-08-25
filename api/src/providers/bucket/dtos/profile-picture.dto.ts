import { ApiProperty } from '@nestjs/swagger'
import { BaseDto } from '@/utils/dtos/base.dto'

export class ProfilePictureDto extends BaseDto<ProfilePictureDto> {
  @ApiProperty({
    example: '1698345600000-profile.jpg',
    description: 'Unique key identifier for the file in storage',
  })
  key: string

  @ApiProperty({
    example: 'profile.jpg',
    description: 'Original filename',
  })
  filename: string

  @ApiProperty({
    example: 2048576,
    description: 'File size in bytes',
  })
  size: number

  @ApiProperty({
    example: 'https://s3.amazonaws.com/bucket/file.jpg?signature=...',
    description: 'Signed URL to access the file (expires in 1 hour)',
  })
  url: string
}
