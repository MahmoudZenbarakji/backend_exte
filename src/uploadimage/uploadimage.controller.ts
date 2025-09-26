import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  UseGuards,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './uploadimage.service';
import { ProductsService } from '../product/product.service';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { MulterFile } from '../common/interfaces/multer-file.interface';

@Controller('upload')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly productsService: ProductsService
  ) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: MulterFile,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const filePath = await this.uploadService.uploadFile(file, folder);
    return {
      message: 'File uploaded successfully',
      filePath,
      url: this.uploadService.getFileUrl(filePath),
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: MulterFile[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const filePaths = await this.uploadService.uploadMultipleFiles(files, folder);
    return {
      message: 'Files uploaded successfully',
      filePaths,
      urls: filePaths.map(path => this.uploadService.getFileUrl(path)),
    };
  }

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const filePath = await this.uploadService.uploadFile(file, 'products');
    return {
      message: 'Product image uploaded successfully',
      filePath,
      url: this.uploadService.getFileUrl(filePath),
    };
  }

  @Post('product-images-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleProductImages(
    @UploadedFiles() files: MulterFile[],
    @Body('color') color?: string,
    @Body('productId') productId?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (!productId) {
      throw new BadRequestException('Product ID is required');
    }

    // Upload files
    const filePaths = await this.uploadService.uploadMultipleFiles(files, 'products');
    const imageData = filePaths.map((filePath, index) => ({
      url: this.uploadService.getFileUrl(filePath),
      color: color || null,
      isMain: index === 0, // First image is main
      order: index,
    }));

    // Save images to database in one operation
    const savedImages = await this.productsService.addMultipleImages(productId, imageData);

    return {
      message: 'Product images uploaded and saved successfully',
      images: savedImages,
      filePaths,
    };
  }

  @Post('category-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCategoryImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const filePath = await this.uploadService.uploadFile(file, 'categories');
    return {
      message: 'Category image uploaded successfully',
      filePath,
      url: this.uploadService.getFileUrl(filePath),
    };
  }

  @Post('collection-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCollectionImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const filePath = await this.uploadService.uploadFile(file, 'collections');
    return {
      message: 'Collection image uploaded successfully',
      filePath,
      url: this.uploadService.getFileUrl(filePath),
    };
  }

  @Post('user-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUserAvatar(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const filePath = await this.uploadService.uploadFile(file, 'users');
    return {
      message: 'User avatar uploaded successfully',
      filePath,
      url: this.uploadService.getFileUrl(filePath),
    };
  }

  @Delete('file')
  async deleteFile(@Body('filePath') filePath: string) {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    const deleted = await this.uploadService.deleteFile(filePath);
    return {
      message: deleted ? 'File deleted successfully' : 'File not found',
      deleted,
    };
  }
}
