import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: createCategoryDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        subcategories: {
          select: {
            id: true,
            name: true,
            isActive: true,
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

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: true,
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

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: Partial<CreateCategoryDto>) {
    await this.findOne(id);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    
    try {
      // Get all products in this category
      const products = await this.prisma.product.findMany({
        where: { categoryId: id },
        select: { id: true }
      });
      
      const productIds = products.map(p => p.id);
      
      if (productIds.length > 0) {
        // Delete all related records in bulk
        await Promise.all([
          // Delete product images
          this.prisma.productImage.deleteMany({
            where: { productId: { in: productIds } }
          }),
          
          // Delete product variants
          this.prisma.productVariant.deleteMany({
            where: { productId: { in: productIds } }
          }),
          
          // Delete cart items
          this.prisma.cartItem.deleteMany({
            where: { productId: { in: productIds } }
          }),
          
          // Delete favorites
          this.prisma.favorite.deleteMany({
            where: { productId: { in: productIds } }
          }),
          
          // Delete order items
          this.prisma.orderItem.deleteMany({
            where: { productId: { in: productIds } }
          })
        ]);
        
        // Try to delete product-sale relationships (many-to-many) using raw SQL
        // This may fail due to replica identity issues, so we'll catch and continue
        if (productIds.length > 0) {
          try {
            await this.prisma.$executeRaw`
              DELETE FROM "_ProductToSale" WHERE "A" IN (${productIds.join(',')})
            `;
          } catch (error) {
            // If this fails due to replica identity issues, continue with deletion
            console.log('Warning: Could not delete product-sale relationships:', error.message);
          }
        }
        
        // Delete all products in this category
        await this.prisma.product.deleteMany({
          where: { categoryId: id }
        });
      }
      
      // Delete all subcategories in this category
      await this.prisma.subcategory.deleteMany({
        where: { categoryId: id }
      });
      
      // Finally delete the category
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      // If deletion fails, provide a helpful error message
      throw new ConflictException(
        `Cannot delete category. There may be complex relationships preventing deletion. Please try deleting the products individually first. Error: ${error.message}`
      );
    }
  }
}
