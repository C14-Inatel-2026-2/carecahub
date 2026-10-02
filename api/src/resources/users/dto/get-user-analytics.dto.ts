import { ApiProperty } from '@nestjs/swagger'

export class GetUserAnalyticsDto {
  @ApiProperty({
    example: 38,
    description: 'Total number of users across all roles, excluding removed users',
  })
  totalUsers: number

  @ApiProperty({ example: 2, description: 'Number of users with the admin role' })
  admin: number

  @ApiProperty({ example: 5, description: 'Number of users with the teacher role' })
  teacher: number

  @ApiProperty({ example: 8, description: 'Number of users with the mentor role' })
  mentor: number

  @ApiProperty({ example: 23, description: 'Number of users with the student role' })
  student: number
}
