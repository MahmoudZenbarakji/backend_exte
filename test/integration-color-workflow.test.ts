import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProductService } from '../src/product/product.service';
import { UploadService } from '../src/uploadimage/uploadimage.service';
import { ProductController } from '../src/product/product.controller';
import { UploadController } from '../src/uploadimage/uploadimage.controller';

describe('Color Feature Integration Tests', () => {
  let app: INestApplication;
  let productService: ProductService;
  let uploadService: UploadService;
  let prismaService: PrismaService;

  const testProductId = 'integration-test-product';
  const testCategoryId = 'integration-test-category';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController, UploadController],
      providers: [ProductService, UploadService, PrismaService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    productService = module.get<ProductService>(ProductService);
    uploadService = module.get<UploadService>(UploadService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.productImage.deleteMany({
      where: { productId: testProductId },
    });
    await prismaService.productVariant.deleteMany({
      where: { productId: testProductId },
    });
    await prismaService.product.deleteMany({
      where: { id: testProductId },
    });
    await prismaService.category.deleteMany({
      where: { id: testCategoryId },
    });
  });

  describe('Complete Color Workflow', () => {
    it('should handle complete color management workflow', async () => {
      // 1. Create a test category
      const category = await prismaService.category.create({
        data: {
          id: testCategoryId,
          name: 'Test Category',
          description: 'Test Description',
          isActive: true,
        },
      });

      // 2. Create a test product
      const product = await prismaService.product.create({
        data: {
          id: testProductId,
          name: 'Integration Test Product',
          description: 'Test Description',
          price: 100,
          stock: 50,
          sku: 'INT-TEST-001',
          categoryId: category.id,
          isActive: true,
          isFeatured: false,
        },
      });

      // 3. Add product variants with colors
      await prismaService.productVariant.createMany({
        data: [
          {
            size: 'M',
            color: 'Red',
            stock: 25,
            productId: product.id,
          },
          {
            size: 'L',
            color: 'Blue',
            stock: 25,
            productId: product.id,
          },
        ],
      });

      // 4. Test getting available colors
      const availableColors = await productService.getAvailableColors(product.id);
      expect(availableColors).toEqual(['Red', 'Blue']);

      // 5. Add images for Red color
      const redImages = [
        {
          url: '/uploads/products/red-image-1.jpg',
          color: 'Red',
          isMain: true,
          order: 1,
        },
        {
          url: '/uploads/products/red-image-2.jpg',
          color: 'Red',
          isMain: false,
          order: 2,
        },
      ];

      await productService.addMultipleImages(product.id, redImages);

      // 6. Add images for Blue color
      const blueImages = [
        {
          url: '/uploads/products/blue-image-1.jpg',
          color: 'Blue',
          isMain: true,
          order: 1,
        },
      ];

      await productService.addMultipleImages(product.id, blueImages);

      // 7. Test getting images by color
      const redColorImages = await productService.getImagesByColor(product.id, 'Red');
      expect(redColorImages).toHaveLength(2);
      expect(redColorImages[0].color).toBe('Red');
      expect(redColorImages[0].isMain).toBe(true);

      const blueColorImages = await productService.getImagesByColor(product.id, 'Blue');
      expect(blueColorImages).toHaveLength(1);
      expect(blueColorImages[0].color).toBe('Blue');

      // 8. Test getting images for non-existent color (should return all images)
      const greenColorImages = await productService.getImagesByColor(product.id, 'Green');
      expect(greenColorImages).toHaveLength(3); // All images as fallback

      // 9. Test removing an image
      const imageToRemove = redColorImages[1];
      const removedImage = await productService.removeImage(product.id, imageToRemove.id);
      expect(removedImage.id).toBe(imageToRemove.id);

      // 10. Verify image was removed
      const updatedRedImages = await productService.getImagesByColor(product.id, 'Red');
      expect(updatedRedImages).toHaveLength(1);

      // 11. Test final state
      const finalColors = await productService.getAvailableColors(product.id);
      expect(finalColors).toEqual(['Red', 'Blue']);
    });

    it('should handle edge cases in color workflow', async () => {
      // Create test data
      const category = await prismaService.category.create({
        data: {
          id: testCategoryId,
          name: 'Test Category',
          description: 'Test Description',
          isActive: true,
        },
      });

      const product = await prismaService.product.create({
        data: {
          id: testProductId,
          name: 'Edge Case Product',
          description: 'Test Description',
          price: 100,
          stock: 50,
          sku: 'EDGE-TEST-001',
          categoryId: category.id,
          isActive: true,
          isFeatured: false,
        },
      });

      // Test with product that has no variants or images
      const emptyColors = await productService.getAvailableColors(product.id);
      expect(emptyColors).toEqual([]);

      // Test getting images for product with no images
      const noImages = await productService.getImagesByColor(product.id, 'Red');
      expect(noImages).toEqual([]);

      // Test adding images without color specification
      const genericImages = [
        {
          url: '/uploads/products/generic-image.jpg',
          color: null,
          isMain: true,
          order: 1,
        },
      ];

      await productService.addMultipleImages(product.id, genericImages);

      // Test getting images for any color should return the generic image
      const anyColorImages = await productService.getImagesByColor(product.id, 'AnyColor');
      expect(anyColorImages).toHaveLength(1);
      expect(anyColorImages[0].color).toBeNull();
    });

    it('should handle color case sensitivity', async () => {
      // Create test data
      const category = await prismaService.category.create({
        data: {
          id: testCategoryId,
          name: 'Test Category',
          description: 'Test Description',
          isActive: true,
        },
      });

      const product = await prismaService.product.create({
        data: {
          id: testProductId,
          name: 'Case Sensitivity Product',
          description: 'Test Description',
          price: 100,
          stock: 50,
          sku: 'CASE-TEST-001',
          categoryId: category.id,
          isActive: true,
          isFeatured: false,
        },
      });

      // Add variants with different case colors
      await prismaService.productVariant.createMany({
        data: [
          {
            size: 'M',
            color: 'red',
            stock: 25,
            productId: product.id,
          },
          {
            size: 'L',
            color: 'RED',
            stock: 25,
            productId: product.id,
          },
          {
            size: 'XL',
            color: 'Red',
            stock: 25,
            productId: product.id,
          },
        ],
      });

      // Add images with different case colors
      await productService.addMultipleImages(product.id, [
        {
          url: '/uploads/products/red-lowercase.jpg',
          color: 'red',
          isMain: true,
          order: 1,
        },
        {
          url: '/uploads/products/red-uppercase.jpg',
          color: 'RED',
          isMain: false,
          order: 2,
        },
        {
          url: '/uploads/products/red-titlecase.jpg',
          color: 'Red',
          isMain: false,
          order: 3,
        },
      ]);

      // Test getting available colors (should include all variations)
      const availableColors = await productService.getAvailableColors(product.id);
      expect(availableColors).toContain('red');
      expect(availableColors).toContain('RED');
      expect(availableColors).toContain('Red');

      // Test getting images by specific case
      const lowercaseImages = await productService.getImagesByColor(product.id, 'red');
      expect(lowercaseImages).toHaveLength(1);
      expect(lowercaseImages[0].color).toBe('red');

      const uppercaseImages = await productService.getImagesByColor(product.id, 'RED');
      expect(uppercaseImages).toHaveLength(1);
      expect(uppercaseImages[0].color).toBe('RED');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of colors and images efficiently', async () => {
      // Create test data
      const category = await prismaService.category.create({
        data: {
          id: testCategoryId,
          name: 'Performance Test Category',
          description: 'Test Description',
          isActive: true,
        },
      });

      const product = await prismaService.product.create({
        data: {
          id: testProductId,
          name: 'Performance Test Product',
          description: 'Test Description',
          price: 100,
          stock: 50,
          sku: 'PERF-TEST-001',
          categoryId: category.id,
          isActive: true,
          isFeatured: false,
        },
      });

      // Add many variants with different colors
      const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Gray', 'Pink', 'Purple', 'Orange'];
      const variants = colors.map((color, index) => ({
        size: 'M',
        color,
        stock: 10,
        productId: product.id,
      }));

      await prismaService.productVariant.createMany({
        data: variants,
      });

      // Add images for each color
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        await productService.addMultipleImages(product.id, [
          {
            url: `/uploads/products/${color.toLowerCase()}-image-1.jpg`,
            color,
            isMain: true,
            order: 1,
          },
          {
            url: `/uploads/products/${color.toLowerCase()}-image-2.jpg`,
            color,
            isMain: false,
            order: 2,
          },
        ]);
      }

      // Test performance of getting available colors
      const startTime = Date.now();
      const availableColors = await productService.getAvailableColors(product.id);
      const endTime = Date.now();

      expect(availableColors).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      // Test performance of getting images for each color
      for (const color of colors) {
        const colorStartTime = Date.now();
        const colorImages = await productService.getImagesByColor(product.id, color);
        const colorEndTime = Date.now();

        expect(colorImages).toHaveLength(2);
        expect(colorEndTime - colorStartTime).toBeLessThan(500); // Should complete within 500ms
      }
    });
  });
});




























