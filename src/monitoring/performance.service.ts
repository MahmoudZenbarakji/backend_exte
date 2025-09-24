import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  // Track API response times
  trackApiResponseTime(endpoint: string, duration: number) {
    if (duration > 1000) { // Log slow requests (>1s)
      this.logger.warn(`Slow API response: ${endpoint} took ${duration}ms`);
    } else if (duration > 500) { // Log medium requests (>500ms)
      this.logger.log(`API response: ${endpoint} took ${duration}ms`);
    }
  }

  // Track database query performance
  trackDbQuery(query: string, duration: number) {
    if (duration > 100) { // Log slow queries (>100ms)
      this.logger.warn(`Slow DB query: ${query} took ${duration}ms`);
    }
  }

  // Track cache hit/miss rates
  trackCacheHit(key: string) {
    this.logger.debug(`Cache hit: ${key}`);
  }

  trackCacheMiss(key: string) {
    this.logger.debug(`Cache miss: ${key}`);
  }

  // Memory usage tracking
  trackMemoryUsage() {
    const used = process.memoryUsage();
    const memoryInfo = {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(used.external / 1024 / 1024 * 100) / 100,
    };
    
    this.logger.log(`Memory usage: ${JSON.stringify(memoryInfo)} MB`);
    return memoryInfo;
  }
}
