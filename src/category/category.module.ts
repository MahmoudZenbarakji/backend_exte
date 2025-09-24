import { Module } from '@nestjs/common';
import { CategoriesService } from './category.service';
import { CategoriesController } from './category.controller';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  imports: [],
  controllers: [CategoriesController],
  providers: [CategoriesService,PrismaService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
