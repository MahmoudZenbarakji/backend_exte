import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CacheService } from '../cache/cache.service';
import { Product, ProductImage, ProductVariant } from '@prisma/client';

// Type for product with relations
type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  category: any;
  subcategory: any;
  collection: any;
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Validate subcategory if provided
    if (createProductDto.subcategoryId) {
      const subcategory = await this.prisma.subcategory.findUnique({
        where: { id: createProductDto.subcategoryId },
      });

      if (!subcategory) {
        throw new NotFoundException('Subcategory not found');
      }
    }

    // Validate collection if provided
    if (createProductDto.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: createProductDto.collectionId },
      });

      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
    }
    
    try {
      const { images, variants, ...productData } = createProductDto;
      
      // Generate SKU if not provided
      if (!productData.sku) {
        productData.sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      }

      const product = await this.prisma.product.create({
        data: {
          ...productData,
          images: images ? {
            create: images.map((image, index) => ({
              ...image,
              order: image.order ?? index,
            })),
          } : undefined,
          variants: variants ? {
            create: variants,
          } : undefined,
        },
        include: {
          category: true,
          subcategory: true,
          collection: true,
          images: {
            orderBy: { order: 'asc' },
          },
          variants: true,
        },
      });

      return product;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw error;
    }
  }

  async findAll(filters?: {
    categoryId?: string;
    subcategoryId?: string;
    collectionId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  }) {
    // Generate cache key based on filters
    const cacheKey = CacheService.getProductsKey(filters || {});
    
    // Try to get from cache first
    const cachedProducts = await this.cacheService.get(cacheKey);
    if (cachedProducts) {
      return cachedProducts;
    }

    const where: any = {};

    if (filters) {
      if (filters.categoryId) where.categoryId = filters.categoryId;
      if (filters.subcategoryId) where.subcategoryId = filters.subcategoryId;
      if (filters.collectionId) where.collectionId = filters.collectionId;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        variants: true,
      },
    });

    // Cache the results for 5 minutes
    await this.cacheService.set(cacheKey, products, 300);
    
    return products;
  }

  async findOne(id: string) {
    // Try to get from cache first
    const cacheKey = CacheService.getProductKey(id);
    const cachedProduct = await this.cacheService.get(cacheKey);
    if (cachedProduct) {
      return cachedProduct;
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        collection: true,
        images: {
          orderBy: { order: 'asc' },
        },
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Cache the product for 10 minutes
    await this.cacheService.set(cacheKey, product, 600);

    return product;
  }

  // Get images for a specific color
  async getImagesByColor(productId: string, color: string) {
    const product = await this.findOne(productId) as ProductWithRelations;
    
    const colorImages = product.images.filter(image => 
      image.color?.toLowerCase() === color.toLowerCase()
    );

    if (colorImages.length === 0) {
      // Return main images if no color-specific images found
      return product.images.filter(image => image.isMain);
    }

    return colorImages;
  }

  // Get available colors for a product
  async getAvailableColors(productId: string) {
    const product = await this.findOne(productId) as ProductWithRelations;
    
    const colors = new Set<string>();
    
    // Get colors from variants
    product.variants.forEach(variant => {
      colors.add(variant.color);
    });

    // Get colors from images
    product.images.forEach(image => {
      if (image.color) {
        colors.add(image.color);
      }
    });

    return Array.from(colors);
  }

  async update(id: string, updateProductDto: Partial<CreateProductDto>) {
    await this.findOne(id);

    // Validate references if provided
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (updateProductDto.subcategoryId) {
      const subcategory = await this.prisma.subcategory.findUnique({
        where: { id: updateProductDto.subcategoryId },
      });
      if (!subcategory) {
        throw new NotFoundException('Subcategory not found');
      }
    }

    if (updateProductDto.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: updateProductDto.collectionId },
      });
      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
    }

    try {
      const { images, variants, ...productData } = updateProductDto;

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: productData,
        include: {
          category: true,
          subcategory: true,
          collection: true,
          images: {
            orderBy: { order: 'asc' },
          },
          variants: true,
        },
      });

      // Invalidate cache for this product
      await this.cacheService.del(CacheService.getProductKey(id));
      
      // Invalidate products list cache
      await this.cacheService.del(CacheService.getProductsKey({}));

      return updatedProduct;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    
    try {
      // Try direct deletion first
      const deletedProduct = await this.prisma.product.delete({
        where: { id },
      });

      // Invalidate cache for this product
      await this.cacheService.del(CacheService.getProductKey(id));
      
      // Invalidate products list cache
      await this.cacheService.del(CacheService.getProductsKey({}));

      return deletedProduct;
    } catch (error) {
      // If direct deletion fails due to replica identity issue, try manual cleanup
      console.log(
        'Direct deletion failed, trying manual cleanup:',
        error.message,
      );
      
      // Manually delete related records first
      await this.prisma.productImage.deleteMany({
        where: { productId: id },
      });
      
      await this.prisma.productVariant.deleteMany({
        where: { productId: id },
      });
      
      await this.prisma.cartItem.deleteMany({
        where: { productId: id },
      });
      
      await this.prisma.favorite.deleteMany({
        where: { productId: id },
      });
      
      // Try to delete the product again
      return await this.prisma.product.delete({
        where: { id },
      });
    }
  }

  // Add image to product
  async addImage(productId: string, imageData: {
    url: string;
    color?: string;
    isMain?: boolean;
    order?: number;
  }) {
    await this.findOne(productId);

    return this.prisma.productImage.create({
      data: {
        ...imageData,
        productId,
      },
    });
  }

  // Add multiple images to product with color information
  async addMultipleImages(productId: string, imagesData: Array<{
    url: string;
    color?: string;
    isMain?: boolean;
    order?: number;
  }>) {
    await this.findOne(productId);

    return this.prisma.productImage.createMany({
      data: imagesData.map(imageData => ({
        ...imageData,
        productId,
      })),
    });
  }

  // Remove image from product
  async removeImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    return this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  // Add variant to product
  async addVariant(productId: string, variantData: {
    color: string;
    size: string;
    stock?: number;
    price?: number;
    sku: string;
  }) {
    await this.findOne(productId);

    try {
      return await this.prisma.productVariant.create({
        data: {
          ...variantData,
          productId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Variant with this SKU already exists');
      }
      throw error;
    }
  }

  // Remove variant from product
  async removeVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return this.prisma.productVariant.delete({
      where: { id: variantId },
    });
  }
}
