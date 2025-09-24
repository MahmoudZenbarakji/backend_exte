import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@Controller('products')
@UseGuards(ThrottlerGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }


  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('collectionId') collectionId?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const filters: any = {};
    
    if (categoryId) filters.categoryId = categoryId;
    if (subcategoryId) filters.subcategoryId = subcategoryId;
    if (collectionId) filters.collectionId = collectionId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';

    return this.productsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/colors')
  getAvailableColors(@Param('id') id: string) {
    return this.productsService.getAvailableColors(id);
  }

  @Get(':id/images/:color')
  getImagesByColor(@Param('id') id: string, @Param('color') color: string) {
    return this.productsService.getImagesByColor(id, color);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateProductDto: Partial<CreateProductDto>) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Image management endpoints
  @Post(':id/images')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  addImage(
    @Param('id') id: string,
    @Body() imageData: {
      url: string;
      color?: string;
      isMain?: boolean;
      order?: number;
    },
  ) {
    return this.productsService.addImage(id, imageData);
  }

  @Post(':id/images/multiple')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  addMultipleImages(
    @Param('id') id: string,
    @Body() imagesData: Array<{
      url: string;
      color?: string;
      isMain?: boolean;
      order?: number;
    }>,
  ) {
    return this.productsService.addMultipleImages(id, imagesData);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productsService.removeImage(id, imageId);
  }

  // Variant management endpoints
  @Post(':id/variants')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  addVariant(
    @Param('id') id: string,
    @Body() variantData: {
      color: string;
      size: string;
      stock?: number;
      price?: number;
      sku: string;
    },
  ) {
    return this.productsService.addVariant(id, variantData);
  }

  @Delete(':id/variants/:variantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  removeVariant(@Param('id') id: string, @Param('variantId') variantId: string) {
    return this.productsService.removeVariant(id, variantId);
  }
}
