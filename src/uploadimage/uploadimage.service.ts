import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH') || './uploads';
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 2097152; // 2MB (reduced from 5MB)

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['products', 'categories', 'collections', 'users', 'temp'];
    subdirs.forEach(subdir => {
      const dirPath = path.join(this.uploadPath, subdir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'temp'): Promise<string> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, folder, fileName);

    try {
      // Optimize and save image
      await this.optimizeImage(file.buffer, filePath);

      // Return relative URL (use WebP extension for optimized images)
      const optimizedFileName = fileName.replace(/\.[^/.]+$/, '.webp');
      return `/uploads/${folder}/${optimizedFileName}`;
    } catch (error) {
      // If optimization fails, save original file
      console.warn('Image optimization failed, saving original:', error.message);
      fs.writeFileSync(filePath, file.buffer);
      return `/uploads/${folder}/${fileName}`;
    }
  }

  private async optimizeImage(buffer: Buffer, outputPath: string): Promise<void> {
    const optimizedPath = outputPath.replace(/\.[^/.]+$/, '.webp');
    
    await sharp(buffer)
      .resize(1200, 1200, { // Max dimensions
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ 
        quality: 85,
        effort: 6 // Higher effort for better compression
      })
      .toFile(optimizedPath);
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder: string = 'temp'): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Remove leading slash and convert to absolute path
      const relativePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      const absolutePath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }

  getFileUrl(filePath: string): string {
    // Ensure the path starts with /uploads
    if (!filePath.startsWith('/uploads')) {
      return `/uploads/${filePath}`;
    }
    return filePath;
  }
}
