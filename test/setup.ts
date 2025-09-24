// Global test setup
import { PrismaClient } from '@prisma/client';

// Mock Prisma for tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productImage: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    category: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  })),
}));

// Global test timeout
jest.setTimeout(30000);


























