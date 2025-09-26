import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../src/product/product.service';
import { ProductController } from '../src/product/product.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('Product Color Features', () => {
  let service: ProductService;
  let controller: ProductController;
  let prismaService: PrismaService;

  const mockProduct = {
    id: 'test-product-id',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    stock: 50,
    sku: 'TEST-001',
    categoryId: 'test-category-id',
    subcategoryId: 'test-subcategory-id',
    collectionId: 'test-collection-id',
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [
      {
        id: 'image-1',
        url: '/uploads/products/red-image.jpg',
        color: 'Red',
        isMain: true,
        order: 1,
        productId: 'test-product-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'image-2',
        url: '/uploads/products/blue-image.jpg',
        color: 'Blue',
        isMain: false,
        order: 2,
        productId: 'test-product-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    variants: [
      {
        id: 'variant-1',
        size: 'M',
        color: 'Red',
        stock: 25,
        productId: 'test-product-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'variant-2',
        size: 'L',
        color: 'Blue',
        stock: 25,
        productId: 'test-product-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    productImage: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    controller = module.get<ProductController>(ProductController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Service - Color Features', () => {
    describe('getAvailableColors', () => {
      it('should return available colors from product variants and images', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.productVariant.findMany.mockResolvedValue(mockProduct.variants);
        mockPrismaService.productImage.findMany.mockResolvedValue(mockProduct.images);

        const result = await service.getAvailableColors('test-product-id');

        expect(result).toEqual(['Red', 'Blue']);
        expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
          where: { id: 'test-product-id' },
        });
      });

      it('should throw NotFoundException if product does not exist', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.getAvailableColors('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('getImagesByColor', () => {
      it('should return images for a specific color', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.productImage.findMany.mockResolvedValue([
          mockProduct.images[0], // Red image
        ]);

        const result = await service.getImagesByColor('test-product-id', 'Red');

        expect(result).toHaveLength(1);
        expect(result[0].color).toBe('Red');
        expect(mockPrismaService.productImage.findMany).toHaveBeenCalledWith({
          where: {
            productId: 'test-product-id',
            color: 'Red',
          },
          orderBy: { order: 'asc' },
        });
      });

      it('should return all images if no color-specific images found', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.productImage.findMany
          .mockResolvedValueOnce([]) // No color-specific images
          .mockResolvedValueOnce(mockProduct.images); // All images

        const result = await service.getImagesByColor('test-product-id', 'Green');

        expect(result).toEqual(mockProduct.images);
      });
    });

    describe('addMultipleImages', () => {
      it('should add multiple images with color information', async () => {
        const imagesData = [
          {
            url: '/uploads/products/green-image-1.jpg',
            color: 'Green',
            isMain: true,
            order: 1,
          },
          {
            url: '/uploads/products/green-image-2.jpg',
            color: 'Green',
            isMain: false,
            order: 2,
          },
        ];

        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.productImage.createMany.mockResolvedValue({ count: 2 });

        const result = await service.addMultipleImages('test-product-id', imagesData);

        expect(result).toEqual({ count: 2 });
        expect(mockPrismaService.productImage.createMany).toHaveBeenCalledWith({
          data: imagesData.map(imageData => ({
            ...imageData,
            productId: 'test-product-id',
          })),
        });
      });

      it('should throw NotFoundException if product does not exist', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(
          service.addMultipleImages('non-existent-id', []),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('removeImage', () => {
      it('should remove an image by ID', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
        mockPrismaService.productImage.delete.mockResolvedValue(mockProduct.images[0]);

        const result = await service.removeImage('test-product-id', 'image-1');

        expect(result).toEqual(mockProduct.images[0]);
        expect(mockPrismaService.productImage.delete).toHaveBeenCalledWith({
          where: { id: 'image-1' },
        });
      });
    });
  });

  describe('Product Controller - Color Features', () => {
    describe('GET /products/:id/colors', () => {
      it('should return available colors for a product', async () => {
        jest.spyOn(service, 'getAvailableColors').mockResolvedValue(['Red', 'Blue']);

        const result = await controller.getAvailableColors('test-product-id');

        expect(result).toEqual(['Red', 'Blue']);
        expect(service.getAvailableColors).toHaveBeenCalledWith('test-product-id');
      });
    });

    describe('GET /products/:id/images/:color', () => {
      it('should return images for a specific color', async () => {
        const colorImages = [mockProduct.images[0]];
        jest.spyOn(service, 'getImagesByColor').mockResolvedValue(colorImages);

        const result = await controller.getImagesByColor('test-product-id', 'Red');

        expect(result).toEqual(colorImages);
        expect(service.getImagesByColor).toHaveBeenCalledWith('test-product-id', 'Red');
      });
    });

    describe('POST /products/:id/images/multiple', () => {
      it('should add multiple images with color information', async () => {
        const imagesData = [
          {
            url: '/uploads/products/green-image.jpg',
            color: 'Green',
            isMain: true,
            order: 1,
          },
        ];

        jest.spyOn(service, 'addMultipleImages').mockResolvedValue({ count: 1 });

        const result = await controller.addMultipleImages('test-product-id', imagesData);

        expect(result).toEqual({ count: 1 });
        expect(service.addMultipleImages).toHaveBeenCalledWith('test-product-id', imagesData);
      });
    });

    describe('DELETE /products/:id/images/:imageId', () => {
      it('should remove an image', async () => {
        jest.spyOn(service, 'removeImage').mockResolvedValue(mockProduct.images[0]);

        const result = await controller.removeImage('test-product-id', 'image-1');

        expect(result).toEqual(mockProduct.images[0]);
        expect(service.removeImage).toHaveBeenCalledWith('test-product-id', 'image-1');
      });
    });
  });

  describe('Color Feature Integration Tests', () => {
    it('should handle complete color workflow: add colors, upload images, retrieve by color', async () => {
      // 1. Get available colors
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.productVariant.findMany.mockResolvedValue(mockProduct.variants);
      mockPrismaService.productImage.findMany.mockResolvedValue(mockProduct.images);

      const colors = await service.getAvailableColors('test-product-id');
      expect(colors).toEqual(['Red', 'Blue']);

      // 2. Add new color images
      const newImages = [
        {
          url: '/uploads/products/green-image.jpg',
          color: 'Green',
          isMain: true,
          order: 1,
        },
      ];

      mockPrismaService.productImage.createMany.mockResolvedValue({ count: 1 });
      const addResult = await service.addMultipleImages('test-product-id', newImages);
      expect(addResult).toEqual({ count: 1 });

      // 3. Get images for specific color
      mockPrismaService.productImage.findMany.mockResolvedValue(newImages);
      const colorImages = await service.getImagesByColor('test-product-id', 'Green');
      expect(colorImages).toEqual(newImages);
    });

    it('should handle edge cases: empty colors, invalid colors, missing images', async () => {
      // Test with product that has no colors
      const productWithoutColors = { ...mockProduct, variants: [], images: [] };
      mockPrismaService.product.findUnique.mockResolvedValue(productWithoutColors);
      mockPrismaService.productVariant.findMany.mockResolvedValue([]);
      mockPrismaService.productImage.findMany.mockResolvedValue([]);

      const colors = await service.getAvailableColors('test-product-id');
      expect(colors).toEqual([]);

      // Test getting images for non-existent color
      mockPrismaService.productImage.findMany
        .mockResolvedValueOnce([]) // No color-specific images
        .mockResolvedValueOnce([]); // No fallback images

      const images = await service.getImagesByColor('test-product-id', 'NonExistent');
      expect(images).toEqual([]);
    });
  });
});




























