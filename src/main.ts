// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.useGlobalPipes(new ValidationPipe({forbidNonWhitelisted:true, whitelist:true}));
//   //app.setGlobalPrefix("api/v1")
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { setupCompression } from './config/compression.config';
import { setupSecurity } from './config/security.config';
import { throttlerConfig } from './throttler/throttler.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Setup security middleware
  setupSecurity(app);

  // Setup compression middleware
  setupCompression(app);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://localhost:5174',
      'https://*.vercel.app',
      'https://exte-frontend.vercel.app',
      'https://exte-ecommerce.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe with enhanced options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Serve static files (uploaded images)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EXTE E-commerce API')
    .setDescription('The EXTE E-commerce API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  
  // Listen on all interfaces for deployment
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 EXTE E-commerce API is running on: http://0.0.0.0:${port}`);
  logger.log(`📚 API Documentation: http://0.0.0.0:${port}/api/docs`);
  logger.log(`🔒 Security headers enabled`);
  logger.log(`🗜️ Compression enabled`);
  logger.log(`⚡ Performance optimizations active`);
}

bootstrap();
