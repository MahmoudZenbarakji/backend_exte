import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, CreateAddressDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, Role } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { userId, items, shippingAddress, paymentMethod, totalAmount, notes } = createOrderDto;

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        price: item.price,
      });
    }

    // Calculate shipping and tax
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
    const tax = subtotal * 0.1; // 10% tax
    const calculatedTotal = subtotal + shipping + tax;

    // Validate total amount matches
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      throw new BadRequestException('Total amount does not match calculated total');
    }

    // Get or create default address for orders
    let defaultAddress = await this.prisma.address.findFirst({
      where: { street: 'Default Order Address' }
    });
    
    if (!defaultAddress) {
      defaultAddress = await this.prisma.address.create({
        data: {
          userId: 1, // Admin user ID
          street: 'Default Order Address',
          city: 'Default City',
          state: 'Default State',
          zipCode: '00000',
          country: 'Default Country',
          isDefault: true
        }
      });
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        addressId: defaultAddress.id,
        subtotal,
        shipping,
        tax,
        total: totalAmount,
        notes: notes || `Shipping Address: ${shippingAddress}\nPayment Method: ${paymentMethod}`,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Update product stock
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear cart items for ordered products
    await this.prisma.cartItem.deleteMany({
      where: {
        userId,
        productId: {
          in: items.map(item => item.productId),
        },
      },
    });

    return order;
  }

  async findAll(userRole?: Role, status?: OrderStatus) {
    // Only admins can see all orders
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const whereClause = status ? { status } : {};

    return this.prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId?: number, userRole?: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access permissions
    if (userRole !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus, userRole?: Role) {
    // Only admins can update order status
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, userRole?: Role) {
    // Only admins can update payment status
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });
  }

  // Address management
  async createAddress(userId: number, createAddressDto: CreateAddressDto) {
    return this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
      },
    });
  }

  async findUserAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: {
        isDefault: 'desc',
      },
    });
  }

  async setDefaultAddress(userId: number, addressId: string) {
    // First, remove default from all addresses
    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set the new default
    return this.prisma.address.update({
      where: {
        id: addressId,
        userId,
      },
      data: { isDefault: true },
    });
  }

  async updateOrder(id: string, updateData: { notes?: string }, userId: number, userRole?: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access permissions - user can only update their own orders
    if (userRole !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Only allow updates for pending or processing orders
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Cannot update order that is not pending or processing');
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async cancelOrder(id: string, cancelData: { reason: string }, userId: number, userRole?: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access permissions - user can only cancel their own orders
    if (userRole !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Only allow cancellation for pending or processing orders
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Cannot cancel order that is not pending or processing');
    }

    // Validate reason is provided
    if (!cancelData.reason || cancelData.reason.trim().length === 0) {
      throw new BadRequestException('Cancellation reason is required');
    }

    // Start a transaction to handle order cancellation and stock restoration
    return this.prisma.$transaction(async (tx) => {
      // Update order status to cancelled and add cancellation reason to notes
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          notes: `${order.notes || ''}\n\nCancellation Reason: ${cancelData.reason}\nCancelled on: ${new Date().toISOString()}`.trim(),
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isMain: true },
                    take: 1,
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Restore product stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return updatedOrder;
    });
  }
}
