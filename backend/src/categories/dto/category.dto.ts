import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
export class CreateCategoryDto {
  @ApiProperty() @IsString() @Length(1, 60) name!: string;
}
export class UpdateCategoryDto extends CreateCategoryDto {}
