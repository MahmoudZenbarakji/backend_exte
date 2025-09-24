// users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersController } from './user.controller';
@Module({
  imports: [],
  controllers: [UsersController],       // if UsersService uses Prisma
  providers: [UsersService,PrismaService],
  exports: [UsersService],       // 👈 this makes it available to other modules
})
export class UsersModule {}
