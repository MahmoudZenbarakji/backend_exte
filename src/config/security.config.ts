import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

export const setupSecurity = (app: NestExpressApplication) => {
  app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false,
    // Cross-Origin Opener Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },
    // Frameguard
    frameguard: { action: 'deny' },
    // Hide X-Powered-By
    hidePoweredBy: true,
    // HSTS
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // IE No Open
    ieNoOpen: true,
    // No Sniff
    noSniff: true,
    // Origin Agent Cluster
    originAgentCluster: true,
    // Referrer Policy
    referrerPolicy: { policy: "no-referrer" },
    // XSS Filter
    xssFilter: true,
  }));
};
