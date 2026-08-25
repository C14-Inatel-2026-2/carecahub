import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max } from 'class-validator'
import { TransformInt } from '@/infra/number.transformer'

export const ORDER_TYPES = ['asc', 'desc'] as const
export type OrderType = (typeof ORDER_TYPES)[number]

export class QueryDto {
  @ApiProperty({
    description: 'The number of items to skip before taking the result set',
    required: false,
    example: 0,
    default: 0,
    type: Number,
  })
  @IsOptional()
  @TransformInt(0)
  @IsInt()
  skip: number

  @ApiProperty({
    description: 'The number of items to return',
    required: false,
    example: 10,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @TransformInt(10)
  @IsInt()
  @Max(100)
  take: number

  @ApiPropertyOptional({
    description: 'The field to order by',
    required: false,
    example: 'name',
    type: String,
  })
  @IsOptional()
  @IsString()
  orderBy?: string

  @ApiPropertyOptional({
    description: 'The order type',
    required: false,
    example: 'desc',
    enum: ORDER_TYPES,
  })
  @IsOptional()
  @IsEnum(ORDER_TYPES)
  orderType?: OrderType

  @ApiPropertyOptional({
    description: 'The search query',
    required: false,
    example: 'John',
    type: String,
  })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ example: '2021-01-01', description: 'Data de início' })
  @IsOptional()
  @IsISO8601()
  startDate?: Date

  @ApiPropertyOptional({ example: '2021-01-01', description: 'Data de fim' })
  @IsOptional()
  @IsISO8601()
  endDate?: Date
}
