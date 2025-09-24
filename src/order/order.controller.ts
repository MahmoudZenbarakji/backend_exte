import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './order.service';
import { CreateOrderDto, CreateAddressDto } from './dto/create-order.dto';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Request() req, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(req.user.role, status);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard('jwt'))
  findByUser(@Request() req) {
    return this.ordersService.findByUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status, req.user.role);
  }

  @Patch(':id/payment-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  updatePaymentStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
  ) {
    return this.ordersService.updatePaymentStatus(id, paymentStatus, req.user.role);
  }

  // Address management endpoints
  @Post('addresses')
  @UseGuards(AuthGuard('jwt'))
  createAddress(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.ordersService.createAddress(req.user.id, createAddressDto);
  }

  @Get('addresses/my-addresses')
  @UseGuards(AuthGuard('jwt'))
  findUserAddresses(@Request() req) {
    return this.ordersService.findUserAddresses(req.user.id);
  }

  @Patch('addresses/:id/set-default')
  @UseGuards(AuthGuard('jwt'))
  setDefaultAddress(@Request() req, @Param('id') id: string) {
    return this.ordersService.setDefaultAddress(req.user.id, id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  updateOrder(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: { notes?: string }
  ) {
    return this.ordersService.updateOrder(id, updateData, req.user.id, req.user.role);
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  cancelOrder(
    @Request() req,
    @Param('id') id: string,
    @Body() cancelData: { reason: string }
  ) {
    return this.ordersService.cancelOrder(id, cancelData, req.user.id, req.user.role);
  }
}
