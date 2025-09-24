import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(createCollectionDto: CreateCollectionDto) {
    try {
      return await this.prisma.collection.create({
        data: createCollectionDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Collection with this name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.collection.findMany({
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
    const collection = await this.prisma.collection.findUnique({
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

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async update(id: string, updateCollectionDto: Partial<CreateCollectionDto>) {
    await this.findOne(id);
    try {
      return await this.prisma.collection.update({
        where: { id },
        data: updateCollectionDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Collection with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.collection.delete({
      where: { id },
    });
  }
}
