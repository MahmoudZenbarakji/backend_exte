import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { CreateCartItemDto,UpdateCartItemDto } from './dto/create-cart.dto';
@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  addItem(@Request() req, @Body() createCartItemDto: CreateCartItemDto) {
    return this.cartService.addItem(req.user.id, createCartItemDto);
  }

  @Get()
  findByUser(@Request() req) {
    return this.cartService.findByUser(req.user.id);
  }

  @Get('count')
  getCartCount(@Request() req) {
    return this.cartService.getCartCount(req.user.id);
  }

  @Patch('items/:id')
  updateItem(@Request() req, @Param('id') id: string, @Body() updateCartItemDto: UpdateCartItemDto) {
    return this.cartService.updateItem(req.user.id, id, updateCartItemDto);
  }

  @Delete('items/:id')
  removeItem(@Request() req, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.id, id);
  }

  @Delete('clear')
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
