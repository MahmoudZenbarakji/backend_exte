import { Module } from '@nestjs/common';
import { SubcategoriesService } from './subcategory.service';
import { SubcategoriesController } from './subcategory.controller';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  imports: [],
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService,PrismaService],
  exports: [SubcategoriesService],
})
export class SubcategoriesModule {}
