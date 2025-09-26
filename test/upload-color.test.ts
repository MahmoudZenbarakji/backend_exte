import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from '../src/uploadimage/uploadimage.controller';
import { UploadService } from '../src/uploadimage/uploadimage.service';
import { ProductService } from '../src/product/product.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Upload Color Features', () => {
  let controller: UploadController;
  let uploadService: UploadService;
  let productService: ProductService;

  const mockUploadService = {
    uploadProductImage: jest.fn(),
    uploadMultipleProductImages: jest.fn(),
  };

  const mockProductService = {
    addMultipleImages: jest.fn(),
  };

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        UploadService,
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideProvider(UploadService)
      .useValue(mockUploadService)
      .overrideProvider(ProductService)
      .useValue(mockProductService)
      .compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get<UploadService>(UploadService);
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Upload Multiple Product Images with Color', () => {
    it('should upload multiple images and associate them with a color', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'red-image-1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake-image-data-1'),
          size: 1024,
        },
        {
          fieldname: 'files',
          originalname: 'red-image-2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake-image-data-2'),
          size: 2048,
        },
      ] as Express.Multer.File[];

      const mockUploadResults = [
        { url: '/uploads/products/red-image-1.jpg' },
        { url: '/uploads/products/red-image-2.jpg' },
      ];

      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockUploadService.uploadMultipleProductImages.mockResolvedValue(mockUploadResults);
      mockProductService.addMultipleImages.mockResolvedValue({ count: 2 });

      const result = await controller.uploadMultipleProductImages(
        mockFiles,
        'Red',
        'test-product-id',
      );

      expect(result).toEqual({
        message: 'Images uploaded and associated with color successfully',
        images: mockUploadResults,
        color: 'Red',
        productId: 'test-product-id',
      });

      expect(mockUploadService.uploadMultipleProductImages).toHaveBeenCalledWith(
        mockFiles,
        'Red',
        'test-product-id',
      );

      expect(mockProductService.addMultipleImages).toHaveBeenCalledWith('test-product-id', [
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
      ]);
    });

    it('should handle upload without color specification', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
          size: 1024,
        },
      ] as Express.Multer.File[];

      const mockUploadResults = [{ url: '/uploads/products/image.jpg' }];
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockUploadService.uploadMultipleProductImages.mockResolvedValue(mockUploadResults);
      mockProductService.addMultipleImages.mockResolvedValue({ count: 1 });

      const result = await controller.uploadMultipleProductImages(
        mockFiles,
        undefined,
        'test-product-id',
      );

      expect(result).toEqual({
        message: 'Images uploaded successfully',
        images: mockUploadResults,
        productId: 'test-product-id',
      });

      expect(mockProductService.addMultipleImages).toHaveBeenCalledWith('test-product-id', [
        {
          url: '/uploads/products/image.jpg',
          color: undefined,
          isMain: true,
          order: 1,
        },
      ]);
    });

    it('should handle empty files array', async () => {
      const result = await controller.uploadMultipleProductImages([], 'Red', 'test-product-id');

      expect(result).toEqual({
        message: 'No files provided',
        images: [],
        color: 'Red',
        productId: 'test-product-id',
      });

      expect(mockUploadService.uploadMultipleProductImages).not.toHaveBeenCalled();
      expect(mockProductService.addMultipleImages).not.toHaveBeenCalled();
    });

    it('should handle upload service errors', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
          size: 1024,
        },
      ] as Express.Multer.File[];

      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockUploadService.uploadMultipleProductImages.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        controller.uploadMultipleProductImages(mockFiles, 'Red', 'test-product-id'),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('Color Image Management Workflow', () => {
    it('should handle complete workflow: upload images for multiple colors', async () => {
      const mockProduct = {
        id: 'test-product-id',
        name: 'Test Product',
      };

      // Upload Red images
      const redFiles = [
        {
          fieldname: 'files',
          originalname: 'red-1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('red-image-1'),
          size: 1024,
        },
      ] as Express.Multer.File[];

      const redUploadResults = [{ url: '/uploads/products/red-1.jpg' }];

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockUploadService.uploadMultipleProductImages.mockResolvedValue(redUploadResults);
      mockProductService.addMultipleImages.mockResolvedValue({ count: 1 });

      const redResult = await controller.uploadMultipleProductImages(
        redFiles,
        'Red',
        'test-product-id',
      );

      expect(redResult.color).toBe('Red');
      expect(redResult.images).toEqual(redUploadResults);

      // Upload Blue images
      const blueFiles = [
        {
          fieldname: 'files',
          originalname: 'blue-1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('blue-image-1'),
          size: 1024,
        },
      ] as Express.Multer.File[];

      const blueUploadResults = [{ url: '/uploads/products/blue-1.jpg' }];

      mockUploadService.uploadMultipleProductImages.mockResolvedValue(blueUploadResults);
      mockProductService.addMultipleImages.mockResolvedValue({ count: 1 });

      const blueResult = await controller.uploadMultipleProductImages(
        blueFiles,
        'Blue',
        'test-product-id',
      );

      expect(blueResult.color).toBe('Blue');
      expect(blueResult.images).toEqual(blueUploadResults);

      // Verify both uploads were called
      expect(mockUploadService.uploadMultipleProductImages).toHaveBeenCalledTimes(2);
      expect(mockProductService.addMultipleImages).toHaveBeenCalledTimes(2);
    });
  });
});




























