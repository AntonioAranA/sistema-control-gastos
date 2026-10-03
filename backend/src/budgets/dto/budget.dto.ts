import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
export class CategoryLimitDto {
  @IsUUID() categoryId!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(2_147_483_647) amount!: number;
}
export class UpsertBudgetDto {
  @Matches(/^\d{4}-\d{2}$/) month!: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(2_147_483_647) general!: number;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CategoryLimitDto)
  categories!: CategoryLimitDto[];
}
