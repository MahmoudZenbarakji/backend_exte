import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadService } from './uploadimage.service';
import { UploadController } from './uploadimage.controller';
import { ProductsService } from '../product/product.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppCacheModule } from '../cache/cache.module';

@Module({
  imports: [
    AppCacheModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE') || 2097152, // 2MB (reduced for better performance)
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, ProductsService, PrismaService],
  exports: [UploadService],
})
export class UploadModule {}
