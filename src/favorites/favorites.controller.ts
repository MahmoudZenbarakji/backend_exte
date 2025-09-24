import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  create(@Request() req, @Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.create(req.user.id, createFavoriteDto);
  }

  @Get()
  findByUser(@Request() req) {
    return this.favoritesService.findByUser(req.user.id);
  }

  @Get('check/:productId')
  checkFavorite(@Request() req, @Param('productId') productId: string) {
    return this.favoritesService.isFavorite(req.user.id, productId);
  }

  @Delete('product/:productId')
  removeByProduct(@Request() req, @Param('productId') productId: string) {
    return this.favoritesService.remove(req.user.id, productId);
  }

  @Delete(':id')
  removeById(@Request() req, @Param('id') id: string) {
    return this.favoritesService.removeById(req.user.id, id);
  }
}
