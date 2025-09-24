import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  imports: [],
  controllers: [FavoritesController],
  providers: [FavoritesService,PrismaService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
