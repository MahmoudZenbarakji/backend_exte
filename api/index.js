// Vercel serverless function entry point
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    
    // Enable CORS for Vercel deployment
    app.enableCors({
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://*.vercel.app',
        'https://exte-frontend.vercel.app',
        'https://exte-ecommerce.vercel.app'
      ],
      credentials: true,
    });
    
    await app.init();
  }
  return app;
}

module.exports = async (req, res) => {
  const app = await bootstrap();
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
};
