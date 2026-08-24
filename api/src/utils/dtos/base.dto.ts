import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class BaseDto<D> {
  @ApiProperty({
    example: 'da60dd19-b4e1-4e88-84a4-94e3a56c2f8d',
    description: 'Unique identifier (UUID)',
  })
  id: string

  @ApiPropertyOptional({
    example: '2023-09-15T14:30:00.000Z',
    description: 'Record creation timestamp',
  })
  createdAt?: Date | string

  @ApiPropertyOptional({
    example: '2023-10-22T09:15:30.000Z',
    description: 'Last record update timestamp',
  })
  updatedAt?: Date | string | null

  @ApiPropertyOptional({
    example: '2023-11-05T16:45:20.000Z',
    description: 'Soft deletion timestamp',
  })
  deletedAt?: Date | string | null

  constructor(data?: D) {
    Object.assign(this, data)
  }
}

export class List<T> {
  @ApiProperty({ type: [Object] })
  data: T[]
  @ApiProperty({ example: 100 })
  totalCount: number

  constructor(data: T[], totalCount: number) {
    this.data = data
    this.totalCount = totalCount
  }
}
