import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartItemDto,UpdateCartItemDto } from './dto/create-cart.dto';
@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addItem(userId: number, createCartItemDto: CreateCartItemDto) {
    // Check if product exists with variants
    const product = await this.prisma.product.findUnique({
      where: { id: createCartItemDto.productId },
      include: {
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is active
    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    // Check stock - for products with variants, check variant stock
    let availableStock = product.stock;
    if (product.variants && product.variants.length > 0) {
      // For products with variants, color and size are required
      if (!createCartItemDto.color || !createCartItemDto.size) {
        throw new BadRequestException('Color and size are required for this product');
      }
      
      // Find the specific variant (with case-insensitive matching and trimming)
      const variant = product.variants.find(v => 
        v.color?.trim()?.toLowerCase() === createCartItemDto.color?.trim()?.toLowerCase() && 
        v.size?.trim()?.toLowerCase() === createCartItemDto.size?.trim()?.toLowerCase()
      );
      
      if (!variant) {
        throw new BadRequestException('Product variant not found');
      }
      
      availableStock = variant.stock;
    }

    if (availableStock < createCartItemDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId_color_size: {
          userId,
          productId: createCartItemDto.productId,
          color: createCartItemDto.color || null,
          size: createCartItemDto.size || null,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + createCartItemDto.quantity;
      
      if (availableStock < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
      });
    }

    // Create new cart item
    return this.prisma.cartItem.create({
      data: {
        userId,
        productId: createCartItemDto.productId,
        quantity: createCartItemDto.quantity,
        color: createCartItemDto.color,
        size: createCartItemDto.size,
      },
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
    });
  }

  async findByUser(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const subtotal = cartItems.reduce((total, item) => {
      // Use sale price if product is on sale, otherwise use regular price
      const price = item.product.isOnSale && item.product.salePrice ? item.product.salePrice : item.product.price;
      return total + (price * item.quantity);
    }, 0);

    const totalItems = cartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    return {
      items: cartItems,
      summary: {
        subtotal,
        totalItems,
        shipping: subtotal > 50 ? 0 : 10, // Free shipping over SYP 50
        tax: subtotal * 0.1, // 10% tax
        total: subtotal + (subtotal > 50 ? 0 : 10) + (subtotal * 0.1),
      },
    };
  }

  async updateItem(userId: number, itemId: string, updateCartItemDto: UpdateCartItemDto) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock
    if (cartItem.product.stock < updateCartItemDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateCartItemDto.quantity },
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
    });
  }

  async removeItem(userId: number, itemId: string) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: number) {
    return this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  async getCartCount(userId: number): Promise<number> {
    const result = await this.prisma.cartItem.aggregate({
      where: { userId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }
}
