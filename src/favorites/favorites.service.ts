import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createFavoriteDto: CreateFavoriteDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: createFavoriteDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already favorited
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: createFavoriteDto.productId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Product already in favorites');
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        productId: createFavoriteDto.productId,
      },
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
    });
  }

  async findByUser(userId: number) {
    return this.prisma.favorite.findMany({
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
  }

  async findOne(userId: number, productId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
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
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return favorite;
  }

  async remove(userId: number, productId: string) {
    const favorite = await this.findOne(userId, productId);
    
    return this.prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async removeById(userId: number, favoriteId: string) {
    const favorite = await this.prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return this.prisma.favorite.delete({
      where: { id: favoriteId },
    });
  }

  async isFavorite(userId: number, productId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!favorite;
  }
}
