import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class OptimizedProductService {
  private readonly logger = new Logger(OptimizedProductService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(filters: any = {}) {
    const cacheKey = RedisService.getProductsKey(filters);
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log('Products served from cache');
      return cached;
    }

    // Build optimized query
    const where: any = {
      isActive: true,
    };

    if (filters.category) {
      where.category = { name: filters.category };
    }

    if (filters.collection) {
      where.collection = { name: filters.collection };
    }

    if (filters.subcategory) {
      where.subcategoryId = filters.subcategory;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured === 'true';
    }

    if (filters.isOnSale !== undefined) {
      where.isOnSale = filters.isOnSale === 'true';
    }

    // Optimized query with selective includes
    const products = await this.prisma.product.findMany({
      where,
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: filters.limit ? parseInt(filters.limit) : 50,
      skip: filters.offset ? parseInt(filters.offset) : 0,
    });

    // Cache the result
    await this.redis.set(cacheKey, products, RedisService.TTL.PRODUCTS);

    return products;
  }

  async findOne(id: string) {
    const cacheKey = RedisService.getProductKey(id);
    
    // Try to get from cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`Product ${id} served from cache`);
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        variants: {
          orderBy: [
            { color: 'asc' },
            { size: 'asc' },
          ],
        },
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true },
        },
      },
    });

    if (product) {
      // Cache the result
      await this.redis.set(cacheKey, product, RedisService.TTL.PRODUCT);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        images: {
          create: createProductDto.images || [],
        },
        variants: {
          create: createProductDto.variants || [],
        },
      },
      include: {
        images: true,
        variants: true,
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true },
        },
      },
    });

    // Invalidate related caches
    await this.invalidateProductCaches();

    return product;
  }

  async update(id: string, updateProductDto: Partial<CreateProductDto>) {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        images: updateProductDto.images ? {
          deleteMany: {},
          create: updateProductDto.images,
        } : undefined,
        variants: updateProductDto.variants ? {
          deleteMany: {},
          create: updateProductDto.variants,
        } : undefined,
      },
      include: {
        images: true,
        variants: true,
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true },
        },
      },
    });

    // Invalidate caches
    await this.invalidateProductCaches();
    await this.redis.del(RedisService.getProductKey(id));

    return product;
  }

  async remove(id: string) {
    const product = await this.prisma.product.delete({
      where: { id },
    });

    // Invalidate caches
    await this.invalidateProductCaches();
    await this.redis.del(RedisService.getProductKey(id));

    return product;
  }

  async findByCategory(categoryName: string, filters: any = {}) {
    const cacheKey = RedisService.getProductsKey({ category: categoryName, ...filters });
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: { name: categoryName },
        ...this.buildFilters(filters),
      },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: filters.limit ? parseInt(filters.limit) : 50,
      skip: filters.offset ? parseInt(filters.offset) : 0,
    });

    await this.redis.set(cacheKey, products, RedisService.TTL.PRODUCTS);
    return products;
  }

  async findByCollection(collectionName: string, filters: any = {}) {
    const cacheKey = RedisService.getProductsKey({ collection: collectionName, ...filters });
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        collection: { name: collectionName },
        ...this.buildFilters(filters),
      },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: filters.limit ? parseInt(filters.limit) : 50,
      skip: filters.offset ? parseInt(filters.offset) : 0,
    });

    await this.redis.set(cacheKey, products, RedisService.TTL.PRODUCTS);
    return products;
  }

  async findBySubcategory(subcategoryId: string, filters: any = {}) {
    const cacheKey = RedisService.getProductsKey({ subcategory: subcategoryId, ...filters });
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        subcategoryId,
        ...this.buildFilters(filters),
      },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: filters.limit ? parseInt(filters.limit) : 50,
      skip: filters.offset ? parseInt(filters.offset) : 0,
    });

    await this.redis.set(cacheKey, products, RedisService.TTL.PRODUCTS);
    return products;
  }

  private buildFilters(filters: any) {
    const where: any = {};

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured === 'true';
    }

    if (filters.isOnSale !== undefined) {
      where.isOnSale = filters.isOnSale === 'true';
    }

    return where;
  }

  private async invalidateProductCaches() {
    // Invalidate all product-related caches
    await this.redis.delPattern('products:*');
    await this.redis.delPattern('categories:*');
  }
}
