import fs from 'node:fs'
import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString } from 'class-validator'

export class UploadFileDto {
  @ApiProperty()
  buffer: Buffer | fs.ReadStream

  @ApiProperty()
  @IsString()
  mimetype?: string

  @ApiProperty()
  @IsString()
  originalname: string

  @ApiProperty()
  @IsNumber()
  size: number
}
