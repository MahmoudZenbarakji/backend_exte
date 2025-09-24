import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubcategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
