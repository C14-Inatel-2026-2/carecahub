import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class UpdateProjectAppearanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  iconUrl?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  thumbnailUrl?: string

  @ApiPropertyOptional({ example: '#12AB34' })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Informe uma cor HEX válida.' })
  mainColor?: string
}
