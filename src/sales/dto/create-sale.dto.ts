import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsArray, IsIn } from 'class-validator';

export class CreateSaleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  discountType: string;

  @IsNumber()
  @IsNotEmpty()
  discountValue: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  minimumOrder?: number;

  @IsNumber()
  @IsOptional()
  maximumDiscount?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[];
}
