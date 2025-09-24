import { Module } from '@nestjs/common';
import { CollectionsController } from './collection.controller';
import { CollectionsService } from './collection.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [CollectionsController],
  providers: [CollectionsService,PrismaService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
