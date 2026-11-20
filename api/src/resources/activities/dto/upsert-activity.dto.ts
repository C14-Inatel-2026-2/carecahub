import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

export class UpsertActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty({ example: 'Entrega 1 — Modelagem do banco' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string

  @ApiProperty({ example: 'Enviar o diagrama ER e o link do repositório com as migrations.' })
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty({ example: '2026-12-01T23:59:00.000Z' })
  @IsISO8601()
  dueDate: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowLateSubmissions?: boolean
}
