import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, MaxLength } from "class-validator";

export class CreateGroupDto {
    @ApiProperty()
    @IsString()
    @Length(36)
    creatorId: string

    @ApiProperty()
    @IsString()
    @MaxLength(30)
    friendlyId?: string
}