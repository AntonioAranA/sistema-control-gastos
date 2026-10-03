import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
export class CreateGoalDto {
  @IsString() @Length(1, 80) name!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(2_147_483_647) targetAmount!: number;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) targetDate?: string;
}
export class UpdateGoalDto extends PartialType(CreateGoalDto) {}
export class CreateContributionDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(2_147_483_647) amount!: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
}
