import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateMovementDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(2_147_483_647) amount!: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  @IsUUID() categoryId!: string;
  @IsString() @Length(1, 80) description!: string;
  @IsOptional() @IsString() @Length(0, 240) notes?: string;
  @IsIn(['income', 'expense']) type!: 'income' | 'expense';
  @IsIn(['fixed', 'variable']) expenseNature!: 'fixed' | 'variable';
  @IsIn(['none', 'weekly', 'biweekly', 'monthly', 'yearly']) recurrence!:
    'none' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) recurrenceEnd?: string;
  @IsOptional() @IsBoolean() recurrencePaused?: boolean;
  @IsOptional() @IsUUID() recurrenceSourceId?: string;
}
export class UpdateMovementDto extends PartialType(CreateMovementDto) {}
export class MovementQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 25;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsIn(['income', 'expense']) type?: 'income' | 'expense';
  @IsOptional() @IsIn(['fixed', 'variable']) expenseNature?: 'fixed' | 'variable';
  @IsOptional() @IsIn(['date', 'amount']) sortBy: 'date' | 'amount' = 'date';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder: 'asc' | 'desc' = 'desc';
}
export class ImportMovementsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateMovementDto)
  movements!: CreateMovementDto[];
}
export class BulkDeleteDto {
  @IsArray() @ArrayMaxSize(500) @IsUUID(undefined, { each: true }) ids!: string[];
}
export class BulkCategoryDto extends BulkDeleteDto {
  @IsUUID() categoryId!: string;
}
