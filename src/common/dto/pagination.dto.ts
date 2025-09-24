import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  get skip(): number {
    return this.offset !== undefined ? this.offset : (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}

export class ProductFiltersDto extends PaginationDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  collection?: string;

  @IsOptional()
  subcategory?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  isOnSale?: boolean;

  @IsOptional()
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';

  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
