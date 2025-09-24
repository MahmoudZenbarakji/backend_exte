import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CollectionsModule } from './collection/collection.module';
import { CategoriesModule } from './category/category.module';
import { SubcategoriesModule } from './subcategory/subcategory.module';
import { ProductsModule } from './product/product.module';
import { SalesModule } from './sales/sales.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './order/order.module';
import { UploadModule } from './uploadimage/uploadimage.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppCacheModule } from './cache/cache.module';
import { CacheService } from './cache/cache.service';
import { throttlerConfig } from './throttler/throttler.config';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,   // 👈 makes ConfigService available everywhere
    }),
    ThrottlerModule.forRoot(throttlerConfig),
    AppCacheModule,
    PrismaModule,
    AuthModule, 
    UsersModule,
    CollectionsModule,
    CategoriesModule,
    SubcategoriesModule,
    ProductsModule,
    SalesModule,
    FavoritesModule,
    CartModule,
    OrdersModule,
    UploadModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, CacheService],
})
export class AppModule {}
