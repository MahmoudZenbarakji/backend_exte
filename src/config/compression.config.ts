import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as compression from 'compression';

export const setupCompression = (app: NestExpressApplication) => {
  app.use(compression({
    // Compression level (1-9, 6 is default)
    level: 6,
    // Threshold for compression (bytes)
    threshold: 1024,
    // Filter function to determine if response should be compressed
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    // Compression options
    chunkSize: 16 * 1024, // 16KB chunks
    // Enable brotli compression if available
    brotli: {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 4,
      },
    },
  }));
};