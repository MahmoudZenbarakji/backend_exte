import { Module } from '@nestjs/common';
import { ProductsService } from './product.service';
import { ProductsController } from './product.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { AppCacheModule } from '../cache/cache.module';

@Module({
  imports: [AppCacheModule],
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, CacheService],
  exports: [ProductsService],
})
export class ProductsModule {}
