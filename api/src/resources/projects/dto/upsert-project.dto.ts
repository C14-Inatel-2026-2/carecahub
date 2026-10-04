import { REPOSITORY_TYPES, type RepositoryType } from '@db'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidateIf,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator'

function HasSelectedTechnology(validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'hasSelectedTechnology',
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, arguments_: ValidationArguments) {
          const project = arguments_.object as UpsertProjectDto
          return (Array.isArray(value) && value.length > 0) || project.usesOtherTechnology === true
        },
      },
    })
  }
}

export class UpsertProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string

  @ApiProperty({ type: [String] })
  @IsArray()
  @HasSelectedTechnology({
    message: 'Selecione ao menos uma tecnologia ou informe outra tecnologia.',
  })
  @IsString({ each: true })
  technologies: string[]

  @ApiProperty()
  @IsBoolean()
  usesOtherTechnology: boolean

  @ApiPropertyOptional()
  @ValidateIf((input: UpsertProjectDto) => input.usesOtherTechnology)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  otherTechnology?: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  dependencyManager: string

  @ApiPropertyOptional()
  @ValidateIf((input: UpsertProjectDto) => input.dependencyManager === 'other')
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  otherDependencyManager?: string

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  versionControl: string

  @ApiPropertyOptional()
  @ValidateIf((input: UpsertProjectDto) => input.versionControl === 'other')
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  otherVersionControl?: string

  @ApiProperty({ enum: REPOSITORY_TYPES })
  @IsIn(REPOSITORY_TYPES)
  repositoryType: RepositoryType

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string
}
