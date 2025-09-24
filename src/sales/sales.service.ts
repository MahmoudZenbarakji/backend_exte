import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
    const { productIds, ...saleData } = createSaleDto;

    // Validate dates
    const startDate = new Date(saleData.startDate);
    const endDate = new Date(saleData.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate products if provided
    if (productIds && productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products not found');
      }
    }

    return this.prisma.sale.create({
      data: {
        ...saleData,
        startDate,
        endDate,
        products: productIds ? {
          connect: productIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.sale.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async update(id: string, updateSaleDto: Partial<CreateSaleDto>) {
    await this.findOne(id);

    const { productIds, ...saleData } = updateSaleDto;

    // Validate dates if provided
    if (saleData.startDate && saleData.endDate) {
      const startDate = new Date(saleData.startDate);
      const endDate = new Date(saleData.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate products if provided
    if (productIds && productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products not found');
      }
    }

    return this.prisma.sale.update({
      where: { id },
      data: {
        ...saleData,
        startDate: saleData.startDate ? new Date(saleData.startDate) : undefined,
        endDate: saleData.endDate ? new Date(saleData.endDate) : undefined,
        products: productIds ? {
          set: productIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sale.delete({
      where: { id },
    });
  }

  // Calculate discount for a product
  async calculateDiscount(productId: string, orderAmount?: number) {
    const activeSales = await this.prisma.sale.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        products: {
          some: { id: productId },
        },
      },
    });

    if (activeSales.length === 0) {
      return { discount: 0, saleId: null };
    }

    // Find the best discount
    let bestDiscount = 0;
    let bestSaleId = null;

    for (const sale of activeSales) {
      // Check minimum order requirement
      if (sale.minimumOrder && orderAmount && orderAmount < sale.minimumOrder) {
        continue;
      }

      let discount = 0;
      if (sale.discountType === 'percentage') {
        discount = sale.discountValue;
      } else {
        // For fixed discount, we need the product price to calculate percentage
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
        });
        if (product) {
          discount = (sale.discountValue / product.price) * 100;
        }
      }

      // Apply maximum discount limit
      if (sale.maximumDiscount && discount > sale.maximumDiscount) {
        discount = sale.maximumDiscount;
      }

      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestSaleId = sale.id;
      }
    }

    return { discount: bestDiscount, saleId: bestSaleId };
  }
}
