import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  title: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content: string
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
