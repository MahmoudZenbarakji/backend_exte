import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createSubcategoryDto: CreateSubcategoryDto) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createSubcategoryDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    try {
      return await this.prisma.subcategory.create({
        data: createSubcategoryDto,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Subcategory with this name already exists in this category');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.subcategory.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
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

  async findByCategory(categoryId: string) {
    return this.prisma.subcategory.findMany({
      where: { categoryId },
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
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        category: true,
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

    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    return subcategory;
  }

  async update(id: string, updateSubcategoryDto: Partial<CreateSubcategoryDto>) {
    await this.findOne(id);
    
    if (updateSubcategoryDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateSubcategoryDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    try {
      return await this.prisma.subcategory.update({
        where: { id },
        data: updateSubcategoryDto,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Subcategory with this name already exists in this category');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    
    // Check if there are any products associated with this subcategory
    const productsCount = await this.prisma.product.count({
      where: { subcategoryId: id },
    });
    
    if (productsCount > 0) {
      throw new ConflictException(
        `Cannot delete subcategory. There are ${productsCount} product(s) associated with this subcategory. Please move or delete the products first.`
      );
    }
    
    return this.prisma.subcategory.delete({
      where: { id },
    });
  }
}
