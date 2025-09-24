import { Module } from '@nestjs/common';
import { OrdersService } from './order.service';
import { OrdersController } from './order.controller';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  imports: [],
  controllers: [OrdersController],
  providers: [OrdersService,PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
